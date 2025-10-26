"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  Profile,
  ProfileWithCrew,
  AdminProfileUpdateInput,
} from "@/lib/types";

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Get user profile with crew information
 */
export async function getUserProfile(
  userId: string
): Promise<ProfileWithCrew | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(`
      *,
      crews (
        id,
        name
      )
    `)
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data as ProfileWithCrew;
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(): Promise<ProfileWithCrew[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(`
      *,
      crews (
        id,
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }

  return data as ProfileWithCrew[];
}

/**
 * Update user profile (admin only)
 */
export async function updateUserProfile(
  userId: string,
  updates: AdminProfileUpdateInput
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/users");
  revalidatePath("/");

  return { success: true, data };
}

/**
 * Check if current user is admin
 */
export async function isAdmin() {
  const user = await getCurrentUser();
  if (!user) return false;

  const profile = await getUserProfile(user.id);
  return profile?.role === "admin";
}

/**
 * Require admin authentication
 * Returns the admin profile if authenticated and authorized, null otherwise
 */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return null;

  const profile = await getUserProfile(user.id);
  if (!profile || profile.role !== "admin") return null;

  return profile;
}
