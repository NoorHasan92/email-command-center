import { db } from "@/server/repositories/db";
import { logger } from "@/lib/logger";

export async function executeAccountCleanup(userId: string) {
  try {
    logger.info(`[DELETION_WORKER] Starting cleanup for user ${userId}`);

    // 1. Revoke Google OAuth Tokens
    const emailAccounts = await db.emailAccount.findMany({
      where: { userId, provider: "gmail" },
    });

    for (const account of emailAccounts) {
      if (account.accessToken) {
        try {
          const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${account.accessToken}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          });
          if (response.ok) {
            logger.info(`[DELETION_WORKER] Revoked Google token for account ${account.emailAddress}`);
          } else {
            logger.warn(`[DELETION_WORKER] Failed to revoke Google token for account ${account.emailAddress}`);
          }
        } catch (err) {
          logger.error(`[DELETION_WORKER] Error revoking Google token: ${err}`);
        }
      }
    }

    // 2. Deep Deletion of Identity & Connection Records
    // (Doing this sequentially or in a transaction as appropriate)
    
    // We can do this in a transaction to ensure atomicity
    await db.$transaction(async (tx) => {
      // 2a. Delete Sessions & NextAuth Accounts
      await tx.session.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });

      // 2b. Delete Email Accounts & Webhooks
      await tx.emailAccount.deleteMany({ where: { userId } });

      // 2c. Delete AI Connections & API Keys
      await tx.userAIConnection.deleteMany({ where: { userId } });

      // 2d. Delete WhatsApp/Telegram Sessions
      await tx.whatsAppSession.deleteMany({ where: { userId } });
      // Telegram sessions are usually just stored in the User record, but if we had a separate table we'd clear it here.

      // 3. Scrub Payment Metadata (anonymizing Financial Records)
      await tx.payment.updateMany({
        where: { userId },
        data: {
          providerMetadata: { scrubbed: true, reason: "ACCOUNT_DELETED" }
        }
      });

      // 4. Scrub User Record
      const anonymizedEmail = `deleted_${userId}@inboxsentinel.local`;
      await tx.user.update({
        where: { id: userId },
        data: {
          name: "Deleted User",
          email: anonymizedEmail,
          image: null,
          passwordHash: null,
          phoneNumber: null,
          whatsappOptIn: false,
          telegramChatId: null,
          telegramUsername: null,
          telegramOptIn: false,
          telegramLinkToken: null,
          byokEnabled: false,
          notifyChannels: [],
          appPreferences: {},
          totpSecret: null,
          totpRecoveryCodes: null,
          isDeleted: true,
          deletedAt: new Date(),
          accountStatus: "DELETED"
        }
      });
    });

    logger.info(`[DELETION_WORKER] Successfully scrubbed user ${userId}`);
    return true;
  } catch (error: any) {
    logger.error(`[DELETION_WORKER] Failed to execute cleanup for user ${userId}: ${error.message}`);
    throw error;
  }
}
