import { db } from "@/server/repositories/db";
import { AdminClient } from "./AdminClient";
import { getUsers } from "./actions";
import { DatabaseStore } from "@/services/whatsapp/session-store/DatabaseStore";

export default async function AdminPage() {
  const evalRuns = await db.aIEvalRun.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      results: true,
    }
  });

  const users = await getUsers();
  
  const store = new DatabaseStore("SYSTEM_SENDER");
  const meta = await store.getMetadata();
  const telegramBotUsername = process.env.TELEGRAM_BOT_USERNAME || null;

  return <AdminClient 
    runs={evalRuns} 
    initialUsers={users} 
    initialWaMeta={meta} 
    telegramBotUsername={telegramBotUsername}
  />;
}
