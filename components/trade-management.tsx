"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createTrade, updateTrade, deleteTrade } from "@/db/actions/trade-actions";

type Trade = {
  id: string;
  trade_name: string;
  department_id: string | null;
  description: string | null;
  created_at: string;
};

export function TradeManagement({ trades }: { trades: Trade[] }) {
  const [editingTradeId, setEditingTradeId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleCreate = async (formData: FormData) => {
    setSaving(true);
    const trade_name = formData.get("trade_name") as string;
    const department_id = formData.get("department_id") as string;
    const description = formData.get("description") as string;

    const result = await createTrade({
      trade_name,
      department_id: department_id || undefined,
      description: description || undefined,
    });

    setSaving(false);

    if (result.success) {
      setCreating(false);
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleUpdate = async (tradeId: string, formData: FormData) => {
    setSaving(true);
    const trade_name = formData.get("trade_name") as string;
    const department_id = formData.get("department_id") as string;
    const description = formData.get("description") as string;

    const result = await updateTrade(tradeId, {
      trade_name,
      department_id: department_id || undefined,
      description: description || undefined,
    });

    setSaving(false);

    if (result.success) {
      setEditingTradeId(null);
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleDelete = async (tradeId: string, tradeName: string) => {
    if (!confirm(`Are you sure you want to delete "${tradeName}"? This cannot be undone.`)) {
      return;
    }

    const result = await deleteTrade(tradeId);

    if (!result.success) {
      alert(`Error: ${result.error}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create New Trade Card */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Trade</CardTitle>
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
                <Label htmlFor="trade_name">Trade Name *</Label>
                <Input
                  id="trade_name"
                  name="trade_name"
                  type="text"
                  placeholder="e.g., Concrete, Framing, Electrical"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department_id">Department ID</Label>
                <Input
                  id="department_id"
                  name="department_id"
                  type="text"
                  placeholder="e.g., CONC-001 (internal accounting ID)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Brief description of this trade..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Creating..." : "Create Trade"}
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
              + Add New Trade
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Existing Trades */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Trades</CardTitle>
        </CardHeader>
        <CardContent>
          {trades.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No trades created yet. Add your first trade above.
            </p>
          ) : (
            <div className="space-y-4">
              {trades.map((trade) => {
                const isEditing = editingTradeId === trade.id;

                return (
                  <div
                    key={trade.id}
                    className="flex items-start justify-between p-4 border rounded-lg"
                  >
                    {isEditing ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleUpdate(trade.id, new FormData(e.currentTarget));
                        }}
                        className="flex-1 space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor={`edit-trade_name-${trade.id}`}>Trade Name *</Label>
                          <Input
                            id={`edit-trade_name-${trade.id}`}
                            name="trade_name"
                            type="text"
                            defaultValue={trade.trade_name}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`edit-department_id-${trade.id}`}>Department ID</Label>
                          <Input
                            id={`edit-department_id-${trade.id}`}
                            name="department_id"
                            type="text"
                            defaultValue={trade.department_id || ""}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`edit-description-${trade.id}`}>Description</Label>
                          <Textarea
                            id={`edit-description-${trade.id}`}
                            name="description"
                            defaultValue={trade.description || ""}
                            rows={3}
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
                            onClick={() => setEditingTradeId(null)}
                            disabled={saving}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{trade.trade_name}</h3>
                          {trade.department_id && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Dept ID: {trade.department_id}
                            </p>
                          )}
                          {trade.description && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {trade.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Created {new Date(trade.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingTradeId(trade.id)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(trade.id, trade.trade_name)}
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
