"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuthButton } from "@/components/auth-button";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { createJobLog, type JobLogFormData } from "@/db/actions/job-log-actions";
import {
  getActiveJobTemplates,
  getElevationsByJob,
} from "@/db/actions/job-template-actions";
import { JobTemplate, JobElevation } from "@/lib/types/job";
import { Clock } from "lucide-react";

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  crew_id: string | null;
  crews: {
    id: string;
    name: string;
  } | null;
};

export function ForemanDashboard({ profile }: { profile: Profile }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Job and elevation state
  const [jobs, setJobs] = useState<JobTemplate[]>([]);
  const [elevations, setElevations] = useState<JobElevation[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [selectedElevationId, setSelectedElevationId] = useState<string>("");
  const [selectedElevation, setSelectedElevation] = useState<JobElevation | null>(null);

  // Load active jobs on component mount
  useEffect(() => {
    async function loadJobs() {
      try {
        const activeJobs = await getActiveJobTemplates();
        setJobs(activeJobs);
      } catch (error) {
        console.error("Error loading jobs:", error);
        setMessage({ type: "error", text: "Failed to load jobs" });
      }
    }
    loadJobs();
  }, []);

  // Handle job selection - load elevations for selected job
  const handleJobChange = async (jobId: string) => {
    setSelectedJobId(jobId);
    setSelectedElevationId("");
    setSelectedElevation(null);

    try {
      const jobElevations = await getElevationsByJob(jobId);
      setElevations(jobElevations);
    } catch (error) {
      console.error("Error loading elevations:", error);
      setMessage({ type: "error", text: "Failed to load elevations" });
    }
  };

  // Handle elevation selection - update selected elevation details
  const handleElevationChange = (elevationId: string) => {
    setSelectedElevationId(elevationId);
    const elevation = elevations.find((e) => e.id === elevationId);
    setSelectedElevation(elevation || null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);

    const jobLogData: JobLogFormData = {
      job_id: selectedJobId,
      elevation_id: selectedElevationId,
      lot: formData.get("lot") as string,
      date_worked: formData.get("date") as string || undefined,
      notes: formData.get("notes") as string || undefined,
    };

    try {
      await createJobLog(jobLogData);
      setMessage({ type: "success", text: "Work logged successfully!" });

      // Reset form
      (e.target as HTMLFormElement).reset();
      setSelectedJobId("");
      setSelectedElevationId("");
      setSelectedElevation(null);
      setElevations([]);

      // Auto-clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error logging work:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to log work"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!profile.crew_id) {
    return (
      <div className="min-h-screen flex flex-col">
        <nav className="w-full border-b h-16 flex items-center px-4">
          <div className="w-full max-w-7xl mx-auto flex justify-between items-center">
            <Link href={ROUTES.HOME} className="font-bold text-lg">
              Trade Job Tracker
            </Link>
            <AuthButton />
          </div>
        </nav>

        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>No Crew Assigned</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You haven&apos;t been assigned to a crew yet. Please contact your
                administrator to get assigned to a crew.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Get today's date in YYYY-MM-DD format for default date input
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="w-full border-b h-16 flex items-center px-4">
        <div className="w-full max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href={ROUTES.HOME} className="font-bold text-lg">
              Trade Job Tracker
            </Link>
            <span className="text-sm text-muted-foreground">
              {profile.crews?.name}
            </span>
          </div>
          <AuthButton />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-3xl mx-auto p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Log Completed Work</h1>
          <p className="text-muted-foreground">
            Report work completed by {profile.crews?.name}
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200 dark:bg-green-950 dark:text-green-200"
                : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-950 dark:text-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={today}
                  required
                />
              </div>

              {/* Job Selection */}
              <div className="space-y-2">
                <Label htmlFor="job_id">Job *</Label>
                <Select
                  value={selectedJobId}
                  onValueChange={handleJobChange}
                  required
                >
                  <SelectTrigger className="text-lg">
                    <SelectValue placeholder="Select a job" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No active jobs available
                      </div>
                    ) : (
                      jobs.map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.job_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Elevation Selection (only show if job selected) */}
              {selectedJobId && (
                <div className="space-y-2">
                  <Label htmlFor="elevation_id">Elevation *</Label>
                  <Select
                    value={selectedElevationId}
                    onValueChange={handleElevationChange}
                    required
                  >
                    <SelectTrigger className="text-lg">
                      <SelectValue placeholder="Select elevation" />
                    </SelectTrigger>
                    <SelectContent>
                      {elevations.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          No elevations available for this job
                        </div>
                      ) : (
                        elevations.map((elev) => (
                          <SelectItem key={elev.id} value={elev.id}>
                            {elev.elevation_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Display elevation details (read-only) */}
              {selectedElevation && (
                <div className="p-4 bg-muted rounded-lg space-y-2 border">
                  <p className="text-sm font-semibold text-muted-foreground">
                    Work Details
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Yardage</p>
                      <p className="text-lg font-semibold">
                        {selectedElevation.yardage} yds
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Rate</p>
                      <p className="text-lg font-semibold">
                        ${selectedElevation.rate}/yd
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        ${selectedElevation.total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Lot (manual entry) */}
              <div className="space-y-2">
                <Label htmlFor="lot">Lot *</Label>
                <Input
                  id="lot"
                  name="lot"
                  type="text"
                  placeholder="e.g., Lot 42-B"
                  className="text-lg"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter lot number for accounting reconciliation
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  placeholder="Any additional details..."
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || !selectedJobId || !selectedElevationId}
                className="w-full h-12 text-lg"
              >
                {loading ? "Logging Work..." : "Log Work"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* My Hours Card */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <CardTitle>My Hours</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Submit and track your daily hours worked for payroll and compliance.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href={ROUTES.WORKER.HOURS}>Manage My Hours</Link>
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="w-full border-t py-4 text-center text-sm text-muted-foreground">
        <p>Trade Job Tracker © 2025</p>
      </footer>
    </div>
  );
}
