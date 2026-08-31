import { PaymentsClient } from "./PaymentsClient";
import { requireAdmin } from "@/server/actions/admin.actions";

export default async function AdminPaymentsPage() {
  await requireAdmin();
  return <PaymentsClient />;
}
