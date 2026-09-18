import { IntegrityClient } from "./IntegrityClient";
import { requireAdmin } from "@/server/actions/admin.actions";

export const dynamic = "force-dynamic";

export default async function AdminIntegrityPage() {
  await requireAdmin();
  return <IntegrityClient />;
}
