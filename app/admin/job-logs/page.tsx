import { redirect } from "next/navigation";
import { requireAdmin } from "@/db/actions/user-actions";
import { getAllJobLogs } from "@/db/actions/job-log-actions";
import { ROUTES } from "@/lib/routes";
import { JobLogsClient } from "./job-logs-client";

export default async function JobLogsPage() {
  // Check authentication and authorization
  const profile = await requireAdmin();

  if (!profile) {
    redirect(ROUTES.AUTH.LOGIN);
  }

  // Fetch all job logs
  const jobLogs = await getAllJobLogs();

  return <JobLogsClient initialJobLogs={jobLogs} profile={profile} />;
}
