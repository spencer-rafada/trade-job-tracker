import { redirect } from "next/navigation";
import { requireAdmin } from "@/db/actions/user-actions";
import { getAllJobs } from "@/db/actions/job-actions";
import { getAllCrews } from "@/db/actions/crew-actions";
import { ROUTES } from "@/lib/routes";
import { JobsPageClient } from "./jobs-client";

export default async function JobsPage() {
  // Check authentication and authorization
  const profile = await requireAdmin();

  if (!profile) {
    redirect(ROUTES.AUTH.LOGIN);
  }

  // Fetch all jobs and crews
  const jobs = await getAllJobs();
  const crews = await getAllCrews();

  return <JobsPageClient jobs={jobs} crews={crews} profile={profile} />;
}
