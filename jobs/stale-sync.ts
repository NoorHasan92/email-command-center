import { db } from "@/server/repositories/db";
import { GmailAdapter } from "@/services/email/gmail.adapter";
import { EmailIngestionService } from "@/services/email/email-ingestion.service";
import { logger } from "@/lib/logger";

export async function forceSyncStaleAccounts() {
  logger.info("[JOB] [STALE_SYNC] [STARTED] Sweeping stale Gmail accounts...");

  // Find accounts that haven't been synced in the last 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const staleAccounts = await db.emailAccount.findMany({
    where: {
      provider: "gmail",
      syncStatus: { not: "ERROR" },
      OR: [
        { lastSyncedAt: { lte: twentyFourHoursAgo } },
        { lastSyncedAt: null }
      ]
    },
    take: 50,
  });

  if (staleAccounts.length === 0) {
    logger.info("[JOB] [STALE_SYNC] [SUCCESS] No stale accounts found.");
    return;
  }

  const adapter = new GmailAdapter();

  for (const account of staleAccounts) {
    try {
      logger.info(`[JOB] [STALE_SYNC] Force syncing stale account: ${account.emailAddress}`);
      const newEmails = await adapter.syncAccount(account.id);
      
      const successfulInserts = await EmailIngestionService.ingest(account.id, newEmails);
      logger.info(`[JOB] [STALE_SYNC] [SUCCESS] Synced ${successfulInserts} emails for ${account.emailAddress}`);
    } catch (error) {
      const err = error as Error;
      logger.error(`[JOB] [STALE_SYNC] [FAILED] Account ${account.emailAddress} | error=${err.message}`);
    }
  }

  logger.info("[JOB] [STALE_SYNC] [COMPLETED]");
}
