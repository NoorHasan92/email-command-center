import { SecurityClient } from "./SecurityClient";
import { requireAdmin } from "@/server/actions/admin.actions";

export default async function AdminSecurityPage() {
  await requireAdmin();
  return <SecurityClient />;
}
