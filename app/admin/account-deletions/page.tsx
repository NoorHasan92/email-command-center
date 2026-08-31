import { AccountDeletionsClient } from "./AccountDeletionsClient";
import { requireAdmin } from "@/server/actions/admin.actions";

export default async function AdminAccountDeletionsPage() {
  await requireAdmin();
  return <AccountDeletionsClient />;
}
