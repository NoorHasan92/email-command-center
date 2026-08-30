import { db } from "../server/repositories/db";
import { logger } from "../lib/logger";

/**
 * Replays all FAILED emails and webhooks by resetting their status to PENDING.
 * The next cron/webhook processor run will pick them up.
 */
async function replayFailed() {
  logger.info("Starting Replay of FAILED records...");

  // Replay Webhooks
  const { count: webhookCount } = await db.webhookEvent.updateMany({
    where: { status: "FAILED" },
    data: { status: "PENDING", retryCount: 0, error: null }
  });
  logger.info({ replayedCount: webhookCount }, "Replayed FAILED Webhooks");

  // Replay Emails
  const { count: emailCount } = await db.email.updateMany({
    where: { status: "AI_FAILED" },
    data: { status: "SYNCED" }
  });
  logger.info({ replayedCount: emailCount }, "Replayed FAILED Emails");

  logger.info("Replay complete.");
}

replayFailed()
  .catch(e => {
    logger.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
