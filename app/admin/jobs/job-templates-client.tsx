"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Archive, ArchiveRestore } from "lucide-react";
import { JobTemplate, JobElevation } from "@/lib/types/job";
import {
  createJobTemplate,
  deleteJobTemplate,
  archiveJobTemplate,
  reactivateJobTemplate,
  addElevationToJob,
  deleteElevation
} from "@/db/actions/job-template-actions";
import { AuthButton } from "@/components/auth-button";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";

type JobWithElevations = JobTemplate & { job_elevations: JobElevation[] };

type Props = {
  jobsWithElevations: JobWithElevations[];
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
  };
};

export function JobTemplatesClient({ jobsWithElevations: initialJobs }: Props) {
  const [jobs, setJobs] = useState<JobWithElevations[]>(initialJobs);
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);
  const [isAddElevationOpen, setIsAddElevationOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobWithElevations | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Create new job template
  const handleCreateJob = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const jobName = formData.get("job_name") as string;

    try {
      const newJob = await createJobTemplate({ job_name: jobName, active: true });
      setJobs([...jobs, { ...newJob, job_elevations: [] }]);
      setMessage({ type: "success", text: "Job template created successfully!" });
      setIsAddJobOpen(false);
      (e.target as HTMLFormElement).reset();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error creating job:", error);
      setMessage({ type: "error", text: "Failed to create job template" });
    } finally {
      setLoading(false);
    }
  };

  // Add elevation to job
  const handleAddElevation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedJob) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const newElevation = await addElevationToJob({
        job_id: selectedJob.id,
        elevation_name: formData.get("elevation_name") as string,
        yardage: parseFloat(formData.get("yardage") as string),
        rate: parseFloat(formData.get("rate") as string),
      });

      // Update local state
      setJobs(
        jobs.map((job) =>
          job.id === selectedJob.id
            ? { ...job, job_elevations: [...job.job_elevations, newElevation] }
            : job
        )
      );

      setMessage({ type: "success", text: "Elevation added successfully!" });
      setIsAddElevationOpen(false);
      (e.target as HTMLFormElement).reset();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error adding elevation:", error);
      setMessage({ type: "error", text: "Failed to add elevation" });
    } finally {
      setLoading(false);
    }
  };

  // Delete elevation
  const handleDeleteElevation = async (jobId: string, elevationId: string) => {
    if (!confirm("Are you sure you want to delete this elevation?")) return;

    try {
      await deleteElevation(elevationId);
      setJobs(
        jobs.map((job) =>
          job.id === jobId
            ? {
                ...job,
                job_elevations: job.job_elevations.filter((e) => e.id !== elevationId),
              }
            : job
        )
      );
      setMessage({ type: "success", text: "Elevation deleted successfully!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error deleting elevation:", error);
      setMessage({ type: "error", text: "Failed to delete elevation" });
    }
  };

  // Archive/Reactivate job
  const handleToggleArchive = async (job: JobWithElevations) => {
    try {
      if (job.active) {
        await archiveJobTemplate(job.id);
      } else {
        await reactivateJobTemplate(job.id);
      }

      setJobs(
        jobs.map((j) => (j.id === job.id ? { ...j, active: !j.active } : j))
      );

      setMessage({
        type: "success",
        text: job.active ? "Job archived successfully!" : "Job reactivated successfully!",
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error toggling archive:", error);
      setMessage({ type: "error", text: "Failed to update job status" });
    }
  };

  // Delete job template
  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job? This will also delete all its elevations.")) {
      return;
    }

    try {
      await deleteJobTemplate(jobId);
      setJobs(jobs.filter((j) => j.id !== jobId));
      setMessage({ type: "success", text: "Job deleted successfully!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error deleting job:", error);
      setMessage({ type: "error", text: "Failed to delete job" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="w-full border-b h-16 flex items-center px-4">
        <div className="w-full max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href={ROUTES.HOME} className="font-bold text-lg">
              Trade Job Tracker
            </Link>
            <div className="flex gap-4 text-sm">
              <Link href={ROUTES.ADMIN.USERS} className="hover:underline">
                Users
              </Link>
              <Link href={ROUTES.ADMIN.CREWS} className="hover:underline">
                Crews
              </Link>
              <Link href={ROUTES.ADMIN.TRADES} className="hover:underline">
                Trades
              </Link>
              <Link href={ROUTES.ADMIN.JOBS} className="underline font-semibold">
                Jobs
              </Link>
              <Link href={ROUTES.ADMIN.JOB_LOGS} className="hover:underline">
                Job Logs
              </Link>
              <Link href={ROUTES.ADMIN.HOURS} className="hover:underline">
                Hours
              </Link>
            </div>
          </div>
          <AuthButton />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Job Templates</h1>
              <p className="text-muted-foreground">
                Manage job templates and their elevations
              </p>
            </div>
        <Dialog open={isAddJobOpen} onOpenChange={setIsAddJobOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Job Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Job Template</DialogTitle>
              <DialogDescription>
                Add a new job template. You can add elevations after creating the job.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateJob}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="job_name">Job Name *</Label>
                  <Input
                    id="job_name"
                    name="job_name"
                    placeholder="e.g., Riverside Apartments Phase 2"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Job"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200 dark:bg-green-950 dark:text-green-200"
              : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-950 dark:text-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Jobs List */}
      <div className="space-y-4">
        {jobs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No job templates yet. Create one to get started.
            </CardContent>
          </Card>
        ) : (
          jobs.map((job) => (
            <Card key={job.id} className={!job.active ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {job.job_name}
                      {!job.active && (
                        <span className="text-sm font-normal text-muted-foreground">
                          (Archived)
                        </span>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {job.job_elevations.length} elevation(s)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleArchive(job)}
                    >
                      {job.active ? (
                        <>
                          <Archive className="mr-2 h-4 w-4" />
                          Archive
                        </>
                      ) : (
                        <>
                          <ArchiveRestore className="mr-2 h-4 w-4" />
                          Reactivate
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedJob(job);
                        setIsAddElevationOpen(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Elevation
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteJob(job.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {job.job_elevations.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No elevations yet. Add elevations to define yardage and rates.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {job.job_elevations.map((elev) => (
                      <div
                        key={elev.id}
                        className="flex justify-between items-center p-3 bg-muted rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-semibold">{elev.elevation_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {elev.yardage} yds × ${elev.rate}/yd = ${elev.total.toFixed(2)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteElevation(job.id, elev.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Elevation Dialog */}
      <Dialog open={isAddElevationOpen} onOpenChange={setIsAddElevationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Elevation</DialogTitle>
            <DialogDescription>
              Add a new elevation to {selectedJob?.job_name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddElevation}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="elevation_name">Elevation Name *</Label>
                <Input
                  id="elevation_name"
                  name="elevation_name"
                  placeholder="e.g., 3rd Floor, Basement"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yardage">Yardage *</Label>
                <Input
                  id="yardage"
                  name="yardage"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate">Rate ($/yd) *</Label>
                <Input
                  id="rate"
                  name="rate"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Elevation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t py-4 text-center text-sm text-muted-foreground">
        <p>Trade Job Tracker © 2025</p>
      </footer>
    </div>
  );
}
