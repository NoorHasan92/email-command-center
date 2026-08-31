import { ConfigurationClient } from "./ConfigurationClient";
import { requireAdmin } from "@/server/actions/admin.actions";

export default async function AdminConfigurationPage() {
  await requireAdmin();
  return <ConfigurationClient />;
}
