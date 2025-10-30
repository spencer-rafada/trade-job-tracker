"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FilterPreset } from "@/lib/types";
import { X } from "lucide-react";

interface ToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  activeFilter: FilterPreset;
  onFilterChange: (filter: FilterPreset) => void;
}

export function Toolbar({
  searchValue,
  onSearchChange,
  activeFilter,
  onFilterChange,
}: ToolbarProps) {
  return (
    <div className="flex flex-col gap-4 py-4">
      {/* Search Input */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search by job, elevation, lot, crew, foreman..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-sm"
        />
        {searchValue && (
          <Button
            variant="ghost"
            onClick={() => onSearchChange("")}
            className="h-8 px-2"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Quick Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeFilter === "this-week" ? "default" : "outline"}
          onClick={() => onFilterChange("this-week")}
          size="sm"
        >
          This Week
        </Button>
        <Button
          variant={activeFilter === "last-week" ? "default" : "outline"}
          onClick={() => onFilterChange("last-week")}
          size="sm"
        >
          Last Week
        </Button>
        <Button
          variant={activeFilter === "this-month" ? "default" : "outline"}
          onClick={() => onFilterChange("this-month")}
          size="sm"
        >
          This Month
        </Button>
        <Button
          variant={activeFilter === "all" ? "default" : "outline"}
          onClick={() => onFilterChange("all")}
          size="sm"
        >
          All Logs
        </Button>
      </div>
    </div>
  );
}
