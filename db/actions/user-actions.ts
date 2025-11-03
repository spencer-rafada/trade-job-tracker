"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  Profile,
  ProfileWithCrew,
  AdminProfileUpdateInput,
  CreateUserInput,
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

/**
 * Create a new user (admin only)
 * This uses the Supabase Admin API to create users programmatically
 */
export async function createUser(input: CreateUserInput) {
  // Verify admin authorization
  const adminProfile = await requireAdmin();
  if (!adminProfile) {
    return {
      success: false,
      error: "Unauthorized. Only admins can create users."
    };
  }

  try {
    const adminClient = createAdminClient();

    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true, // Auto-confirm email since admin is creating
      user_metadata: {
        first_name: input.first_name,
        last_name: input.last_name,
        phone_number: input.phone_number || null,
      },
    });

    if (authError) {
      console.error("Error creating user in auth:", authError);
      return {
        success: false,
        error: authError.message || "Failed to create user"
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: "User creation failed - no user data returned"
      };
    }

    // Update the profile with role, crew, and hourly rate
    // The profile is automatically created by the database trigger
    // We just need to update it with the additional fields
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        role: input.role,
        crew_id: input.crew_id || null,
        hourly_rate: input.hourly_rate || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", authData.user.id);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      // User is created but profile update failed
      // This is a partial success - we should log it but not fail completely
      return {
        success: true,
        warning: "User created but profile update failed. Please update the user's profile manually.",
        data: authData.user,
      };
    }

    revalidatePath("/admin/users");

    return {
      success: true,
      data: authData.user,
      message: `User ${input.email} created successfully.`
    };
  } catch (error) {
    console.error("Unexpected error creating user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred"
    };
  }
}
