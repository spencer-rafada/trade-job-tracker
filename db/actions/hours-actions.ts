"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type HoursInput = {
  date_worked: string; // YYYY-MM-DD format
  hours_worked: number;
  notes?: string;
};

/**
 * Submit hours for a worker
 */
export async function submitHours(data: HoursInput) {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check if hours already submitted for this date
  const { data: existing } = await supabase
    .from("hours")
    .select("id")
    .eq("worker_id", user.id)
    .eq("date_worked", data.date_worked)
    .single();

  if (existing) {
    return {
      success: false,
      error: "Hours already submitted for this date. Please edit or delete existing entry."
    };
  }

  const { data: hours, error } = await supabase
    .from("hours")
    .insert({
      worker_id: user.id,
      ...data,
    })
    .select()
    .single();

  if (error) {
    console.error("Error submitting hours:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/worker/hours");
  revalidatePath("/admin/hours");

  return { success: true, data: hours };
}

/**
 * Update hours entry
 */
export async function updateHours(hoursId: string, data: HoursInput) {
  const supabase = await createClient();

  const { data: hours, error } = await supabase
    .from("hours")
    .update(data)
    .eq("id", hoursId)
    .select()
    .single();

  if (error) {
    console.error("Error updating hours:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/worker/hours");
  revalidatePath("/admin/hours");

  return { success: true, data: hours };
}

/**
 * Delete hours entry
 */
export async function deleteHours(hoursId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("hours")
    .delete()
    .eq("id", hoursId);

  if (error) {
    console.error("Error deleting hours:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/worker/hours");
  revalidatePath("/admin/hours");

  return { success: true };
}

/**
 * Get hours for current worker
 */
export async function getMyHours(startDate?: string, endDate?: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return [];

  let query = supabase
    .from("hours")
    .select("*")
    .eq("worker_id", user.id)
    .order("date_worked", { ascending: false });

  if (startDate) query = query.gte("date_worked", startDate);
  if (endDate) query = query.lte("date_worked", endDate);

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching hours:", error);
    return [];
  }

  return data;
}

/**
 * Get all hours for admin/foreman (filtered by date range)
 */
export async function getAllHours(startDate?: string, endDate?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("hours")
    .select(`
      *,
      profiles!hours_worker_id_fkey (
        id,
        first_name,
        last_name,
        email,
        hourly_rate,
        crew_id,
        crews (
          id,
          name
        )
      )
    `)
    .order("date_worked", { ascending: false });

  if (startDate) query = query.gte("date_worked", startDate);
  if (endDate) query = query.lte("date_worked", endDate);

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching all hours:", error);
    return [];
  }

  return data;
}

/**
 * Get weekly summary for a crew
 */
export async function getWeeklyCrewSummary(crewId: string, weekStart: string) {
  const supabase = await createClient();

  // Calculate week end (7 days from start)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  // Get all crew members
  const { data: crewMembers, error: crewError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, hourly_rate")
    .eq("crew_id", crewId);

  if (crewError) {
    console.error("Error fetching crew members:", crewError);
    return null;
  }

  const memberIds = crewMembers?.map(m => m.id) || [];

  // Get all hours for crew members in this week
  const { data: hours, error: hoursError } = await supabase
    .from("hours")
    .select(`
      *,
      profiles!hours_worker_id_fkey (
        id,
        first_name,
        last_name,
        hourly_rate
      )
    `)
    .gte("date_worked", weekStart)
    .lte("date_worked", weekEndStr)
    .in("worker_id", memberIds);

  if (hoursError) {
    console.error("Error fetching crew hours:", hoursError);
    return null;
  }

  // Get all jobs for this crew in this week
  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select("total")
    .eq("crew_id", crewId)
    .gte("date", weekStart)
    .lte("date", weekEndStr);

  if (jobsError) {
    console.error("Error fetching crew jobs:", jobsError);
    return null;
  }

  // Calculate totals
  const totalJobEarnings = jobs?.reduce((sum, job) => sum + Number(job.total), 0) || 0;

  // Group hours by worker
  const workerSummaries = hours?.reduce((acc, hour) => {
    const workerId = hour.worker_id;
    if (!acc[workerId]) {
      acc[workerId] = {
        worker_id: workerId,
        full_name: hour.profiles?.first_name && hour.profiles?.last_name
          ? `${hour.profiles.first_name} ${hour.profiles.last_name}`
          : "Unknown",
        hourly_rate: hour.profiles?.hourly_rate || 0,
        total_hours: 0,
        minimum_required_pay: 0,
      };
    }
    acc[workerId].total_hours += Number(hour.hours_worked);
    acc[workerId].minimum_required_pay =
      acc[workerId].total_hours * acc[workerId].hourly_rate;
    return acc;
  }, {} as Record<string, any>);

  const workers = Object.values(workerSummaries || {});
  const totalMinimumRequired = workers.reduce(
    (sum, w) => sum + w.minimum_required_pay, 0
  );

  return {
    week_start: weekStart,
    week_end: weekEndStr,
    total_job_earnings: totalJobEarnings,
    total_minimum_required: totalMinimumRequired,
    bonus_pool: totalJobEarnings - totalMinimumRequired,
    is_compliant: totalJobEarnings >= totalMinimumRequired,
    workers,
  };
}
