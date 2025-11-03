/**
 * Job type definitions
 * Matches the structure from Supabase queries with joined data
 */

// ============================================================
// NEW JOB LOGGING SYSTEM TYPES
// ============================================================

/**
 * Job Template (Admin creates)
 * Jobs are not assigned to specific crews - any crew can work any job
 */
export type JobTemplate = {
  id: string;
  job_name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * Job Elevation (Admin creates, multiple per job)
 * Each job can have multiple elevations with different yardage and rates
 */
export type JobElevation = {
  id: string;
  job_id: string;
  elevation_name: string;
  yardage: number;
  rate: number;
  total: number; // computed: yardage * rate
  created_at: string;
  updated_at: string;
  jobs?: JobTemplate;
};

/**
 * Job Log (Foreman creates when logging completed work)
 * Records which crew worked on which job/elevation
 */
export type JobLog = {
  id: string;
  job_id: string;
  elevation_id: string;
  lot: string | null;
  date_worked: string;
  crew_id: string;
  created_by: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  jobs?: JobTemplate;
  job_elevations?: JobElevation;
  crews?: {
    id: string;
    name: string;
    trades?: {
      id: string;
      trade_name: string;
    } | null;
  };
  profiles?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
};

/**
 * Form data for foreman job logging
 */
export type JobLogFormData = {
  job_id: string;
  elevation_id: string;
  lot: string;
  date_worked?: string;
  notes?: string;
};

/**
 * Form data for admin job template creation
 */
export type JobTemplateFormData = {
  job_name: string;
  active?: boolean;
};

/**
 * Form data for admin elevation creation
 */
export type JobElevationFormData = {
  job_id: string;
  elevation_name: string;
  yardage: number;
  rate: number;
};

// ============================================================
// LEGACY JOB TYPE (For backward compatibility during migration)
// ============================================================

/**
 * @deprecated Use JobLog instead. This type represents the old job structure.
 * Will be removed after full migration to new job logging system.
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
    trades: {
      id: string;
      trade_name: string;
    } | null;
  } | null;
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
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
