# Job Logging Redesign Implementation Plan

## Overview

This document outlines the complete redesign of the job management system, transitioning from a foreman-creates-jobs model to an admin-creates-job-templates model where foremen only log completed work.

## Business Requirements

### Current System
- Foremen create jobs with free-text input for job name, elevation, yardage, and rate
- Jobs are tied to specific crews
- No standardization of job information

### New System
- **Admin** creates job templates with standardized elevations, yardage, and rates
- **Foremen** select from dropdown menus to log completed work
- Jobs are NOT crew-specific (any crew can work any job)
- Lot information is manually entered by foreman for offline reconciliation
- Yardage and rate are **read-only** for foremen (cannot be modified)

## Key Design Decisions

1. ✅ **No Crew Assignment to Jobs**: Jobs are available to all crews
2. ✅ **Fixed Rates**: Foremen cannot change yardage or rate values
3. ✅ **Manual Lot Entry**: Foremen enter lot as free text
4. ✅ **Job Logs for Accounting**: All work logs tied to job_id for financial tracking

---

## Database Schema Changes

### New Table Structure

#### 1. Jobs Table (Job Templates)
Admin-managed, no crew assignment:

```sql
CREATE TABLE jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name text NOT NULL,
    active boolean DEFAULT true,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);
```

**Changes from old schema:**
- ❌ Removed: `crew_id` (jobs no longer assigned to specific crews)
- ❌ Removed: `elevation`, `lot_address`, `yardage`, `rate`, `total` (moved to separate tables)
- ❌ Removed: `date`, `created_by`, `notes` (moved to job_logs)
- ✅ Added: `active` boolean for archiving completed projects

#### 2. Job Elevations Table (NEW)
Multiple elevations per job with fixed rates:

```sql
CREATE TABLE job_elevations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    elevation_name text NOT NULL,
    yardage numeric(10,2) NOT NULL,
    rate numeric(10,2) NOT NULL,
    total numeric(10,2) GENERATED ALWAYS AS (yardage * rate) STORED,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now(),
    UNIQUE(job_id, elevation_name)
);

CREATE INDEX idx_job_elevations_job_id ON job_elevations(job_id);
```

**Purpose:**
- One job can have multiple elevations (e.g., "1st Floor", "2nd Floor", "Basement")
- Each elevation has its own yardage and rate
- Total is auto-calculated by the database

#### 3. Job Logs Table (NEW)
Foreman work records:

```sql
CREATE TABLE job_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES jobs(id),
    elevation_id uuid NOT NULL REFERENCES job_elevations(id),
    lot text,
    date_worked date NOT NULL DEFAULT CURRENT_DATE,
    crew_id uuid NOT NULL REFERENCES crews(id),
    created_by uuid NOT NULL REFERENCES profiles(id),
    notes text,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

CREATE INDEX idx_job_logs_job_id ON job_logs(job_id);
CREATE INDEX idx_job_logs_crew_id ON job_logs(crew_id);
CREATE INDEX idx_job_logs_date ON job_logs(date_worked DESC);
CREATE INDEX idx_job_logs_elevation_id ON job_logs(elevation_id);
```

**Purpose:**
- Records each instance of completed work
- Links to job template and specific elevation
- Tracks which crew performed the work
- Stores manually-entered lot information

### Data Relationships

```
Jobs (1) ──→ (Many) Job Elevations
Job Elevations (1) ──→ (Many) Job Logs
Crews (1) ──→ (Many) Job Logs
Profiles (1) ──→ (Many) Job Logs (as creator)
```

### Row Level Security (RLS) Policies

```sql
-- Jobs: Admin full access, foreman read active jobs
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to jobs" ON jobs
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Foreman read active jobs" ON jobs
    FOR SELECT USING (active = true);

-- Job Elevations: Admin full access, foreman read
ALTER TABLE job_elevations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to elevations" ON job_elevations
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Foreman read elevations" ON job_elevations
    FOR SELECT USING (true);

-- Job Logs: Foreman create own crew, all read filtered
ALTER TABLE job_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Foreman create logs for own crew" ON job_logs
    FOR INSERT WITH CHECK (
        crew_id IN (
            SELECT crew_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users read own crew logs" ON job_logs
    FOR SELECT USING (
        crew_id IN (
            SELECT crew_id FROM profiles WHERE id = auth.uid()
        ) OR
        auth.jwt() ->> 'role' = 'admin'
    );
```

---

## Data Migration Strategy

### Migration File: `supabase/migrations/[timestamp]_job_logging_redesign.sql`

```sql
-- Step 1: Rename old table
ALTER TABLE jobs RENAME TO jobs_old;

-- Step 2: Create new tables
CREATE TABLE jobs (...);
CREATE TABLE job_elevations (...);
CREATE TABLE job_logs (...);

-- Step 3: Extract unique job names
INSERT INTO jobs (id, job_name, active)
SELECT DISTINCT
    gen_random_uuid(),
    job_name,
    true
FROM jobs_old;

-- Step 4: Extract unique elevations per job
INSERT INTO job_elevations (id, job_id, elevation_name, yardage, rate)
SELECT DISTINCT
    gen_random_uuid(),
    j.id,
    COALESCE(jo.elevation, 'Standard'),
    jo.yardage,
    jo.rate
FROM jobs_old jo
JOIN jobs j ON j.job_name = jo.job_name
WHERE jo.elevation IS NOT NULL;

-- Step 5: Migrate work records to job_logs
INSERT INTO job_logs (
    id,
    job_id,
    elevation_id,
    lot,
    date_worked,
    crew_id,
    created_by,
    notes,
    created_at,
    updated_at
)
SELECT
    jo.id,
    j.id,
    je.id,
    jo.lot_address,
    jo.date,
    jo.crew_id,
    jo.created_by,
    jo.notes,
    jo.created_at,
    jo.updated_at
FROM jobs_old jo
JOIN jobs j ON j.job_name = jo.job_name
JOIN job_elevations je ON je.job_id = j.id
    AND COALESCE(je.elevation_name, 'Standard') = COALESCE(jo.elevation, 'Standard')
    AND je.yardage = jo.yardage
    AND je.rate = jo.rate;

-- Step 6: Verify migration (manual check)
-- SELECT COUNT(*) FROM jobs_old;
-- SELECT COUNT(*) FROM job_logs;

-- Step 7: Drop old table (after verification)
-- DROP TABLE jobs_old;
```

**Migration Complexity:** HIGH
**Estimated Time:** 4-6 hours (including testing)

---

## TypeScript Type Definitions

### File: `lib/types/job.ts`

```typescript
// Job Template (Admin creates)
export type JobTemplate = {
  id: string;
  job_name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

// Job Elevation (Admin creates, multiple per job)
export type JobElevation = {
  id: string;
  job_id: string;
  elevation_name: string;
  yardage: number;
  rate: number;
  total: number; // computed
  created_at: string;
  updated_at: string;
};

// Job Log (Foreman creates)
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
  };
  profiles?: {
    first_name: string;
    last_name: string;
  };
};

// Form data for foreman logging
export type JobLogFormData = {
  job_id: string;
  elevation_id: string;
  lot?: string;
  date_worked?: string;
  notes?: string;
};

// Form data for admin job template
export type JobTemplateFormData = {
  job_name: string;
  active?: boolean;
};

// Form data for admin elevation
export type JobElevationFormData = {
  job_id: string;
  elevation_name: string;
  yardage: number;
  rate: number;
};
```

---

## Database Actions

### New File: `db/actions/job-template-actions.ts`

Admin-only operations for managing job templates and elevations:

**Functions:**
- `createJobTemplate(data)` - Create new job template
- `getAllJobTemplates()` - Get all jobs (active and inactive)
- `getActiveJobTemplates()` - Get only active jobs
- `updateJobTemplate(id, data)` - Update job details
- `deleteJobTemplate(id)` - Delete job template
- `addElevationToJob(data)` - Add elevation to job
- `getElevationsByJob(job_id)` - Get all elevations for a job
- `updateElevation(id, data)` - Update elevation details
- `deleteElevation(id)` - Delete elevation

### New File: `db/actions/job-log-actions.ts`

Foreman operations for logging completed work:

**Functions:**
- `createJobLog(data)` - Log completed work
- `getJobLogsByCrew(crew_id, startDate?, endDate?)` - Get logs for crew
- `getAllJobLogs(startDate?, endDate?)` - Admin view all logs
- `getJobLogsByJob(job_id)` - Get all work done on specific job
- `deleteJobLog(id)` - Delete log entry
- `getJobLogStats(startDate?, endDate?)` - Calculate totals

### Deprecated File: `db/actions/job-actions.ts`

This file will be split into the two new files above.

---

## User Interface Changes

### 1. Foreman Dashboard

**File:** `components/foreman-dashboard.tsx` (lines 143-207)

**Old Form:**
```tsx
// Free text inputs for everything
<Input name="job_name" />
<Input name="elevation" />
<Input name="lot_address" />
<Input name="yardage" />
<Input name="rate" />
```

**New Form:**
```tsx
// Step 1: Select Job (dropdown)
<Select name="job_id" onChange={loadElevations}>
  <SelectItem value={jobId}>{job.job_name}</SelectItem>
</Select>

// Step 2: Select Elevation (dropdown, populated based on job)
<Select name="elevation_id" onChange={showRateYardage}>
  <SelectItem value={elevId}>{elev.elevation_name}</SelectItem>
</Select>

// Display (read-only):
// - Yardage: {selectedElevation.yardage}
// - Rate: {selectedElevation.rate}
// - Total: {selectedElevation.total}

// Step 3: Enter Lot (text input)
<Input name="lot" placeholder="e.g., Lot 123" />

// Step 4: Date + Notes (existing)
<Input type="date" name="date" />
<Textarea name="notes" />
```

**Features:**
- Cascade dropdown: Job selection loads elevations
- Read-only display of yardage, rate, and total
- Manual lot entry
- Form validation ensures job and elevation are selected

**Estimated Time:** 3-4 hours

### 2. Admin Job Templates Management

**New File:** `app/admin/jobs/page.tsx`

**Capabilities:**
- Create new job templates (job name only)
- Add/edit/delete elevations for each job
- Set yardage and rate per elevation
- Archive/activate jobs
- View all job templates with expandable elevation details

**Form Design:**

```tsx
// Create Job Template:
<Input name="job_name" placeholder="Project Name" />
<Checkbox name="active" label="Active" defaultChecked />

// Add Elevation to Job:
<Input name="elevation_name" placeholder="e.g., 3rd Floor" />
<Input name="yardage" type="number" step="0.01" />
<Input name="rate" type="number" step="0.01" />
// Total: Auto-calculated display
```

**Estimated Time:** 5-7 hours

### 3. Admin Job Logs View

**New File:** `app/admin/job-logs/page.tsx`

View all completed work logs for accounting and reporting.

**Table Columns:**
| Date | Job Name | Elevation | Lot | Crew | Foreman | Yardage | Rate | Total |

**Features:**
- Filter by date range
- Search by job name, lot, crew
- Export to CSV for accounting software
- Summary statistics (total logs, total yardage, total revenue)
- Group by job for project-level reporting

**Estimated Time:** 3-4 hours

---

## Integration Points

### Hours Tracking Updates

**File:** `db/actions/hours-actions.ts` (around line 197)

**Old Query:**
```typescript
const { data: crewJobs } = await supabase
  .from('jobs')
  .select('*')
  .eq('crew_id', crewId)
  .gte('date', startDate)
  .lte('date', endDate);
```

**New Query:**
```typescript
const { data: crewJobLogs } = await supabase
  .from('job_logs')
  .select(`
    date_worked,
    lot,
    job_elevations (
      elevation_name,
      yardage,
      rate,
      total,
      jobs (
        job_name
      )
    )
  `)
  .eq('crew_id', crewId)
  .gte('date_worked', startDate)
  .lte('date_worked', endDate);

// Calculate total revenue from logs
const totalJobEarnings = crewJobLogs?.reduce((sum, log) => {
  return sum + (log.job_elevations?.total || 0);
}, 0) || 0;
```

**Impact:**
- No logic changes to payroll calculations
- Query updates only to use new schema
- Weekly crew summaries still calculate: job revenue vs. minimum wages

**Estimated Time:** 2-3 hours

---

## Implementation Phases

### Phase 1: Database Setup ⚠️ HIGHEST PRIORITY
**Tasks:**
1. Write migration script
2. Test on development database
3. Verify data integrity
4. Create backup plan

**Deliverables:**
- `supabase/migrations/[timestamp]_job_logging_redesign.sql`
- Migration verification queries
- Rollback plan

**Estimated Time:** 4-6 hours

**Risk Level:** HIGH (data migration)

---

### Phase 2: Backend Foundation
**Tasks:**
1. Update TypeScript types (`lib/types/job.ts`)
2. Create `db/actions/job-template-actions.ts`
3. Create `db/actions/job-log-actions.ts`
4. Update RLS policies
5. Write unit tests for new actions

**Deliverables:**
- Type definitions
- Server actions
- Test coverage

**Estimated Time:** 3-4 hours

**Risk Level:** MEDIUM

---

### Phase 3: Foreman Interface
**Tasks:**
1. Update `components/foreman-dashboard.tsx`
2. Implement cascade dropdowns
3. Add read-only elevation display
4. Update form submission logic
5. User testing

**Deliverables:**
- Updated foreman dashboard
- Form validation
- User acceptance testing

**Estimated Time:** 3-4 hours

**Risk Level:** MEDIUM

---

### Phase 4: Admin Interface
**Tasks:**
1. Create admin job template management UI
2. Create elevation management UI
3. Implement CRUD operations
4. Add archive/activate functionality

**Deliverables:**
- `app/admin/jobs/page.tsx`
- `app/admin/jobs/jobs-client.tsx`
- Admin UI components

**Estimated Time:** 5-7 hours

**Risk Level:** LOW

---

### Phase 5: Reporting & Integration
**Tasks:**
1. Create admin job logs view
2. Update hours tracking queries
3. Test weekly payroll summaries
4. Verify all statistics calculations

**Deliverables:**
- `app/admin/job-logs/page.tsx`
- Updated hours tracking
- End-to-end testing

**Estimated Time:** 4-5 hours

**Risk Level:** MEDIUM

---

### Phase 6: Testing & Deployment
**Tasks:**
1. Full regression testing
2. User acceptance testing (admin + foreman)
3. Performance testing
4. Production deployment
5. Monitor for issues

**Deliverables:**
- Test results documentation
- Deployment checklist
- User training materials (if needed)

**Estimated Time:** 2-3 hours

**Risk Level:** LOW

---

## Total Estimated Effort

| Phase | Time Estimate |
|-------|---------------|
| Phase 1: Database | 4-6 hours |
| Phase 2: Backend | 3-4 hours |
| Phase 3: Foreman UI | 3-4 hours |
| Phase 4: Admin UI | 5-7 hours |
| Phase 5: Reporting | 4-5 hours |
| Phase 6: Testing | 2-3 hours |
| **TOTAL** | **21-29 hours** |

---

## Files Changed Summary

### New Files
- ✅ `supabase/migrations/[timestamp]_job_logging_redesign.sql`
- ✅ `db/actions/job-template-actions.ts`
- ✅ `db/actions/job-log-actions.ts`
- ✅ `app/admin/jobs/jobs-client.tsx`
- ✅ `app/admin/job-logs/page.tsx`
- ✅ `app/admin/job-logs/job-logs-client.tsx`

### Modified Files
- ✅ `lib/types/job.ts` - New type definitions
- ✅ `components/foreman-dashboard.tsx` - Dropdown interface (lines 143-207)
- ✅ `db/actions/hours-actions.ts` - Query updates (around line 197)
- ✅ `app/admin/jobs/page.tsx` - Job template management

### Deprecated Files
- ❌ `db/actions/job-actions.ts` - Split into job-template-actions and job-log-actions

---

## Example Workflows

### Admin Workflow: Creating a Job

```
1. Navigate to Admin > Jobs
2. Click "Add Job Template"
3. Enter job name: "Riverside Apartments Phase 2"
4. Click Save

5. In the job template view, click "Add Elevation"
6. Enter:
   - Elevation Name: "1st Floor"
   - Yardage: 500
   - Rate: 15
   - (Total auto-calculated: $7,500)
7. Click Save

8. Repeat for other elevations:
   - "2nd Floor" | 450 yds | $15/yd = $6,750
   - "3rd Floor" | 450 yds | $18/yd = $8,100
   - "Basement" | 300 yds | $20/yd = $6,000
```

### Foreman Workflow: Logging Work

```
1. Navigate to Foreman Dashboard
2. In "Log Completed Work" form:
   - Date: [defaults to today]
   - Job: [Dropdown] Select "Riverside Apartments Phase 2"
   - Elevation: [Dropdown] Select "2nd Floor"
   - [Display shows: 450 yds @ $15/yd = $6,750]
   - Lot: Enter "Lot 42-B"
   - Notes: (Optional) "Completed west wing"
3. Click "Log Work"
4. Success message appears, form resets
```

### Accounting Workflow: Job Report

```
1. Navigate to Admin > Job Logs
2. Filter by job name: "Riverside Apartments Phase 2"
3. View table showing all work done:
   - 10/28 | Lot 42-B | Crew A | 2nd Floor | $6,750
   - 10/29 | Lot 43-A | Crew B | 1st Floor | $7,500
   - 10/30 | Lot 42-B | Crew A | 3rd Floor | $8,100
4. Summary: 3 logs, 1,400 total yards, $22,350 total revenue
5. Export to CSV for accounting software
```

---

## Testing Checklist

### Database Migration
- [ ] Backup production database
- [ ] Run migration on development environment
- [ ] Verify all old job records migrated to job_logs
- [ ] Verify job templates created correctly
- [ ] Verify elevations created with correct yardage/rate
- [ ] Check foreign key relationships
- [ ] Test RLS policies (admin, foreman, worker access)

### Foreman Interface
- [ ] Can see all active jobs in dropdown
- [ ] Selecting job loads correct elevations
- [ ] Yardage/rate/total display correctly (read-only)
- [ ] Can enter lot text
- [ ] Form validation works (required fields)
- [ ] Successful submission creates job_log
- [ ] Cannot modify yardage or rate
- [ ] Form resets after submission

### Admin Interface
- [ ] Can create new job templates
- [ ] Can add multiple elevations to a job
- [ ] Can edit elevation yardage/rate
- [ ] Total auto-calculates correctly
- [ ] Can delete elevations
- [ ] Can archive/activate jobs
- [ ] Archived jobs don't show in foreman dropdown
- [ ] Can delete job templates

### Reporting
- [ ] Job logs display all completed work
- [ ] Filter by date range works
- [ ] Search by job name works
- [ ] Statistics calculate correctly
- [ ] Can view all work for specific job
- [ ] Hours tracking still calculates payroll correctly
- [ ] Weekly crew summaries include job log revenue

---

## Rollback Plan

If critical issues occur after deployment:

1. **Database Rollback:**
```sql
-- Restore from backup
-- Or manually restore old jobs table:
ALTER TABLE job_logs RENAME TO job_logs_backup;
ALTER TABLE jobs RENAME TO jobs_backup;
ALTER TABLE job_elevations RENAME TO job_elevations_backup;
ALTER TABLE jobs_old RENAME TO jobs;
```

2. **Code Rollback:**
- Revert to previous commit
- Redeploy old version
- Keep migrated data for future retry

3. **Data Preservation:**
- Never delete jobs_old table until confirmed stable
- Export job_logs to CSV before rollback
- Document any new data created post-migration

---

## Success Criteria

### Functional Requirements
- ✅ Admin can create job templates with multiple elevations
- ✅ Foremen can only select from predefined jobs/elevations
- ✅ Yardage and rate are read-only for foremen
- ✅ All work logs tied to job_id for accounting
- ✅ Hours tracking payroll calculations still work correctly

### Performance Requirements
- ✅ Job dropdown loads in < 1 second
- ✅ Elevation cascade loads in < 500ms
- ✅ Form submission completes in < 2 seconds
- ✅ Admin job logs view loads in < 3 seconds

### Data Integrity Requirements
- ✅ No data loss during migration
- ✅ All old job records preserved in job_logs
- ✅ Foreign key relationships enforced
- ✅ RLS policies prevent unauthorized access

---

## Future Enhancements

### Possible Future Features (Not in Current Scope)

1. **Standardized Lot Dropdown:**
   - Admin pre-defines lot numbers per job
   - Foreman selects from dropdown instead of text entry
   - Reduces data entry errors

2. **Partial Work Logging:**
   - Allow foremen to log partial completion (e.g., 50% of elevation)
   - Add actual_yardage override field
   - Requires admin approval workflow

3. **Job Templates Library:**
   - Save common job configurations
   - Clone job templates for similar projects
   - Bulk import elevations from CSV

4. **Enhanced Reporting:**
   - Project-level P&L reports
   - Crew productivity analytics
   - Job cost variance tracking

5. **Mobile Optimization:**
   - Native mobile app for foremen
   - Offline mode for job logging
   - Photo attachments for work verification

---

## Questions & Answers

### Q: What happens if a foreman needs to report work on a job that hasn't been set up yet?
**A:** Foreman must contact admin to create the job template first. This ensures all pricing is standardized and approved before work is logged.

### Q: Can foremen see jobs from other crews?
**A:** Yes, all foremen can see all active jobs since crews are not assigned to specific jobs. Any crew can work any job.

### Q: What if the yardage or rate is wrong in the system?
**A:** Admin must update the elevation in the job template. Existing logs will continue to reference the elevation at the time it was logged (data integrity preserved).

### Q: How do we handle jobs with variable pricing?
**A:** Create multiple elevations with different rates. For example: "1st Floor - Standard" ($15/yd) and "1st Floor - Premium" ($18/yd).

### Q: Can we delete a job template that has existing logs?
**A:** Yes, but foreign key constraints must be considered. Recommended approach: Archive the job instead of deleting to preserve historical data.

---

## Document Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-29 | Claude Code | Initial implementation plan |

---

## Approval Sign-off

Before implementation begins:

- [ ] Client approval on schema design
- [ ] Client approval on UI workflows
- [ ] Development team review
- [ ] Database backup plan confirmed
- [ ] Testing strategy approved

---

*This document serves as the complete technical specification for the job logging redesign. All implementation work should reference this document for requirements and design decisions.*
