import { db } from "@/server/repositories/db";
import { GmailAdapter } from "@/services/email/gmail.adapter";
import { logger } from "@/lib/logger";


export async function processWebhooks() {
  logger.info("[JOB] [WEBHOOK_PROCESSOR] [STARTED] Sweeping pending webhook events...");

  const pendingEvents = await db.webhookEvent.findMany({
    where: { status: "PENDING", retryCount: { lt: 3 } },
    take: 50, // Batch limit
  });

  if (pendingEvents.length === 0) {
    logger.info("[JOB] [WEBHOOK_PROCESSOR] [SUCCESS] No pending webhooks.");
    return;
  }

  const adapter = new GmailAdapter();

  for (const event of pendingEvents) {
    try {
      const payload: any = event.payload;

      if (!payload.message || !payload.message.data) {
        throw new Error("Invalid payload missing message.data");
      }

      // Decode Base64 data from Pub/Sub
      const decodedData = Buffer.from(payload.message.data, "base64").toString("utf-8");
      const parsedData = JSON.parse(decodedData);

      const emailAddress = parsedData.emailAddress;

      if (!emailAddress) {
        throw new Error("Missing emailAddress in payload");
      }

      const emailAccount = await db.emailAccount.findFirst({
        where: { emailAddress }
      });

      if (!emailAccount) {
        // We don't have this account, ignore it gracefully
        await db.webhookEvent.update({
          where: { id: event.id },
          data: { status: "PROCESSED", processed: true, error: "Account not found in system" }
        });
        continue;
      }

      logger.info(`[JOB] [WEBHOOK_PROCESSOR] [INFO] Syncing account ${emailAddress}`);
      
      const newEmails = await adapter.syncAccount(emailAccount.id);
      
      logger.info(`[JOB] [WEBHOOK_PROCESSOR] [SUCCESS] Synced ${newEmails.length} emails for ${emailAddress}`);

      await db.webhookEvent.update({
        where: { id: event.id },
        data: { status: "PROCESSED", processed: true }
      });

    } catch (error) {
      const err = error as Error;
      logger.error(`[JOB] [WEBHOOK_PROCESSOR] [FAILED] Event ID: ${event.id} | error=${err.message}`);
      
      const newStatus = event.retryCount + 1 >= 3 ? "FAILED" : "PENDING";
      await db.webhookEvent.update({
        where: { id: event.id },
        data: {
          status: newStatus,
          retryCount: event.retryCount + 1,
          error: err.message
        }
      });
    }
  }

  logger.info("[JOB] [WEBHOOK_PROCESSOR] [COMPLETED]");
}
