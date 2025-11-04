import { redirect } from "next/navigation";
import { requireAdmin } from "@/db/actions/user-actions";
import { getJobsWithElevations } from "@/db/actions/job-template-actions";
import { ROUTES } from "@/lib/routes";
import { JobTemplatesClient } from "./job-templates-client";

export default async function JobTemplatesPage() {
  // Check authentication and authorization
  const profile = await requireAdmin();

  if (!profile) {
    redirect(ROUTES.AUTH.LOGIN);
  }

  // Fetch all job templates with their elevations
  const jobsWithElevations = await getJobsWithElevations();

  return <JobTemplatesClient jobsWithElevations={jobsWithElevations} profile={profile} />;
}
