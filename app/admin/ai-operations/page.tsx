import { getUsers } from "@/server/actions/admin.actions";
import { AIOpsClient } from "./AIOpsClient";
import { db } from "@/server/repositories/db";

export default async function AdminAIOpsPage() {
  const users = await getUsers();
  
  const runs = await db.aIEvalRun.findMany({
    include: {
      results: true,
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return <AIOpsClient initialUsers={users} runs={runs} />;
}
