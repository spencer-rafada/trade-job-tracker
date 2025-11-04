import { redirect } from "next/navigation";
import { getCurrentUser, getUserProfile } from "@/db/actions/user-actions";
import { getAllTrades } from "@/db/actions/trade-actions";
import { TradeManagement } from "@/components/trade-management";
import { ROUTES } from "@/lib/routes";

export default async function TradesPage() {
  // Check authentication and authorization
  const user = await getCurrentUser();
  if (!user) {
    redirect(ROUTES.AUTH.LOGIN);
  }

  const profile = await getUserProfile(user.id);
  if (!profile || profile.role !== "admin") {
    redirect(ROUTES.HOME);
  }

  // Fetch trades
  const trades = await getAllTrades();

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Trade Management</h1>
        <p className="text-muted-foreground">
          Create and manage trade types and departments
        </p>
      </div>

      <TradeManagement trades={trades} />
    </>
  );
}
