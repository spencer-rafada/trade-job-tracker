"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getWeeklyCrewSummary } from "@/db/actions/hours-actions";
import { formatCurrency } from "@/lib/utils/date-helpers";
import type { WeeklyCrewSummary } from "@/lib/types/hours";

type Crew = {
  id: string;
  name: string;
};

interface WeeklyHoursSummaryProps {
  crews: Crew[];
}

export function WeeklyHoursSummary({ crews }: WeeklyHoursSummaryProps) {
  const [selectedCrewId, setSelectedCrewId] = useState<string>("");
  const [weekStart, setWeekStart] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<WeeklyCrewSummary | null>(null);

  const handleFetchSummary = async () => {
    if (!selectedCrewId || !weekStart) {
      alert("Please select both a crew and a week start date");
      return;
    }

    setLoading(true);
    const result = await getWeeklyCrewSummary(selectedCrewId, weekStart);
    setLoading(false);

    if (result) {
      setSummary(result);
    } else {
      alert("Failed to fetch weekly summary");
      setSummary(null);
    }
  };

  // Helper to get current week's Monday
  const getCurrentWeekStart = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      {/* Filter Card */}
      <Card>
        <CardHeader>
          <CardTitle>Select Crew and Week</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="crew-select">Crew</Label>
              <Select value={selectedCrewId} onValueChange={setSelectedCrewId}>
                <SelectTrigger id="crew-select">
                  <SelectValue placeholder="Select a crew" />
                </SelectTrigger>
                <SelectContent>
                  {crews.map((crew) => (
                    <SelectItem key={crew.id} value={crew.id}>
                      {crew.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="week-start">Week Start Date (Monday)</Label>
              <div className="flex gap-2">
                <Input
                  id="week-start"
                  type="date"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setWeekStart(getCurrentWeekStart())}
                  className="whitespace-nowrap"
                >
                  This Week
                </Button>
              </div>
            </div>
          </div>

          <Button onClick={handleFetchSummary} disabled={loading || !selectedCrewId || !weekStart}>
            {loading ? "Loading..." : "View Summary"}
          </Button>
        </CardContent>
      </Card>

      {/* Summary Display */}
      {summary && (
        <>
          {/* Overview Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Week of {new Date(summary.week_start).toLocaleDateString()} -{" "}
                  {new Date(summary.week_end).toLocaleDateString()}
                </CardTitle>
                <Badge
                  variant={summary.is_compliant ? "default" : "destructive"}
                  className="text-lg px-4 py-2"
                >
                  {summary.is_compliant ? "✅ Compliant" : "⚠️ Below Minimum"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Job Earnings</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(summary.total_job_earnings)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Minimum Required Pay</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(summary.total_minimum_required)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bonus Pool</p>
                  <p
                    className={`text-2xl font-bold ${
                      summary.bonus_pool >= 0 ? "text-blue-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(summary.bonus_pool)}
                  </p>
                </div>
              </div>

              {!summary.is_compliant && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Warning:</strong> Job earnings do not meet minimum wage requirements.
                    The crew needs an additional{" "}
                    <strong>{formatCurrency(Math.abs(summary.bonus_pool))}</strong> to be compliant.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Worker Breakdown Card */}
          <Card>
            <CardHeader>
              <CardTitle>Worker Hours Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {summary.workers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hours submitted for this week.
                </p>
              ) : (
                <div className="space-y-3">
                  {summary.workers.map((worker) => (
                    <div
                      key={worker.worker_id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-semibold">{worker.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {worker.total_hours} hours × {formatCurrency(worker.hourly_rate)}/hr
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(worker.minimum_required_pay)}
                        </p>
                        <p className="text-xs text-muted-foreground">minimum required</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!summary && !loading && (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Select a crew and week to view the hours summary
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
