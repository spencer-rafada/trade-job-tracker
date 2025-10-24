import { redirect } from "next/navigation";
import { getCurrentUser, getUserProfile } from "@/db/actions/user-actions";
import { getAllCrews } from "@/db/actions/crew-actions";
import { getAllTrades } from "@/db/actions/trade-actions";
import { CrewManagement } from "@/components/crew-management";
import { AuthButton } from "@/components/auth-button";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";

export default async function CrewsPage() {
  // Check authentication and authorization
  const user = await getCurrentUser();
  if (!user) {
    redirect(ROUTES.AUTH.LOGIN);
  }

  const profile = await getUserProfile(user.id);
  if (!profile || profile.role !== "admin") {
    redirect(ROUTES.HOME);
  }

  // Fetch crews and trades
  const crews = await getAllCrews();
  const trades = await getAllTrades();

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
              <Link href={ROUTES.ADMIN.USERS} className="hover:underline">
                Users
              </Link>
              <Link href={ROUTES.ADMIN.CREWS} className="underline font-semibold">
                Crews
              </Link>
              <Link href={ROUTES.ADMIN.TRADES} className="hover:underline">
                Trades
              </Link>
              <Link href={ROUTES.ADMIN.JOBS} className="hover:underline">
                Jobs
              </Link>
            </div>          </div>
          <AuthButton />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Crew Management</h1>
          <p className="text-muted-foreground">
            Create and manage your crews
          </p>
        </div>

        <CrewManagement crews={crews} trades={trades} />
      </main>

      {/* Footer */}
      <footer className="w-full border-t py-4 text-center text-sm text-muted-foreground">
        <p>Trade Job Tracker © 2025</p>
      </footer>
    </div>
  );
}
