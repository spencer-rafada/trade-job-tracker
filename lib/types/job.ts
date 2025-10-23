/**
 * Job type definitions
 * Matches the structure from Supabase queries with joined data
 */

export type Job = {
  id: string;
  date: string;
  job_name: string;
  elevation: string | null;
  lot_address: string | null;
  yardage: number;
  rate: number;
  total: number;
  crew_id: string;
  created_by: string;
  notes: string | null;
  created_at: string;
  crews: {
    id: string;
    name: string;
  } | null;
  profiles: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
};

/**
 * Job statistics type
 */
export type JobStats = {
  totalJobs: number;
  totalYardage: number;
  totalRevenue: number;
};

/**
 * Date range type for filtering
 */
export type DateRange = {
  startDate: string;
  endDate: string;
};

/**
 * Filter preset options
 */
export type FilterPreset = "all" | "this-week" | "last-week" | "this-month";
