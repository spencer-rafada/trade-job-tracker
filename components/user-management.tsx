"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateUserProfile } from "@/db/actions/user-actions";

type User = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  crew_id: string | null;
  crews: {
    id: string;
    name: string;
  } | null;
  created_at: string;
};

type Crew = {
  id: string;
  name: string;
};

export function UserManagement({ users, crews }: { users: User[]; crews: Crew[] }) {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async (userId: string, formData: FormData) => {
    setSaving(true);

    const updates = {
      crew_id: formData.get("crew_id") as string || null,
      role: formData.get("role") as "admin" | "foreman",
    };

    const result = await updateUserProfile(userId, updates);

    setSaving(false);
    setEditingUserId(null);

    if (!result.success) {
      alert(`Error: ${result.error}`);
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Name</th>
                <th className="text-left p-4 font-medium">Email</th>
                <th className="text-left p-4 font-medium">Role</th>
                <th className="text-left p-4 font-medium">Crew</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isEditing = editingUserId === user.id;

                return (
                  <tr key={user.id} className="border-b last:border-0">
                    {isEditing ? (
                      // Edit Mode
                      <td colSpan={5} className="p-4">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSave(user.id, new FormData(e.currentTarget));
                          }}
                          className="space-y-4"
                        >
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Email: {user.email}
                            </label>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Role
                            </label>
                            <select
                              name="role"
                              defaultValue={user.role}
                              className="w-full px-3 py-2 border rounded-md"
                            >
                              <option value="foreman">Foreman</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Crew
                            </label>
                            <select
                              name="crew_id"
                              defaultValue={user.crew_id || ""}
                              className="w-full px-3 py-2 border rounded-md"
                            >
                              <option value="">No Crew</option>
                              {crews.map((crew) => (
                                <option key={crew.id} value={crew.id}>
                                  {crew.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex gap-2">
                            <Button type="submit" disabled={saving}>
                              {saving ? "Saving..." : "Save"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setEditingUserId(null)}
                              disabled={saving}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </td>
                    ) : (
                      // View Mode
                      <>
                        <td className="p-4">
                          {user.full_name || <span className="text-muted-foreground">-</span>}
                        </td>
                        <td className="p-4 text-sm">{user.email}</td>
                        <td className="p-4">
                          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {user.crews ? (
                            <span className="text-sm">{user.crews.name}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">No crew</span>
                          )}
                        </td>
                        <td className="p-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingUserId(user.id)}
                          >
                            Edit
                          </Button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}

              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No users found. Users will appear here after they sign up.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
