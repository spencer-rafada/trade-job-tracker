"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Get all crews with their trade information
 */
export async function getAllCrews() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("crews")
    .select(`
      *,
      trades (
        id,
        trade_name
      )
    `)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching crews:", error);
    return [];
  }

  return data;
}

/**
 * Get crew by ID
 */
export async function getCrewById(crewId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("crews")
    .select("*")
    .eq("id", crewId)
    .single();

  if (error) {
    console.error("Error fetching crew:", error);
    return null;
  }

  return data;
}

/**
 * Create a new crew (admin only)
 */
export async function createCrew(name: string, trade_id?: string) {
  const supabase = await createClient();

  const { data, error} = await supabase
    .from("crews")
    .insert({ name, trade_id: trade_id || null })
    .select()
    .single();

  if (error) {
    console.error("Error creating crew:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/crews");
  revalidatePath("/admin/jobs");
  revalidatePath("/");

  return { success: true, data };
}

/**
 * Update crew (admin only)
 */
export async function updateCrew(crewId: string, name: string, trade_id?: string | null) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("crews")
    .update({ name, trade_id: trade_id !== undefined ? trade_id : undefined })
    .eq("id", crewId)
    .select()
    .single();

  if (error) {
    console.error("Error updating crew:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/crews");
  revalidatePath("/admin/jobs");
  revalidatePath("/");

  return { success: true, data };
}

/**
 * Delete crew (admin only)
 */
export async function deleteCrew(crewId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("crews").delete().eq("id", crewId);

  if (error) {
    console.error("Error deleting crew:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/crews");
  revalidatePath("/");

  return { success: true };
}
