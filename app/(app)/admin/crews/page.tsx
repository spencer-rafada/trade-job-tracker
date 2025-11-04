import { redirect } from "next/navigation";
import { getCurrentUser, getUserProfile } from "@/db/actions/user-actions";
import { getAllCrews } from "@/db/actions/crew-actions";
import { getAllTrades } from "@/db/actions/trade-actions";
import { CrewManagement } from "@/components/crew-management";
import { ROUTES } from "@/lib/routes";

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
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Crew Management</h1>
        <p className="text-muted-foreground">
          Create and manage your crews
        </p>
      </div>

      <CrewManagement crews={crews} trades={trades} />
    </>
  );
}
