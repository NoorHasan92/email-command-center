import { EmailsClient } from "./EmailsClient";
import { requireAdmin } from "@/server/actions/admin.actions";

export const dynamic = "force-dynamic";

export default async function AdminEmailsPage() {
  await requireAdmin();
  return <EmailsClient />;
}
