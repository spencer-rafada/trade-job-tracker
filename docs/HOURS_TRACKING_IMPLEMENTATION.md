# Hours Tracking Implementation Plan

## Overview

This document outlines the complete implementation plan for the hours tracking and labor compliance system. The system allows workers to submit daily hours, and provides admins with weekly crew summaries to ensure compliance with minimum wage requirements.

## Business Requirements

### Payment Structure
- Workers are paid primarily through **piece rate** (based on completed jobs)
- Each worker has an **hourly rate** that serves as their minimum wage
- **Weekly compliance check**: Crew's total job earnings must cover all workers' minimum required pay
- Formula: `Total Job Earnings >= Sum(Worker Hours × Hourly Rate)`

### Bonus Distribution
- After meeting minimum required pay, remaining earnings form a **bonus pool**
- Foreman distributes bonus at their discretion (tracked offline, not in system)
- System only validates that minimum requirements are met

---

## Phase 1: Database Schema

### Migration 1: Add hourly_rate to profiles

**File:** `supabase/migrations/YYYYMMDDHHMMSS_add_hourly_rate_to_profiles.sql`

```sql
-- Add hourly_rate column to profiles table
ALTER TABLE "public"."profiles"
ADD COLUMN "hourly_rate" numeric DEFAULT NULL;

COMMENT ON COLUMN "public"."profiles"."hourly_rate"
IS 'Hourly wage rate in dollars per hour (also serves as minimum wage for compliance)';
```

### Migration 2: Create hours table

**File:** `supabase/migrations/YYYYMMDDHHMMSS_create_hours_table.sql`

```sql
-- Create hours table for daily time tracking
CREATE TABLE "public"."hours" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "worker_id" uuid NOT NULL,
  "date_worked" date NOT NULL,
  "hours_worked" numeric NOT NULL,
  "notes" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "hours_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hours_worker_id_fkey" FOREIGN KEY ("worker_id")
    REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
  CONSTRAINT "hours_hours_worked_check" CHECK (hours_worked > 0)
);

-- Index for faster queries
CREATE INDEX "idx_hours_worker_id" ON "public"."hours"("worker_id");
CREATE INDEX "idx_hours_date_worked" ON "public"."hours"("date_worked");
CREATE INDEX "idx_hours_worker_date" ON "public"."hours"("worker_id", "date_worked");

-- Enable RLS
ALTER TABLE "public"."hours" ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Workers can only insert their own hours
CREATE POLICY "Workers can insert their own hours"
ON "public"."hours"
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = worker_id
);

-- Workers can view their own hours
CREATE POLICY "Workers can view their own hours"
ON "public"."hours"
FOR SELECT
TO authenticated
USING (
  auth.uid() = worker_id
);

-- Workers can update their own hours
CREATE POLICY "Workers can update their own hours"
ON "public"."hours"
FOR UPDATE
TO authenticated
USING (auth.uid() = worker_id)
WITH CHECK (auth.uid() = worker_id);

-- Workers can delete their own hours
CREATE POLICY "Workers can delete their own hours"
ON "public"."hours"
FOR DELETE
TO authenticated
USING (auth.uid() = worker_id);

-- Admins can manage all hours
CREATE POLICY "Admins can manage all hours"
ON "public"."hours"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "public"."profiles"
    WHERE "profiles"."id" = auth.uid()
    AND "profiles"."role" = 'admin'
  )
);

-- Foremen can view hours for their crew members
CREATE POLICY "Foremen can view their crew members hours"
ON "public"."hours"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "public"."profiles" p
    INNER JOIN "public"."crew_members" cm ON cm.user_id = p.id
    WHERE p.id = auth.uid()
    AND p.role = 'foreman'
    AND cm.crew_id IN (
      SELECT crew_id FROM "public"."crew_members"
      WHERE user_id = hours.worker_id
    )
  )
);

COMMENT ON TABLE "public"."hours" IS 'Daily hours submissions by workers for payroll and compliance tracking';
```

---

## Phase 2: Backend Actions

### File: `db/actions/hours-actions.ts`

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type HoursInput = {
  date_worked: string; // YYYY-MM-DD format
  hours_worked: number;
  notes?: string;
};

/**
 * Submit hours for a worker
 */
export async function submitHours(data: HoursInput) {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check if hours already submitted for this date
  const { data: existing } = await supabase
    .from("hours")
    .select("id")
    .eq("worker_id", user.id)
    .eq("date_worked", data.date_worked)
    .single();

  if (existing) {
    return {
      success: false,
      error: "Hours already submitted for this date. Please edit or delete existing entry."
    };
  }

  const { data: hours, error } = await supabase
    .from("hours")
    .insert({
      worker_id: user.id,
      ...data,
    })
    .select()
    .single();

  if (error) {
    console.error("Error submitting hours:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/worker/hours");
  revalidatePath("/admin/hours");

  return { success: true, data: hours };
}

/**
 * Update hours entry
 */
export async function updateHours(hoursId: string, data: HoursInput) {
  const supabase = await createClient();

  const { data: hours, error } = await supabase
    .from("hours")
    .update(data)
    .eq("id", hoursId)
    .select()
    .single();

  if (error) {
    console.error("Error updating hours:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/worker/hours");
  revalidatePath("/admin/hours");

  return { success: true, data: hours };
}

/**
 * Delete hours entry
 */
export async function deleteHours(hoursId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("hours")
    .delete()
    .eq("id", hoursId);

  if (error) {
    console.error("Error deleting hours:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/worker/hours");
  revalidatePath("/admin/hours");

  return { success: true };
}

/**
 * Get hours for current worker
 */
export async function getMyHours(startDate?: string, endDate?: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return [];

  let query = supabase
    .from("hours")
    .select("*")
    .eq("worker_id", user.id)
    .order("date_worked", { ascending: false });

  if (startDate) query = query.gte("date_worked", startDate);
  if (endDate) query = query.lte("date_worked", endDate);

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching hours:", error);
    return [];
  }

  return data;
}

/**
 * Get all hours for admin/foreman (filtered by date range)
 */
export async function getAllHours(startDate?: string, endDate?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("hours")
    .select(`
      *,
      profiles!hours_worker_id_fkey (
        id,
        full_name,
        email,
        hourly_rate,
        crew_members (
          crews (
            id,
            name
          )
        )
      )
    `)
    .order("date_worked", { ascending: false });

  if (startDate) query = query.gte("date_worked", startDate);
  if (endDate) query = query.lte("date_worked", endDate);

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching all hours:", error);
    return [];
  }

  return data;
}

/**
 * Get weekly summary for a crew
 */
export async function getWeeklyCrewSummary(crewId: string, weekStart: string) {
  const supabase = await createClient();

  // Calculate week end (7 days from start)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  // Get all hours for crew members in this week
  const { data: hours, error: hoursError } = await supabase
    .from("hours")
    .select(`
      *,
      profiles!hours_worker_id_fkey (
        id,
        full_name,
        hourly_rate
      )
    `)
    .gte("date_worked", weekStart)
    .lte("date_worked", weekEndStr)
    .in("worker_id",
      supabase
        .from("crew_members")
        .select("user_id")
        .eq("crew_id", crewId)
    );

  if (hoursError) {
    console.error("Error fetching crew hours:", hoursError);
    return null;
  }

  // Get all jobs for this crew in this week
  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select("total")
    .eq("crew_id", crewId)
    .gte("date", weekStart)
    .lte("date", weekEndStr);

  if (jobsError) {
    console.error("Error fetching crew jobs:", jobsError);
    return null;
  }

  // Calculate totals
  const totalJobEarnings = jobs?.reduce((sum, job) => sum + Number(job.total), 0) || 0;

  // Group hours by worker
  const workerSummaries = hours?.reduce((acc, hour) => {
    const workerId = hour.worker_id;
    if (!acc[workerId]) {
      acc[workerId] = {
        worker_id: workerId,
        full_name: hour.profiles?.full_name || "Unknown",
        hourly_rate: hour.profiles?.hourly_rate || 0,
        total_hours: 0,
        minimum_required_pay: 0,
      };
    }
    acc[workerId].total_hours += Number(hour.hours_worked);
    acc[workerId].minimum_required_pay =
      acc[workerId].total_hours * acc[workerId].hourly_rate;
    return acc;
  }, {} as Record<string, any>);

  const workers = Object.values(workerSummaries || {});
  const totalMinimumRequired = workers.reduce(
    (sum, w) => sum + w.minimum_required_pay, 0
  );

  return {
    week_start: weekStart,
    week_end: weekEndStr,
    total_job_earnings: totalJobEarnings,
    total_minimum_required: totalMinimumRequired,
    bonus_pool: totalJobEarnings - totalMinimumRequired,
    is_compliant: totalJobEarnings >= totalMinimumRequired,
    workers,
  };
}
```

### Update: `db/actions/user-actions.ts`

Add hourly_rate support to user creation/update:

```typescript
// Add to createUser function
export async function createUser(userData: {
  email: string;
  password: string;
  full_name: string;
  role: string;
  hourly_rate?: number;
}) {
  // ... existing code ...

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: userData.email,
      full_name: userData.full_name,
      role: userData.role,
      hourly_rate: userData.hourly_rate || null,
    })
    .select()
    .single();

  // ... rest of code ...
}

// Add to updateUserProfile function
export async function updateUserProfile(
  userId: string,
  updates: {
    full_name?: string;
    role?: string;
    hourly_rate?: number | null;
  }
) {
  // ... existing code ...
}
```

---

## Phase 3: TypeScript Types

### File: `lib/types/hours.ts` (new file)

```typescript
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
    crew_members: {
      crews: {
        id: string;
        name: string;
      };
    }[];
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
```

---

## Phase 4: Worker UI Components

### Page: `app/worker/hours/page.tsx`

```typescript
import { redirect } from "next/navigation";
import { getCurrentUser, getUserProfile } from "@/db/actions/user-actions";
import { getMyHours } from "@/db/actions/hours-actions";
import { HoursSubmission } from "@/components/hours-submission";
import { ROUTES } from "@/lib/routes";

export default async function WorkerHoursPage() {
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.AUTH.LOGIN);

  const profile = await getUserProfile(user.id);
  if (!profile || profile.role === 'admin') {
    redirect(ROUTES.HOME);
  }

  // Get recent hours (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDate = thirtyDaysAgo.toISOString().split('T')[0];

  const hours = await getMyHours(startDate);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="w-full border-b h-16 flex items-center px-4">
        <div className="w-full max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="font-bold text-lg">My Hours</h1>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8">
        <HoursSubmission
          recentHours={hours}
          hourlyRate={profile.hourly_rate}
        />
      </main>
    </div>
  );
}
```

### Component: `components/hours-submission.tsx`

```typescript
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { submitHours, updateHours, deleteHours } from "@/db/actions/hours-actions";
import { formatCurrency } from "@/lib/utils/date-helpers";

type Hours = {
  id: string;
  date_worked: string;
  hours_worked: number;
  notes: string | null;
};

interface HoursSubmissionProps {
  recentHours: Hours[];
  hourlyRate: number | null;
}

export function HoursSubmission({ recentHours, hourlyRate }: HoursSubmissionProps) {
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setSubmitting(true);

    const data = {
      date_worked: formData.get("date_worked") as string,
      hours_worked: parseFloat(formData.get("hours_worked") as string),
      notes: formData.get("notes") as string || undefined,
    };

    const result = editingId
      ? await updateHours(editingId, data)
      : await submitHours(data);

    setSubmitting(false);

    if (result.success) {
      setEditingId(null);
      // Reset form
      (document.getElementById("hours-form") as HTMLFormElement)?.reset();
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleDelete = async (id: string, date: string) => {
    if (!confirm(`Delete hours for ${date}?`)) return;

    const result = await deleteHours(id);
    if (!result.success) {
      alert(`Error: ${result.error}`);
    }
  };

  const handleEdit = (hours: Hours) => {
    setEditingId(hours.id);
    // Populate form
    (document.getElementById("date_worked") as HTMLInputElement).value = hours.date_worked;
    (document.getElementById("hours_worked") as HTMLInputElement).value = hours.hours_worked.toString();
    (document.getElementById("notes") as HTMLTextAreaElement).value = hours.notes || "";
  };

  return (
    <div className="space-y-6">
      {/* Rate Display */}
      {hourlyRate ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Your Hourly Rate:</span>
              <Badge variant="secondary" className="text-lg">
                {formatCurrency(hourlyRate)}/hr
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-yellow-500">
          <CardContent className="pt-6">
            <p className="text-yellow-600">
              ⚠️ No hourly rate set. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Submission Form */}
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Hours" : "Submit Hours"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            id="hours-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(new FormData(e.currentTarget));
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="date_worked">Date Worked *</Label>
              <Input
                id="date_worked"
                name="date_worked"
                type="date"
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours_worked">Hours Worked *</Label>
              <Input
                id="hours_worked"
                name="hours_worked"
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                placeholder="8.0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Job details, location, etc."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : editingId ? "Update" : "Submit"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    (document.getElementById("hours-form") as HTMLFormElement)?.reset();
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {recentHours.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hours submitted yet.
            </p>
          ) : (
            <div className="space-y-2">
              {recentHours.map((hours) => (
                <div
                  key={hours.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-semibold">
                      {new Date(hours.date_worked).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {hours.hours_worked} hours
                      {hourlyRate && ` • ${formatCurrency(hours.hours_worked * hourlyRate)}`}
                    </p>
                    {hours.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{hours.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(hours)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(hours.id, hours.date_worked)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Phase 5: Admin UI Components

### Page: `app/admin/hours/page.tsx`

```typescript
import { redirect } from "next/navigation";
import { requireAdmin } from "@/db/actions/user-actions";
import { getAllCrews } from "@/db/actions/crew-actions";
import { ROUTES } from "@/lib/routes";
import { WeeklyHoursSummary } from "@/components/weekly-hours-summary";

export default async function AdminHoursPage() {
  const profile = await requireAdmin();
  if (!profile) redirect(ROUTES.AUTH.LOGIN);

  const crews = await getAllCrews();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="w-full border-b h-16 flex items-center px-4">
        <div className="w-full max-w-7xl mx-auto">
          <h1 className="font-bold text-lg">Hours Management</h1>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        <WeeklyHoursSummary crews={crews} />
      </main>
    </div>
  );
}
```

### Component: `components/weekly-hours-summary.tsx`

See full component code in Phase 5 of the original plan above.

---

## Phase 6: Update User Management

### Update `components/user-management.tsx`

Add hourly rate field to the create/edit forms:

```typescript
// In create form
<div className="space-y-2">
  <Label htmlFor="hourly_rate">Hourly Rate ($/hr)</Label>
  <Input
    id="hourly_rate"
    name="hourly_rate"
    type="number"
    step="0.01"
    min="0"
    placeholder="20.00"
  />
</div>

// In edit form - similar addition
```

---

## Phase 7: Update Routes & Navigation

### Update `lib/routes.ts`

```typescript
export const ROUTES = {
  // ... existing routes ...

  WORKER: {
    HOURS: "/worker/hours",
  },

  ADMIN: {
    USERS: "/admin/users",
    CREWS: "/admin/crews",
    TRADES: "/admin/trades",
    JOBS: "/admin/jobs",
    HOURS: "/admin/hours",  // Add this
  },
} as const;
```

### Update Navigation
Add "Hours" link to:
- Admin navigation menus
- Worker navigation (if applicable)
- Admin dashboard card

---

## Implementation Order

1. ✅ **Database migrations** (profiles, hours table)
2. ✅ **Backend actions** (hours-actions.ts, update user-actions.ts)
3. ✅ **TypeScript types** (hours.ts)
4. ✅ **Update user management** (add hourly_rate field)
5. ✅ **Worker hours submission** (page + component)
6. ✅ **Admin weekly summary** (page + component)
7. ✅ **Navigation updates** (routes, links)
8. ✅ **Testing** (submit hours, view summaries, compliance checks)

---

## Testing Checklist

### Worker Flow
- [ ] Worker can submit hours for today
- [ ] Worker cannot submit duplicate hours for same date
- [ ] Worker can edit their submitted hours
- [ ] Worker can delete their submitted hours
- [ ] Worker can see their hourly rate
- [ ] Worker sees warning if no hourly rate set
- [ ] Worker can only see their own hours

### Admin Flow
- [ ] Admin can select crew and week
- [ ] Admin sees total job earnings for week
- [ ] Admin sees total minimum required pay
- [ ] Admin sees bonus pool calculation
- [ ] Admin sees compliance status (✅ or ⚠️)
- [ ] Admin sees individual worker breakdowns
- [ ] Compliance check is accurate

### User Management
- [ ] Admin can set hourly rate when creating user
- [ ] Admin can update user's hourly rate
- [ ] Hourly rate displays in user list
- [ ] Hourly rate is optional (can be null)

---

## Future Enhancements (Not in MVP)

- Export weekly summaries to CSV/Excel
- Email notifications for missing hours submissions
- Foreman ability to view their crew's hours
- Historical compliance reports
- Bonus distribution tracking (if needed later)
- Multi-week summaries
