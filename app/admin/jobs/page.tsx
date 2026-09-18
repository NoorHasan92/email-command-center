import { JobsClient } from "./JobsClient";
import { requireAdmin } from "@/server/actions/admin.actions";

export const dynamic = "force-dynamic";

export default async function AdminJobsPage() {
  await requireAdmin();
  return <JobsClient />;
}
