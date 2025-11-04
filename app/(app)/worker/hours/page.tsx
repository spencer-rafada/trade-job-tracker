import { redirect } from "next/navigation";
import { getCurrentUser, getUserProfile } from "@/db/actions/user-actions";
import { getMyHours } from "@/db/actions/hours-actions";
import { HoursSubmission } from "@/components/hours-submission";
import { ROUTES } from "@/lib/routes";

export default async function WorkerHoursPage() {
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.AUTH.LOGIN);

  const profile = await getUserProfile(user.id);
  if (!profile || profile.role === 'admin') {
    redirect(ROUTES.HOME);
  }

  // Get recent hours (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDate = thirtyDaysAgo.toISOString().split('T')[0];

  const hours = await getMyHours(startDate);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Hours</h1>
        <p className="text-muted-foreground">
          Submit your daily hours worked for payroll tracking
        </p>
      </div>

      <HoursSubmission
        recentHours={hours}
        hourlyRate={profile.hourly_rate}
      />
    </>
  );
}
