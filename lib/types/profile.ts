/**
 * Profile and User Types
 */

export type UserRole = "admin" | "foreman" | "worker";

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  role: UserRole;
  crew_id: string | null;
  hourly_rate: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileWithCrew extends Profile {
  crews: {
    id: string;
    name: string;
  } | null;
}

export interface ProfileUpdateInput {
  first_name?: string;
  last_name?: string;
  phone_number?: string | null;
}

export interface AdminProfileUpdateInput extends ProfileUpdateInput {
  role?: UserRole;
  crew_id?: string | null;
  hourly_rate?: number | null;
}
