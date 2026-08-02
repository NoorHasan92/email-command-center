import { db } from "../server/repositories/db";
import { GmailAdapter } from "../services/email/gmail.adapter";
import { logger } from "../lib/logger";

async function main() {
  logger.info("--- Starting Integration Test: Token Lifecycle ---");

  // 1. Find an active Gmail account
  const account = await db.emailAccount.findFirst({
    where: { provider: "gmail" },
  });

  if (!account) {
    logger.error("No Gmail account found to test with.");
    process.exit(1);
  }

  logger.info(`Found account for ${account.emailAddress}`);

  // 2. Force token expiration in the database to trigger automatic refresh
  const expiredTime = Math.floor(Date.now() / 1000) - 3600; // Expired 1 hour ago
  logger.info("Mutating DB: Forcing token expiration...");
  await db.emailAccount.update({
    where: { id: account.id },
    data: { expiresAt: expiredTime },
  });

  // 3. Run adapter (this should seamlessly decrypt -> refresh -> encrypt -> sync)
  const adapter = new GmailAdapter();
  
  logger.info("Triggering account sync...");
  try {
    const emails = await adapter.syncAccount(account.id);
    logger.info(`Sync successful! Retrieved ${emails.length} new emails.`);
    
    const updatedAccount = await db.emailAccount.findUnique({
      where: { id: account.id },
    });

    if (updatedAccount?.expiresAt && updatedAccount.expiresAt > expiredTime) {
      logger.info("Verification Passed: expiresAt in DB was updated!");
    } else {
      logger.error("Verification Failed: expiresAt was not updated.");
    }

  } catch (error: any) {
    logger.error(`Integration Test Failed: ${error.message}`);
  }

  logger.info("--- End of Test ---");
  process.exit(0);
}

main();
