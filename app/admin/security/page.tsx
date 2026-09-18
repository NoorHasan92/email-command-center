import { SecurityClient } from "./SecurityClient";
import { requireAdmin } from "@/server/actions/admin.actions";

export const dynamic = "force-dynamic";

export default async function AdminSecurityPage() {
  await requireAdmin();
  return <SecurityClient />;
}
