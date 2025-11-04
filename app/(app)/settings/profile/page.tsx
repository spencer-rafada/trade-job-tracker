import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/db/actions/profile-actions";
import { ProfileSettingsForm } from "@/components/profile-settings-form";
import { ROUTES } from "@/lib/routes";

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
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your personal information
        </p>
      </div>

      <ProfileSettingsForm profile={profile} userEmail={user.email || ""} />
    </div>
  );
}
