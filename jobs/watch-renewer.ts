import { db } from "@/server/repositories/db";
import { GmailAdapter } from "@/services/email/gmail.adapter";

// Utility to sleep
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function renewWatches() {
  console.log("[JOB] [WATCH_RENEWER] [STARTED] Sweeping expiring Gmail watches...");

  // Find accounts where watchExpiration is within the next 48 hours or already expired,
  // but only if syncStatus is not ERROR.
  const fortyEightHoursFromNow = new Date(Date.now() + 48 * 60 * 60 * 1000);
  
  const expiringAccounts = await db.emailAccount.findMany({
    where: {
      provider: "gmail",
      syncStatus: { not: "ERROR" },
      OR: [
        { watchExpiration: { lte: fortyEightHoursFromNow } },
        { watchExpiration: null } // Just in case it was never set but should be active
      ]
    },
    take: 100,
  });

  if (expiringAccounts.length === 0) {
    console.log("[JOB] [WATCH_RENEWER] [SUCCESS] No watches require renewal.");
    return;
  }

  const adapter = new GmailAdapter();

  for (const account of expiringAccounts) {
    try {
      // JITTER: Wait between 0 and 5 seconds to prevent thundering herd against Google API
      const jitterMs = Math.floor(Math.random() * 5000);
      console.log(`[JOB] [WATCH_RENEWER] Applying ${jitterMs}ms jitter for account ${account.emailAddress}`);
      await sleep(jitterMs);

      const success = await adapter.renewWebhook(account.id);

      if (success) {
        console.log(`[JOB] [WATCH_RENEWER] [SUCCESS] Renewed watch for ${account.emailAddress}`);
      } else {
        console.error(`[JOB] [WATCH_RENEWER] [FAILED] Failed to renew watch for ${account.emailAddress}`);
      }

    } catch (error) {
      const err = error as Error;
      console.error(`[JOB] [WATCH_RENEWER] [FAILED] Account ${account.emailAddress} | error=${err.message}`);
      // The adapter internally updates the syncStatus to ERROR if it completely fails.
    }
  }

  console.log("[JOB] [WATCH_RENEWER] [COMPLETED]");
}
