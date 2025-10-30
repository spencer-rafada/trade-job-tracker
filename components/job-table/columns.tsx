"use client";

import { ColumnDef } from "@tanstack/react-table";
import { JobLog } from "@/lib/types/job";
import { formatDate, formatCurrency, formatNumber } from "@/lib/utils/date-helpers";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Trash2 } from "lucide-react";
import { deleteJobLog } from "@/db/actions/job-log-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export const getColumns = (crews: Crew[], trades?: Trade[]): ColumnDef<JobLog>[] => [
  {
    accessorKey: "date_worked",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div className="font-medium">{formatDate(row.getValue("date_worked"))}</div>;
    },
  },
  {
    accessorKey: "jobs.job_name",
    id: "job_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Job Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div>{row.original.jobs?.job_name || "N/A"}</div>;
    },
  },
  {
    accessorKey: "job_elevations.elevation_name",
    id: "elevation",
    header: "Elevation",
    cell: ({ row }) => {
      return <div>{row.original.job_elevations?.elevation_name || "-"}</div>;
    },
  },
  {
    accessorKey: "lot",
    header: "Lot",
    cell: ({ row }) => {
      return <div className="max-w-[200px] truncate">{row.getValue("lot") || "-"}</div>;
    },
  },
  {
    accessorKey: "job_elevations.yardage",
    id: "yardage",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Yardage
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const yardage = row.original.job_elevations?.yardage || 0;
      return <div className="text-right font-medium">{formatNumber(yardage)}</div>;
    },
  },
  {
    accessorKey: "job_elevations.rate",
    id: "rate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Rate
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const rate = row.original.job_elevations?.rate || 0;
      return <div className="text-right font-medium">{formatCurrency(rate)}</div>;
    },
  },
  {
    accessorKey: "job_elevations.total",
    id: "total",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const total = row.original.job_elevations?.total || 0;
      return <div className="text-right font-medium text-green-600 dark:text-green-400">{formatCurrency(total)}</div>;
    },
  },
  {
    accessorKey: "crews.name",
    id: "crew",
    header: ({ column }) => {
      const filterValue = column.getFilterValue() as string | undefined;

      return (
        <div className="flex items-center gap-2">
          <Select
            value={filterValue || "all"}
            onValueChange={(value) => {
              column.setFilterValue(value === "all" ? undefined : value);
            }}
          >
            <SelectTrigger className="h-8 w-[130px]">
              <SelectValue placeholder="All Crews" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Crews</SelectItem>
              {crews.map((crew) => (
                <SelectItem key={crew.id} value={crew.name}>
                  {crew.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      return <div>{row.original.crews?.name || "Unknown"}</div>;
    },
    filterFn: (row, id, value) => {
      return row.getValue(id) === value;
    },
  },
  ...(trades ? [{
    accessorKey: "crews.trades.trade_name",
    id: "trade",
    header: ({ column }) => {
      const filterValue = column.getFilterValue() as string | undefined;

      return (
        <div className="flex items-center gap-2">
          <Select
            value={filterValue || "all"}
            onValueChange={(value) => {
              column.setFilterValue(value === "all" ? undefined : value);
            }}
          >
            <SelectTrigger className="h-8 w-[130px]">
              <SelectValue placeholder="All Trades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trades</SelectItem>
              {trades.map((trade) => (
                <SelectItem key={trade.id} value={trade.trade_name}>
                  {trade.trade_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      return <div>{row.original.crews?.trades?.trade_name || "-"}</div>;
    },
    filterFn: (row, id, value) => {
      return row.getValue(id) === value;
    },
  }] as ColumnDef<JobLog>[] : []),
  {
    id: "foreman",
    header: "Foreman",
    cell: ({ row }) => {
      const profile = row.original.profiles;
      const name = profile?.first_name && profile?.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : "Unknown";
      return <div>{name}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const log = row.original;

      const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this job log?")) return;

        try {
          await deleteJobLog(log.id);
          window.location.reload(); // Refresh to show updated data
        } catch (error) {
          console.error("Error deleting job log:", error);
          alert("Failed to delete job log");
        }
      };

      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      );
    },
  },
];
