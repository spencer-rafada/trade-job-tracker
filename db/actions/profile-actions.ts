"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Profile, ProfileUpdateInput, ProfileWithCrew } from "@/lib/types";

/**
 * Get the current user's profile
 */
export async function getMyProfile(): Promise<ProfileWithCrew | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(`
      *,
      crews (
        id,
        name
      )
    `)
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data as ProfileWithCrew;
}

/**
 * Update the current user's profile
 * Users can only update their first_name, last_name, and phone_number
 */
export async function updateMyProfile(updates: ProfileUpdateInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Validate that only allowed fields are being updated
  const allowedUpdates: ProfileUpdateInput = {
    first_name: updates.first_name?.trim(),
    last_name: updates.last_name?.trim(),
    phone_number: updates.phone_number?.trim() || null,
  };

  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...allowedUpdates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: error.message };
  }

  // Revalidate all pages that might display user info
  revalidatePath("/");
  revalidatePath("/settings/profile");

  return { success: true, data };
}
