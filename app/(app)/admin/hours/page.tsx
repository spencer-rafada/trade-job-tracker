import { redirect } from "next/navigation";
import { requireAdmin } from "@/db/actions/user-actions";
import { getAllCrews } from "@/db/actions/crew-actions";
import { ROUTES } from "@/lib/routes";
import { WeeklyHoursSummary } from "@/components/weekly-hours-summary";

export default async function AdminHoursPage() {
  const profile = await requireAdmin();
  if (!profile) redirect(ROUTES.AUTH.LOGIN);

  const crews = await getAllCrews();

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Hours Management</h1>
        <p className="text-muted-foreground">
          View weekly crew hours and compliance status
        </p>
      </div>

      <WeeklyHoursSummary crews={crews} />
    </>
  );
}
