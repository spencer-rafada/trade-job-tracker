"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCrew, updateCrew, deleteCrew } from "@/db/actions/crew-actions";

type Trade = {
  id: string;
  trade_name: string;
};

type Crew = {
  id: string;
  name: string;
  trade_id: string | null;
  created_at: string;
  trades: Trade | null;
};

interface CrewManagementProps {
  crews: Crew[];
  trades: Trade[];
}

export function CrewManagement({ crews, trades }: CrewManagementProps) {
  const [editingCrewId, setEditingCrewId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedTradeId, setSelectedTradeId] = useState<string>("none");
  const [editTradeId, setEditTradeId] = useState<string>("none");

  const handleCreate = async (formData: FormData) => {
    setSaving(true);
    const name = formData.get("name") as string;

    const result = await createCrew(
      name,
      selectedTradeId && selectedTradeId !== "none" ? selectedTradeId : undefined
    );

    setSaving(false);

    if (result.success) {
      setCreating(false);
      setSelectedTradeId("none");
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleUpdate = async (crewId: string, formData: FormData) => {
    setSaving(true);
    const name = formData.get("name") as string;

    const result = await updateCrew(
      crewId,
      name,
      editTradeId && editTradeId !== "none" ? editTradeId : null
    );

    setSaving(false);

    if (result.success) {
      setEditingCrewId(null);
      setEditTradeId("none");
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleDelete = async (crewId: string, crewName: string) => {
    if (!confirm(`Are you sure you want to delete "${crewName}"? This cannot be undone.`)) {
      return;
    }

    const result = await deleteCrew(crewId);

    if (!result.success) {
      alert(`Error: ${result.error}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create New Crew Card */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Crew</CardTitle>
        </CardHeader>
        <CardContent>
          {creating ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreate(new FormData(e.currentTarget));
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Crew Name *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="e.g., Crew A"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trade">Trade/Department</Label>
                <Select value={selectedTradeId || "none"} onValueChange={setSelectedTradeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a trade (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {trades.filter(trade => trade.id && trade.id !== "").map((trade) => (
                      <SelectItem key={trade.id} value={trade.id}>
                        {trade.trade_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Creating..." : "Create Crew"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreating(false);
                    setSelectedTradeId("none");
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button onClick={() => setCreating(true)}>
              + Add New Crew
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Existing Crews */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Crews</CardTitle>
        </CardHeader>
        <CardContent>
          {crews.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No crews created yet. Add your first crew above.
            </p>
          ) : (
            <div className="space-y-4">
              {crews.map((crew) => {
                const isEditing = editingCrewId === crew.id;

                return (
                  <div
                    key={crew.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    {isEditing ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleUpdate(crew.id, new FormData(e.currentTarget));
                        }}
                        className="flex-1 space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor={`edit-name-${crew.id}`}>Crew Name *</Label>
                          <Input
                            id={`edit-name-${crew.id}`}
                            name="name"
                            type="text"
                            defaultValue={crew.name}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-trade-${crew.id}`}>Trade/Department</Label>
                          <Select
                            value={editTradeId || "none"}
                            onValueChange={setEditTradeId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a trade (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {trades.filter(trade => trade.id && trade.id !== "").map((trade) => (
                                <SelectItem key={trade.id} value={trade.id}>
                                  {trade.trade_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" size="sm" disabled={saving}>
                            {saving ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCrewId(null);
                              setEditTradeId("none");
                            }}
                            disabled={saving}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{crew.name}</h3>
                            {crew.trades && (
                              <Badge variant="secondary">{crew.trades.trade_name}</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Created {new Date(crew.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCrewId(crew.id);
                              setEditTradeId(crew.trade_id && crew.trade_id !== "" ? crew.trade_id : "none");
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(crew.id, crew.name)}
                          >
                            Delete
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
