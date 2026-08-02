import { db } from "@/server/repositories/db";
import { AdminClient } from "./AdminClient";

export default async function AdminPage() {
  const evalRuns = await db.aIEvalRun.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      results: true,
    }
  });

  return <AdminClient runs={evalRuns} />;
}
