import { JobsClient } from "./JobsClient";
import { requireAdmin } from "@/server/actions/admin.actions";

export default async function AdminJobsPage() {
  await requireAdmin();
  return <JobsClient />;
}
