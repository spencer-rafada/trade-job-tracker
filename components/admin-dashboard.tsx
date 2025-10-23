"use client";

import { AuthButton } from "@/components/auth-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { Users, Layers, BarChart3 } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils/date-helpers";
import { JobStats } from "@/lib/types";

interface AdminDashboardProps {
  stats: JobStats;
}

export function AdminDashboard({ stats }: AdminDashboardProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="w-full border-b h-16 flex items-center px-4">
        <div className="w-full max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href={ROUTES.HOME} className="font-bold text-lg">
              Trade Job Tracker
            </Link>
            <div className="hidden md:flex gap-4 text-sm">
              <Link href={ROUTES.ADMIN.USERS} className="hover:underline">
                Users
              </Link>
              <Link href={ROUTES.ADMIN.CREWS} className="hover:underline">
                Crews
              </Link>
              <Link href={ROUTES.ADMIN.JOBS} className="hover:underline">
                Jobs
              </Link>
            </div>
          </div>
          <AuthButton />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your team, crews, and track all jobs
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalJobs}</div>
              <p className="text-xs text-muted-foreground">
                All time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Yardage
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.totalYardage)}</div>
              <p className="text-xs text-muted-foreground">
                Across all crews
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                All time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Management Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* User Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <CardTitle>User Management</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Manage foremen, assign them to crews, and control access levels
              </p>
              <Button asChild className="w-full">
                <Link href={ROUTES.ADMIN.USERS}>Manage Users</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Crew Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                <CardTitle>Crew Management</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Create and manage crews, organize your workforce
              </p>
              <Button asChild className="w-full">
                <Link href={ROUTES.ADMIN.CREWS}>Manage Crews</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Job Management Card */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <CardTitle>Job Management</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              View, filter, and manage all jobs across all crews with powerful search and reporting tools
            </p>
            <Button asChild className="w-full">
              <Link href={ROUTES.ADMIN.JOBS}>View All Jobs</Link>
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
