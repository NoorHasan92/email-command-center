import { AccountDeletionsClient } from "./AccountDeletionsClient";
import { requireAdmin } from "@/server/actions/admin.actions";

export const dynamic = "force-dynamic";

export default async function AdminAccountDeletionsPage() {
  await requireAdmin();
  return <AccountDeletionsClient />;
}
