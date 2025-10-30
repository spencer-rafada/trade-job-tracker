"use client";

import * as React from "react";
import Link from "next/link";
import { AuthButton } from "@/components/auth-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobTable, getColumns, Toolbar } from "@/components/job-table";
import { JobLog, JobStats } from "@/lib/types/job";
import { FilterPreset } from "@/lib/types";
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

interface JobLogsClientProps {
  initialJobLogs: JobLog[];
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
  };
}

export function JobLogsClient({ initialJobLogs }: JobLogsClientProps) {
  const [searchValue, setSearchValue] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<FilterPreset>("all");

  // Filter job logs by date range
  const filteredByDate = React.useMemo(() => {
    if (activeFilter === "all") return initialJobLogs;

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
        return initialJobLogs;
    }

    return initialJobLogs.filter((log) => {
      return log.date_worked >= dateRange.startDate && log.date_worked <= dateRange.endDate;
    });
  }, [initialJobLogs, activeFilter]);

  // Filter by search term
  const filteredLogs = React.useMemo(() => {
    if (!searchValue) return filteredByDate;

    const searchLower = searchValue.toLowerCase();
    return filteredByDate.filter((log) => {
      return (
        log.jobs?.job_name?.toLowerCase().includes(searchLower) ||
        log.lot?.toLowerCase().includes(searchLower) ||
        log.job_elevations?.elevation_name?.toLowerCase().includes(searchLower) ||
        log.crews?.name.toLowerCase().includes(searchLower) ||
        `${log.profiles?.first_name || ''} ${log.profiles?.last_name || ''}`.toLowerCase().includes(searchLower) ||
        log.notes?.toLowerCase().includes(searchLower)
      );
    });
  }, [filteredByDate, searchValue]);

  // Calculate stats for filtered logs
  const stats: JobStats = React.useMemo(() => {
    return {
      totalJobs: filteredLogs.length,
      totalYardage: filteredLogs.reduce((sum, log) => sum + Number(log.job_elevations?.yardage || 0), 0),
      totalRevenue: filteredLogs.reduce((sum, log) => sum + Number(log.job_elevations?.total || 0), 0),
    };
  }, [filteredLogs]);

  // Extract unique crews for column filtering (if needed)
  const crews = React.useMemo(() => {
    const uniqueCrews = new Map();
    initialJobLogs.forEach(log => {
      if (log.crews) {
        uniqueCrews.set(log.crews.id, log.crews);
      }
    });
    return Array.from(uniqueCrews.values());
  }, [initialJobLogs]);

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
              <Link href={ROUTES.ADMIN.JOBS} className="hover:underline">
                Jobs
              </Link>
              <Link href={ROUTES.ADMIN.JOB_LOGS} className="underline font-semibold">
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Job Logs</h1>
          <p className="text-muted-foreground">
            View all completed work logged by foremen
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
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
                Across all filtered logs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                {activeFilter === "all" ? "All time" : "Filtered view"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar and Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Job Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <Toolbar
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
            <JobTable columns={getColumns(crews)} data={filteredLogs} />
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
