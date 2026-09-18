import { RevenueClient } from "./RevenueClient";
import { requireAdmin } from "@/server/actions/admin.actions";

export const dynamic = "force-dynamic";

export default async function AdminRevenuePage() {
  await requireAdmin();
  return <RevenueClient />;
}
