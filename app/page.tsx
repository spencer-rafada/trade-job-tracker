import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { getCurrentUser, getUserProfile } from "@/db/actions/user-actions";
import { ForemanDashboard } from "@/components/foreman-dashboard";
import { AdminDashboard } from "@/components/admin-dashboard";

export default async function DashboardPage() {
  // Check authentication
  const user = await getCurrentUser();
  if (!user) {
    redirect(ROUTES.AUTH.LOGIN);
  }

  // Get user profile with role
  const profile = await getUserProfile(user.id);
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-destructive">
          Error loading profile. Please contact support.
        </p>
      </div>
    );
  }

  // Render role-based dashboard
  if (profile.role === "admin") {
    return <AdminDashboard profile={profile} />;
  }

  return <ForemanDashboard profile={profile} />;
}
