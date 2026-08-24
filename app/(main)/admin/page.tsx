import { db } from "@/server/repositories/db";
import { AdminClient } from "./AdminClient";
import { getUsers } from "./actions";

export default async function AdminPage() {
  const evalRuns = await db.aIEvalRun.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      results: true,
    }
  });

  const users = await getUsers();

  return <AdminClient runs={evalRuns} initialUsers={users} />;
}
