'use server';

import { createClient } from '@/lib/supabase/server';
import {
  JobTemplate,
  JobElevation,
  JobTemplateFormData,
  JobElevationFormData,
} from '@/lib/types/job';

// ============================================================
// JOB TEMPLATE ACTIONS (Admin only)
// ============================================================

/**
 * Create a new job template
 * Admin only - creates a job that can have multiple elevations
 */
export async function createJobTemplate(data: JobTemplateFormData) {
  const supabase = await createClient();

  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      job_name: data.job_name,
      active: data.active ?? true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating job template:', error);
    throw new Error(`Failed to create job template: ${error.message}`);
  }

  return job as JobTemplate;
}

/**
 * Get all job templates (active and inactive)
 * Admin only - for job management interface
 */
export async function getAllJobTemplates() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('job_name');

  if (error) {
    console.error('Error fetching job templates:', error);
    throw new Error(`Failed to fetch job templates: ${error.message}`);
  }

  return data as JobTemplate[];
}

/**
 * Get only active job templates
 * For foreman dropdown - only shows jobs they can log work against
 */
export async function getActiveJobTemplates() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('active', true)
    .order('job_name');

  if (error) {
    console.error('Error fetching active jobs:', error);
    throw new Error(`Failed to fetch active jobs: ${error.message}`);
  }

  return data as JobTemplate[];
}

/**
 * Get a single job template by ID
 */
export async function getJobTemplateById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching job template:', error);
    throw new Error(`Failed to fetch job template: ${error.message}`);
  }

  return data as JobTemplate;
}

/**
 * Update a job template
 * Admin only - can update name or active status
 */
export async function updateJobTemplate(
  id: string,
  data: Partial<JobTemplateFormData>
) {
  const supabase = await createClient();

  const { data: job, error } = await supabase
    .from('jobs')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating job template:', error);
    throw new Error(`Failed to update job template: ${error.message}`);
  }

  return job as JobTemplate;
}

/**
 * Delete a job template
 * Admin only - CASCADE will also delete associated elevations and logs
 */
export async function deleteJobTemplate(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('jobs').delete().eq('id', id);

  if (error) {
    console.error('Error deleting job template:', error);
    throw new Error(`Failed to delete job template: ${error.message}`);
  }
}

/**
 * Archive a job template (set active = false)
 * Preferred over deletion to preserve historical data
 */
export async function archiveJobTemplate(id: string) {
  return updateJobTemplate(id, { active: false });
}

/**
 * Reactivate an archived job template
 */
export async function reactivateJobTemplate(id: string) {
  return updateJobTemplate(id, { active: true });
}

// ============================================================
// JOB ELEVATION ACTIONS (Admin only)
// ============================================================

/**
 * Add an elevation to a job template
 * Admin only - defines yardage and rate for a specific elevation
 */
export async function addElevationToJob(data: JobElevationFormData) {
  const supabase = await createClient();

  const { data: elevation, error } = await supabase
    .from('job_elevations')
    .insert({
      job_id: data.job_id,
      elevation_name: data.elevation_name,
      yardage: data.yardage,
      rate: data.rate,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding elevation:', error);
    throw new Error(`Failed to add elevation: ${error.message}`);
  }

  return elevation as JobElevation;
}

/**
 * Get all elevations for a specific job
 * Used by both admin (management) and foreman (dropdown)
 */
export async function getElevationsByJob(job_id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('job_elevations')
    .select('*')
    .eq('job_id', job_id)
    .order('elevation_name');

  if (error) {
    console.error('Error fetching elevations:', error);
    throw new Error(`Failed to fetch elevations: ${error.message}`);
  }

  return data as JobElevation[];
}

/**
 * Get a single elevation by ID
 */
export async function getElevationById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('job_elevations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching elevation:', error);
    throw new Error(`Failed to fetch elevation: ${error.message}`);
  }

  return data as JobElevation;
}

/**
 * Update an elevation
 * Admin only - can change elevation name, yardage, or rate
 */
export async function updateElevation(
  id: string,
  data: Partial<JobElevationFormData>
) {
  const supabase = await createClient();

  const { data: elevation, error } = await supabase
    .from('job_elevations')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating elevation:', error);
    throw new Error(`Failed to update elevation: ${error.message}`);
  }

  return elevation as JobElevation;
}

/**
 * Delete an elevation
 * Admin only - will fail if there are job logs referencing this elevation
 */
export async function deleteElevation(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('job_elevations').delete().eq('id', id);

  if (error) {
    console.error('Error deleting elevation:', error);
    throw new Error(`Failed to delete elevation: ${error.message}`);
  }
}

/**
 * Get all jobs with their elevations
 * Admin view - for comprehensive job template management
 */
export async function getJobsWithElevations() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('jobs')
    .select(
      `
      *,
      job_elevations (
        id,
        elevation_name,
        yardage,
        rate,
        total,
        created_at,
        updated_at
      )
    `
    )
    .order('job_name');

  if (error) {
    console.error('Error fetching jobs with elevations:', error);
    throw new Error(`Failed to fetch jobs with elevations: ${error.message}`);
  }

  return data as (JobTemplate & { job_elevations: JobElevation[] })[];
}

/**
 * Get active jobs with their elevations
 * Foreman view - only shows jobs they can log work against
 */
export async function getActiveJobsWithElevations() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('jobs')
    .select(
      `
      *,
      job_elevations (
        id,
        elevation_name,
        yardage,
        rate,
        total,
        created_at,
        updated_at
      )
    `
    )
    .eq('active', true)
    .order('job_name');

  if (error) {
    console.error('Error fetching active jobs with elevations:', error);
    throw new Error(
      `Failed to fetch active jobs with elevations: ${error.message}`
    );
  }

  return data as (JobTemplate & { job_elevations: JobElevation[] })[];
}
