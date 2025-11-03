"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createUser } from "@/db/actions/user-actions";
import { UserRole } from "@/lib/types";
import { Plus } from "lucide-react";

type Crew = {
  id: string;
  name: string;
};

interface CreateUserDialogProps {
  crews: Crew[];
}

export function CreateUserDialog({ crews }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const firstName = formData.get("first_name") as string;
    const lastName = formData.get("last_name") as string;
    const phoneNumber = formData.get("phone_number") as string;
    const role = formData.get("role") as UserRole;
    const crewId = formData.get("crew_id") as string;
    const hourlyRateValue = formData.get("hourly_rate") as string;

    const result = await createUser({
      email: email.trim(),
      password,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone_number: phoneNumber.trim() || null,
      role,
      crew_id: crewId || null,
      hourly_rate: hourlyRateValue ? parseFloat(hourlyRateValue) : null,
    });

    setLoading(false);

    if (result.success) {
      setOpen(false);
      // Reset form
      (e.target as HTMLFormElement).reset();

      if (result.warning) {
        alert(`Warning: ${result.warning}`);
      }
    } else {
      setError(result.error || "Failed to create user");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Create a new user account with email and password that you can share
              with your employee.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email <span className="text-destructive">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="user@example.com"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password <span className="text-destructive">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="text"
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                className="w-full px-3 py-2 border rounded-md"
              />
              <p className="text-xs text-muted-foreground">
                This password will be shared with the employee
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="first_name" className="text-sm font-medium">
                  First Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  required
                  placeholder="John"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="last_name" className="text-sm font-medium">
                  Last Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  placeholder="Doe"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="phone_number" className="text-sm font-medium">
                Phone Number
              </label>
              <input
                id="phone_number"
                name="phone_number"
                type="tel"
                placeholder="(555) 123-4567"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="role" className="text-sm font-medium">
                Role <span className="text-destructive">*</span>
              </label>
              <select
                id="role"
                name="role"
                required
                defaultValue="worker"
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="worker">Worker</option>
                <option value="foreman">Foreman</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="crew_id" className="text-sm font-medium">
                Assign to Crew
              </label>
              <select
                id="crew_id"
                name="crew_id"
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

            <div className="grid gap-2">
              <label htmlFor="hourly_rate" className="text-sm font-medium">
                Hourly Rate ($/hr)
              </label>
              <input
                id="hourly_rate"
                name="hourly_rate"
                type="number"
                step="0.01"
                min="0"
                placeholder="20.00"
                className="w-full px-3 py-2 border rounded-md"
              />
              <p className="text-xs text-muted-foreground">
                Optional: Set hourly rate for workers
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
