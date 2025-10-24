"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthButton } from "@/components/auth-button";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { createJob, type JobFormData } from "@/db/actions/job-actions";

type Profile = {
  id: string;
  full_name: string | null;
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);

    const jobData: JobFormData = {
      job_name: formData.get("job_name") as string,
      elevation: formData.get("elevation") as string,
      lot_address: formData.get("lot_address") as string,
      yardage: parseFloat(formData.get("yardage") as string),
      rate: parseFloat(formData.get("rate") as string),
      crew_id: profile.crew_id!,
      notes: formData.get("notes") as string,
      date: formData.get("date") as string,
    };

    const result = await createJob(jobData);

    setLoading(false);

    if (result.success) {
      setMessage({ type: "success", text: "Job added successfully!" });
      // Reset form
      (e.target as HTMLFormElement).reset();
      // Auto-clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: "error", text: result.error || "Failed to add job" });
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
          <h1 className="text-3xl font-bold mb-2">Add Job</h1>
          <p className="text-muted-foreground">
            Log a new job for {profile.crews?.name}
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

              {/* Job Name */}
              <div className="space-y-2">
                <Label htmlFor="job_name">Job Name/Number *</Label>
                <Input
                  id="job_name"
                  name="job_name"
                  type="text"
                  placeholder="e.g., Smith Residence"
                  required
                  className="text-lg"
                />
              </div>

              {/* Elevation */}
              <div className="space-y-2">
                <Label htmlFor="elevation">Elevation</Label>
                <Input
                  id="elevation"
                  name="elevation"
                  type="text"
                  placeholder="e.g., 3rd Floor"
                />
              </div>

              {/* Lot/Address */}
              <div className="space-y-2">
                <Label htmlFor="lot_address">Lot/Address</Label>
                <Input
                  id="lot_address"
                  name="lot_address"
                  type="text"
                  placeholder="e.g., 123 Main St"
                />
              </div>

              {/* Yardage & Rate (side by side on desktop) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yardage">Yardage *</Label>
                  <Input
                    id="yardage"
                    name="yardage"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    required
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rate">Rate ($) *</Label>
                  <Input
                    id="rate"
                    name="rate"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    required
                    className="text-lg"
                  />
                </div>
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
                disabled={loading}
                className="w-full h-12 text-lg"
              >
                {loading ? "Adding Job..." : "Add Job"}
              </Button>
            </form>
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
