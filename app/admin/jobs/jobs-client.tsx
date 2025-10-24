"use client";

import * as React from "react";
import Link from "next/link";
import { AuthButton } from "@/components/auth-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobTable, getColumns, Toolbar } from "@/components/job-table";
import { Job, FilterPreset, JobStats } from "@/lib/types";
import { ROUTES } from "@/lib/routes";
import {
  getThisWeekRange,
  getLastWeekRange,
  getThisMonthRange,
  formatCurrency,
  formatNumber,
} from "@/lib/utils/date-helpers";
import { BarChart3, DollarSign, Package } from "lucide-react";

type Crew = {
  id: string;
  name: string;
  trade_id: string | null;
  trades: {
    id: string;
    trade_name: string;
  } | null;
};

type Trade = {
  id: string;
  trade_name: string;
};

interface JobsPageClientProps {
  jobs: Job[];
  crews: Crew[];
  trades: Trade[];
  profile: {
    id: string;
    full_name: string | null;
    role: string;
  };
}

export function JobsPageClient({ jobs, crews, trades }: JobsPageClientProps) {
  const [searchValue, setSearchValue] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<FilterPreset>("all");

  // Filter jobs by date range
  const filteredByDate = React.useMemo(() => {
    if (activeFilter === "all") return jobs;

    let dateRange;
    switch (activeFilter) {
      case "this-week":
        dateRange = getThisWeekRange();
        break;
      case "last-week":
        dateRange = getLastWeekRange();
        break;
      case "this-month":
        dateRange = getThisMonthRange();
        break;
      default:
        return jobs;
    }

    return jobs.filter((job) => {
      return job.date >= dateRange.startDate && job.date <= dateRange.endDate;
    });
  }, [jobs, activeFilter]);

  // Filter by search term
  const filteredJobs = React.useMemo(() => {
    if (!searchValue) return filteredByDate;

    const searchLower = searchValue.toLowerCase();
    return filteredByDate.filter((job) => {
      return (
        job.job_name?.toLowerCase().includes(searchLower) ||
        job.lot_address?.toLowerCase().includes(searchLower) ||
        job.elevation?.toLowerCase().includes(searchLower) ||
        job.crews?.name.toLowerCase().includes(searchLower) ||
        job.profiles?.full_name?.toLowerCase().includes(searchLower) ||
        job.notes?.toLowerCase().includes(searchLower)
      );
    });
  }, [filteredByDate, searchValue]);

  // Calculate stats for filtered jobs
  const stats: JobStats = React.useMemo(() => {
    return {
      totalJobs: filteredJobs.length,
      totalYardage: filteredJobs.reduce((sum, job) => sum + Number(job.yardage), 0),
      totalRevenue: filteredJobs.reduce((sum, job) => sum + Number(job.total), 0),
    };
  }, [filteredJobs]);

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
              <Link href={ROUTES.ADMIN.TRADES} className="hover:underline">
                Trades
              </Link>
              <Link href={ROUTES.ADMIN.JOBS} className="underline font-semibold">
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
          <h1 className="text-3xl font-bold mb-2">Job Management</h1>
          <p className="text-muted-foreground">
            View and manage all jobs across all crews
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalJobs}</div>
              <p className="text-xs text-muted-foreground">
                {activeFilter === "all" ? "All time" : "Filtered view"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Yardage</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.totalYardage)}</div>
              <p className="text-xs text-muted-foreground">
                Across all filtered jobs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                {activeFilter === "all" ? "All time" : "Filtered view"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar and Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <Toolbar
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
            <JobTable columns={getColumns(crews, trades)} data={filteredJobs} />
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
