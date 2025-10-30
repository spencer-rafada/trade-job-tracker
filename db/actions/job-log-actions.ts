'use server';

import { createClient } from '@/lib/supabase/server';
import { JobLog, JobLogFormData } from '@/lib/types/job';

// ============================================================
// JOB LOG ACTIONS (Foreman creates, Admin views)
// ============================================================

/**
 * Create a job log entry
 * Foreman logs completed work by selecting job and elevation
 * Automatically captures crew_id from user's profile
 */
export async function createJobLog(data: JobLogFormData) {
  const supabase = await createClient();

  // Validate required fields
  if (!data.job_id || !data.elevation_id || !data.lot) {
    throw new Error('Job, elevation, and lot are required fields');
  }

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  // Get user's crew_id from profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('crew_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.crew_id) {
    console.error('Error fetching user profile:', profileError);
    throw new Error('User not assigned to a crew');
  }

  // Create the job log
  const { data: log, error } = await supabase
    .from('job_logs')
    .insert({
      job_id: data.job_id,
      elevation_id: data.elevation_id,
      lot: data.lot,
      date_worked: data.date_worked || new Date().toISOString().split('T')[0],
      crew_id: profile.crew_id,
      created_by: user.id,
      notes: data.notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating job log:', error);
    throw new Error(`Failed to create job log: ${error.message}`);
  }

  return log as JobLog;
}

/**
 * Get job logs for a specific crew
 * Foreman view - see work completed by their crew
 */
export async function getJobLogsByCrew(
  crew_id: string,
  startDate?: string,
  endDate?: string
) {
  const supabase = await createClient();

  let query = supabase
    .from('job_logs')
    .select(
      `
      *,
      jobs (
        id,
        job_name,
        active
      ),
      job_elevations (
        id,
        elevation_name,
        yardage,
        rate,
        total
      ),
      crews (
        id,
        name
      ),
      profiles (
        id,
        first_name,
        last_name,
        email
      )
    `
    )
    .eq('crew_id', crew_id)
    .order('date_worked', { ascending: false });

  if (startDate) {
    query = query.gte('date_worked', startDate);
  }
  if (endDate) {
    query = query.lte('date_worked', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching job logs by crew:', error);
    throw new Error(`Failed to fetch job logs: ${error.message}`);
  }

  return data as JobLog[];
}

/**
 * Get all job logs (Admin only)
 * For accounting and reporting purposes
 */
export async function getAllJobLogs(startDate?: string, endDate?: string) {
  const supabase = await createClient();

  let query = supabase
    .from('job_logs')
    .select(
      `
      *,
      jobs (
        id,
        job_name,
        active
      ),
      job_elevations (
        id,
        elevation_name,
        yardage,
        rate,
        total
      ),
      crews (
        id,
        name
      ),
      profiles (
        id,
        first_name,
        last_name,
        email
      )
    `
    )
    .order('date_worked', { ascending: false });

  if (startDate) {
    query = query.gte('date_worked', startDate);
  }
  if (endDate) {
    query = query.lte('date_worked', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching all job logs:', error);
    throw new Error(`Failed to fetch all job logs: ${error.message}`);
  }

  return data as JobLog[];
}

/**
 * Get all job logs for a specific job
 * Admin/accounting - see all work done on a specific job
 */
export async function getJobLogsByJob(job_id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('job_logs')
    .select(
      `
      *,
      job_elevations (
        id,
        elevation_name,
        yardage,
        rate,
        total
      ),
      crews (
        id,
        name
      ),
      profiles (
        id,
        first_name,
        last_name,
        email
      )
    `
    )
    .eq('job_id', job_id)
    .order('date_worked', { ascending: false });

  if (error) {
    console.error('Error fetching job logs by job:', error);
    throw new Error(`Failed to fetch job logs for this job: ${error.message}`);
  }

  return data as JobLog[];
}

/**
 * Get job logs for current user's crew
 * Convenience method for foreman dashboard
 */
export async function getMyCrewJobLogs(startDate?: string, endDate?: string) {
  const supabase = await createClient();

  // Get current user's crew
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('crew_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.crew_id) {
    throw new Error('User not assigned to a crew');
  }

  return getJobLogsByCrew(profile.crew_id, startDate, endDate);
}

/**
 * Delete a job log
 * Admin only - for corrections
 */
export async function deleteJobLog(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('job_logs').delete().eq('id', id);

  if (error) {
    console.error('Error deleting job log:', error);
    throw new Error(`Failed to delete job log: ${error.message}`);
  }
}

/**
 * Get job log statistics
 * For dashboard summaries and reports
 */
export async function getJobLogStats(startDate?: string, endDate?: string) {
  const supabase = await createClient();

  let query = supabase.from('job_logs').select(
    `
      id,
      job_elevations (
        yardage,
        total
      )
    `
  );

  if (startDate) query = query.gte('date_worked', startDate);
  if (endDate) query = query.lte('date_worked', endDate);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching job log stats:', error);
    throw new Error(`Failed to fetch job log stats: ${error.message}`);
  }

  // Calculate statistics
  const stats = {
    totalJobs: data.length,
    totalYardage: data.reduce(
      (sum, log) => sum + (log.job_elevations?.yardage || 0),
      0
    ),
    totalRevenue: data.reduce(
      (sum, log) => sum + (log.job_elevations?.total || 0),
      0
    ),
  };

  return stats;
}

/**
 * Get job log stats for a specific crew
 */
export async function getCrewJobLogStats(
  crew_id: string,
  startDate?: string,
  endDate?: string
) {
  const supabase = await createClient();

  let query = supabase
    .from('job_logs')
    .select(
      `
      id,
      job_elevations (
        yardage,
        total
      )
    `
    )
    .eq('crew_id', crew_id);

  if (startDate) query = query.gte('date_worked', startDate);
  if (endDate) query = query.lte('date_worked', endDate);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching crew job log stats:', error);
    throw new Error(`Failed to fetch crew job log stats: ${error.message}`);
  }

  // Calculate statistics
  const stats = {
    totalJobs: data.length,
    totalYardage: data.reduce(
      (sum, log) => sum + (log.job_elevations?.yardage || 0),
      0
    ),
    totalRevenue: data.reduce(
      (sum, log) => sum + (log.job_elevations?.total || 0),
      0
    ),
  };

  return stats;
}

/**
 * Get job logs grouped by job for reporting
 * Useful for accounting to see all work per project
 */
export async function getJobLogsGroupedByJob(
  startDate?: string,
  endDate?: string
) {
  const supabase = await createClient();

  let query = supabase
    .from('job_logs')
    .select(
      `
      *,
      jobs (
        id,
        job_name,
        active
      ),
      job_elevations (
        id,
        elevation_name,
        yardage,
        rate,
        total
      ),
      crews (
        id,
        name
      )
    `
    )
    .order('jobs(job_name)')
    .order('date_worked', { ascending: false });

  if (startDate) query = query.gte('date_worked', startDate);
  if (endDate) query = query.lte('date_worked', endDate);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching job logs grouped:', error);
    throw new Error(`Failed to fetch grouped job logs: ${error.message}`);
  }

  // Group by job
  const grouped = (data as JobLog[]).reduce(
    (acc, log) => {
      const jobId = log.job_id;
      if (!acc[jobId]) {
        acc[jobId] = {
          job: log.jobs,
          logs: [],
          totalYardage: 0,
          totalRevenue: 0,
        };
      }
      acc[jobId].logs.push(log);
      acc[jobId].totalYardage += log.job_elevations?.yardage || 0;
      acc[jobId].totalRevenue += log.job_elevations?.total || 0;
      return acc;
    },
    {} as Record<
      string,
      {
        job: any;
        logs: JobLog[];
        totalYardage: number;
        totalRevenue: number;
      }
    >
  );

  return grouped;
}
