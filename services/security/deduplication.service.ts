import "server-only";
import { db } from "@/server/repositories/db";
import { ConversationChannel } from "@prisma/client";
import { logger } from "@/lib/logger";

export class WebhookDeduplicationService {
  /**
   * Atomically checks and records an inbound message.
   * Returns `true` if duplicate (already recorded), `false` if unique (freshly recorded).
   */
  static async isDuplicate(
    channel: ConversationChannel,
    provider: string,
    providerMessageId: string,
    userId?: string
  ): Promise<boolean> {
    try {
      await db.inboundMessageDeduplication.create({
        data: {
          channel,
          provider,
          providerMessageId,
          userId,
        },
      });
      return false; // Fresh message
    } catch (error: any) {
      // Prisma P2002 indicates unique constraint violation on @@unique([channel, provider, providerMessageId])
      if (error.code === "P2002") {
        logger.info(`[DEDUP] Duplicate message detected: channel=${channel}, provider=${provider}, id=${providerMessageId}`);
        return true; // Duplicate
      }
      logger.error(`[DEDUP] Deduplication check error: ${error.message}`);
      return false;
    }
  }
}
