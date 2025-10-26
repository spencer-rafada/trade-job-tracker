"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { submitHours, updateHours, deleteHours } from "@/db/actions/hours-actions";
import { formatCurrency } from "@/lib/utils/date-helpers";

type Hours = {
  id: string;
  date_worked: string;
  hours_worked: number;
  notes: string | null;
};

interface HoursSubmissionProps {
  recentHours: Hours[];
  hourlyRate: number | null;
}

export function HoursSubmission({ recentHours, hourlyRate }: HoursSubmissionProps) {
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setSubmitting(true);

    const data = {
      date_worked: formData.get("date_worked") as string,
      hours_worked: parseFloat(formData.get("hours_worked") as string),
      notes: formData.get("notes") as string || undefined,
    };

    const result = editingId
      ? await updateHours(editingId, data)
      : await submitHours(data);

    setSubmitting(false);

    if (result.success) {
      setEditingId(null);
      // Reset form
      (document.getElementById("hours-form") as HTMLFormElement)?.reset();
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleDelete = async (id: string, date: string) => {
    if (!confirm(`Delete hours for ${date}?`)) return;

    const result = await deleteHours(id);
    if (!result.success) {
      alert(`Error: ${result.error}`);
    }
  };

  const handleEdit = (hours: Hours) => {
    setEditingId(hours.id);
    // Populate form
    (document.getElementById("date_worked") as HTMLInputElement).value = hours.date_worked;
    (document.getElementById("hours_worked") as HTMLInputElement).value = hours.hours_worked.toString();
    (document.getElementById("notes") as HTMLTextAreaElement).value = hours.notes || "";
  };

  return (
    <div className="space-y-6">
      {/* Rate Display */}
      {hourlyRate ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Your Hourly Rate:</span>
              <Badge variant="secondary" className="text-lg">
                {formatCurrency(hourlyRate)}/hr
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-yellow-500">
          <CardContent className="pt-6">
            <p className="text-yellow-600">
              ⚠️ No hourly rate set. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Submission Form */}
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Hours" : "Submit Hours"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            id="hours-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(new FormData(e.currentTarget));
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="date_worked">Date Worked *</Label>
              <Input
                id="date_worked"
                name="date_worked"
                type="date"
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours_worked">Hours Worked *</Label>
              <Input
                id="hours_worked"
                name="hours_worked"
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                placeholder="8.0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Job details, location, etc."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : editingId ? "Update" : "Submit"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    (document.getElementById("hours-form") as HTMLFormElement)?.reset();
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {recentHours.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hours submitted yet.
            </p>
          ) : (
            <div className="space-y-2">
              {recentHours.map((hours) => (
                <div
                  key={hours.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-semibold">
                      {new Date(hours.date_worked).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {hours.hours_worked} hours
                      {hourlyRate && ` • ${formatCurrency(hours.hours_worked * hourlyRate)}`}
                    </p>
                    {hours.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{hours.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(hours)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(hours.id, hours.date_worked)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
