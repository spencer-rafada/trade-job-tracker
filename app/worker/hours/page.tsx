import { redirect } from "next/navigation";
import { getCurrentUser, getUserProfile } from "@/db/actions/user-actions";
import { getMyHours } from "@/db/actions/hours-actions";
import { HoursSubmission } from "@/components/hours-submission";
import { AuthButton } from "@/components/auth-button";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";

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
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="w-full border-b h-16 flex items-center px-4">
        <div className="w-full max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href={ROUTES.HOME} className="font-bold text-lg">
              Trade Job Tracker
            </Link>
            <div className="flex gap-4 text-sm">
              <Link href={ROUTES.WORKER.HOURS} className="underline font-semibold">
                My Hours
              </Link>
            </div>
          </div>
          <AuthButton />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8">
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
      </main>

      {/* Footer */}
      <footer className="w-full border-t py-4 text-center text-sm text-muted-foreground">
        <p>Trade Job Tracker © 2025</p>
      </footer>
    </div>
  );
}
