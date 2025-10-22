"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type JobFormData = {
  job_name: string;
  elevation?: string;
  lot_address?: string;
  yardage: number;
  rate: number;
  crew_id: string;
  notes?: string;
  date?: string;
};

/**
 * Create a new job
 */
export async function createJob(data: JobFormData) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: job, error } = await supabase
    .from("jobs")
    .insert({
      ...data,
      created_by: user.id,
      date: data.date || new Date().toISOString().split("T")[0],
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating job:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/");

  return { success: true, data: job };
}

/**
 * Get jobs for a specific crew
 */
export async function getJobsByCrew(crewId: string, limit?: number) {
  const supabase = await createClient();

  let query = supabase
    .from("jobs")
    .select(
      `
      *,
      crews (
        id,
        name
      ),
      profiles!jobs_created_by_fkey (
        id,
        full_name,
        email
      )
    `
    )
    .eq("crew_id", crewId)
    .order("date", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching jobs:", error);
    return [];
  }

  return data;
}

/**
 * Get all jobs (admin only)
 */
export async function getAllJobs(limit?: number) {
  const supabase = await createClient();

  let query = supabase
    .from("jobs")
    .select(
      `
      *,
      crews (
        id,
        name
      ),
      profiles!jobs_created_by_fkey (
        id,
        full_name,
        email
      )
    `
    )
    .order("date", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching jobs:", error);
    return [];
  }

  return data;
}

/**
 * Get jobs for a specific date range
 */
export async function getJobsByDateRange(
  startDate: string,
  endDate: string,
  crewId?: string
) {
  const supabase = await createClient();

  let query = supabase
    .from("jobs")
    .select(
      `
      *,
      crews (
        id,
        name
      ),
      profiles!jobs_created_by_fkey (
        id,
        full_name,
        email
      )
    `
    )
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: false });

  if (crewId) {
    query = query.eq("crew_id", crewId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching jobs:", error);
    return [];
  }

  return data;
}

/**
 * Get job statistics
 */
export async function getJobStats(crewId?: string) {
  const supabase = await createClient();

  let query = supabase.from("jobs").select("yardage, total");

  if (crewId) {
    query = query.eq("crew_id", crewId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching job stats:", error);
    return {
      totalJobs: 0,
      totalYardage: 0,
      totalRevenue: 0,
    };
  }

  const totalJobs = data.length;
  const totalYardage = data.reduce((sum, job) => sum + Number(job.yardage), 0);
  const totalRevenue = data.reduce((sum, job) => sum + Number(job.total), 0);

  return {
    totalJobs,
    totalYardage,
    totalRevenue,
  };
}

/**
 * Delete job (admin only)
 */
export async function deleteJob(jobId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("jobs").delete().eq("id", jobId);

  if (error) {
    console.error("Error deleting job:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/");

  return { success: true };
}
