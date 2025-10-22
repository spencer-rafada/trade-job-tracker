"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCrew, updateCrew, deleteCrew } from "@/db/actions/crew-actions";

type Crew = {
  id: string;
  name: string;
  created_at: string;
};

export function CrewManagement({ crews }: { crews: Crew[] }) {
  const [editingCrewId, setEditingCrewId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleCreate = async (formData: FormData) => {
    setSaving(true);
    const name = formData.get("name") as string;

    const result = await createCrew(name);

    setSaving(false);

    if (result.success) {
      setCreating(false);
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleUpdate = async (crewId: string, formData: FormData) => {
    setSaving(true);
    const name = formData.get("name") as string;

    const result = await updateCrew(crewId, name);

    setSaving(false);

    if (result.success) {
      setEditingCrewId(null);
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
                <Label htmlFor="name">Crew Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="e.g., Crew A"
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Creating..." : "Create Crew"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreating(false)}
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
                        className="flex-1 flex items-center gap-4"
                      >
                        <div className="flex-1">
                          <Input
                            name="name"
                            type="text"
                            defaultValue={crew.name}
                            required
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" size="sm" disabled={saving}>
                            {saving ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingCrewId(null)}
                            disabled={saving}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div>
                          <h3 className="font-semibold">{crew.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Created {new Date(crew.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingCrewId(crew.id)}
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
