import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/db/actions/profile-actions";
import { ProfileSettingsForm } from "@/components/profile-settings-form";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function ProfileSettingsPage() {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.AUTH.LOGIN);
  }

  // Get profile data
  const profile = await getMyProfile();

  if (!profile) {
    redirect(ROUTES.AUTH.LOGIN);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href={ROUTES.HOME}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your personal information
          </p>
        </div>

        <ProfileSettingsForm profile={profile} userEmail={user.email || ""} />
      </div>
    </div>
  );
}
