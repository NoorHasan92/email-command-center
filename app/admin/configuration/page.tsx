import { ConfigurationClient } from "./ConfigurationClient";
import { requireAdmin } from "@/server/actions/admin.actions";

export const dynamic = "force-dynamic";

export default async function AdminConfigurationPage() {
  await requireAdmin();
  return <ConfigurationClient />;
}
