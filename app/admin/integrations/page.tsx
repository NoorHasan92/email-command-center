import { IntegrationsClient } from "./IntegrationsClient";
import { db } from "@/server/repositories/db";
import { requireAdmin } from "@/server/actions/admin.actions";

export default async function AdminIntegrationsPage() {
  await requireAdmin();

  // Try to find if WA is connected
  const waSession = await db.whatsAppSession.findFirst({
    where: { category: "creds" },
    select: { data: true }
  });

  let initialWaMeta = null;
  if (waSession && waSession.data) {
    try {
      const dataStr = waSession.data.toString();
      const parsed = JSON.parse(dataStr);
      if (parsed.me?.id) {
        initialWaMeta = {
          phoneNumber: parsed.me.id.split(":")[0],
          status: "connected"
        };
      }
    } catch (e) {
      // Ignored
    }
  }

  const telegramBotUsername = process.env.TELEGRAM_BOT_TOKEN ? process.env.TELEGRAM_BOT_USERNAME || "Configured" : null;

  return <IntegrationsClient initialWaMeta={initialWaMeta} telegramBotUsername={telegramBotUsername} />;
}
