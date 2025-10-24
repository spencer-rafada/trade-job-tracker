import { redirect } from "next/navigation";
import { requireAdmin } from "@/db/actions/user-actions";
import { getAllJobs } from "@/db/actions/job-actions";
import { getAllCrews } from "@/db/actions/crew-actions";
import { getAllTrades } from "@/db/actions/trade-actions";
import { ROUTES } from "@/lib/routes";
import { JobsPageClient } from "./jobs-client";

export default async function JobsPage() {
  // Check authentication and authorization
  const profile = await requireAdmin();

  if (!profile) {
    redirect(ROUTES.AUTH.LOGIN);
  }

  // Fetch all jobs, crews, and trades
  const jobs = await getAllJobs();
  const crews = await getAllCrews();
  const trades = await getAllTrades();

  return <JobsPageClient jobs={jobs} crews={crews} trades={trades} profile={profile} />;
}
