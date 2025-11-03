"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthButton } from "@/components/auth-button";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { Clock, Calendar } from "lucide-react";

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  crew_id: string | null;
  hourly_rate: number | null;
  crews: {
    id: string;
    name: string;
  } | null;
};

export function WorkerDashboard({ profile }: { profile: Profile }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="w-full border-b h-16 flex items-center px-4">
        <div className="w-full max-w-7xl mx-auto flex justify-between items-center">
          <Link href={ROUTES.HOME} className="font-bold text-lg">
            Trade Job Tracker
          </Link>
          <AuthButton />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {profile.first_name} {profile.last_name}!
          </h1>
          <p className="text-muted-foreground">
            {profile.crews ? `${profile.crews.name} Crew` : "No crew assigned"}
          </p>
        </div>

        {/* Worker Info Card */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Your Hourly Rate</CardTitle>
            </CardHeader>
            <CardContent>
              {profile.hourly_rate ? (
                <p className="text-2xl font-bold">${profile.hourly_rate.toFixed(2)}/hr</p>
              ) : (
                <p className="text-sm text-muted-foreground">Not set - contact your admin</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Your Crew</CardTitle>
            </CardHeader>
            <CardContent>
              {profile.crews ? (
                <p className="text-2xl font-bold">{profile.crews.name}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Not assigned yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Hours Submission Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <CardTitle>Submit Your Hours</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Track your daily hours worked for accurate payroll and compliance.
              Make sure to submit your hours at the end of each work day.
            </p>
            <Button asChild className="w-full">
              <Link href={ROUTES.WORKER.HOURS}>
                <Calendar className="mr-2 h-4 w-4" />
                Manage My Hours
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Help Card */}
        {!profile.hourly_rate && (
          <Card className="mt-6 border-yellow-500">
            <CardHeader>
              <CardTitle className="text-sm">⚠️ Action Required</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your hourly rate hasn&apos;t been set yet. Please contact your administrator
                to have your hourly rate configured before submitting hours.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t py-4 text-center text-sm text-muted-foreground">
        <p>Trade Job Tracker © 2025</p>
      </footer>
    </div>
  );
}
