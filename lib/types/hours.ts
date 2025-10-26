export type Hours = {
  id: string;
  worker_id: string;
  date_worked: string;
  hours_worked: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type HoursWithWorker = Hours & {
  profiles: {
    id: string;
    full_name: string | null;
    email: string;
    hourly_rate: number | null;
    crew_id: string | null;
    crews?: {
      id: string;
      name: string;
    } | null;
  };
};

export type WorkerSummary = {
  worker_id: string;
  full_name: string;
  hourly_rate: number;
  total_hours: number;
  minimum_required_pay: number;
};

export type WeeklyCrewSummary = {
  week_start: string;
  week_end: string;
  total_job_earnings: number;
  total_minimum_required: number;
  bonus_pool: number;
  is_compliant: boolean;
  workers: WorkerSummary[];
};
