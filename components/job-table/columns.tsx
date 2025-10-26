"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Job } from "@/lib/types";
import { formatDate, formatCurrency, formatNumber } from "@/lib/utils/date-helpers";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export const getColumns = (crews: Crew[], trades?: Trade[]): ColumnDef<Job>[] => [
  {
    accessorKey: "date",
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
      return <div className="font-medium">{formatDate(row.getValue("date"))}</div>;
    },
  },
  {
    accessorKey: "job_name",
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
  },
  {
    accessorKey: "elevation",
    header: "Elevation",
    cell: ({ row }) => {
      return <div>{row.getValue("elevation") || "-"}</div>;
    },
  },
  {
    accessorKey: "lot_address",
    header: "Lot/Address",
    cell: ({ row }) => {
      return <div className="max-w-[200px] truncate">{row.getValue("lot_address") || "-"}</div>;
    },
  },
  {
    accessorKey: "yardage",
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
      return <div className="text-right font-medium">{formatNumber(row.getValue("yardage"))}</div>;
    },
  },
  {
    accessorKey: "rate",
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
      return <div className="text-right font-medium">{formatCurrency(row.getValue("rate"))}</div>;
    },
  },
  {
    accessorKey: "total",
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
      return <div className="text-right font-medium">{formatCurrency(row.getValue("total"))}</div>;
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
  }] as ColumnDef<Job>[] : []),
  {
    id: "created_by",
    header: "Created By",
    cell: ({ row }) => {
      const profile = row.original.profiles;
      const name = profile?.first_name && profile?.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : profile?.email || "Unknown";
      return <div>{name}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const job = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(job.id)}
            >
              Copy job ID
            </DropdownMenuItem>
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Edit job</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              Delete job
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
