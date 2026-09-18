import "server-only";
import { db } from "@/server/repositories/db";
import { logger } from "@/lib/logger";

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: Date;
}

export class DistributedRateLimiter {
  /**
   * Evaluates atomic rate limit across all serverless instances using PostgreSQL RateLimitEntry.
   * @param key Unique key identifier (e.g. "msg:user_123")
   * @param limit Max allowed requests within the window
   * @param windowMs Time window in milliseconds
   */
  static async checkLimit(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    const now = new Date();
    const newResetAt = new Date(now.getTime() + windowMs);

    let attempts = 0;
    while (attempts < 3) {
      attempts++;
      try {
        return await db.$transaction(
          async (tx) => {
            const existing = await tx.rateLimitEntry.findUnique({
              where: { key },
            });

            // Window expired or first visit
            if (!existing || existing.resetAt <= now) {
              await tx.rateLimitEntry.upsert({
                where: { key },
                create: {
                  key,
                  tokens: limit - 1,
                  resetAt: newResetAt,
                },
                update: {
                  tokens: limit - 1,
                  resetAt: newResetAt,
                },
              });

              return {
                success: true,
                remaining: limit - 1,
                resetAt: newResetAt,
              };
            }

            // Tokens exhausted
            if (existing.tokens <= 0) {
              return {
                success: false,
                remaining: 0,
                resetAt: existing.resetAt,
              };
            }

            // Decrement token
            const updated = await tx.rateLimitEntry.update({
              where: { key },
              data: { tokens: { decrement: 1 } },
            });

            return {
              success: true,
              remaining: updated.tokens,
              resetAt: existing.resetAt,
            };
          },
          {
            isolationLevel: "Serializable",
          }
        );
      } catch (error: any) {
        if (error.code === "P2034" && attempts < 3) {
          // Transaction conflict retry
          await new Promise((res) => setTimeout(res, 20 * attempts));
          continue;
        }
        logger.error(`[RATE_LIMITER] Distributed limit check failed for ${key}: ${error.message}`);
        return { success: false, remaining: 0, resetAt: newResetAt };
      }
    }
    return { success: false, remaining: 0, resetAt: newResetAt };
  }

  /**
   * Rate limit inbound conversation messages: max 30 per minute per user.
   */
  static async limitInboundMessage(userId: string): Promise<boolean> {
    const res = await this.checkLimit(`inbound_msg:${userId}`, 30, 60 * 1000);
    return res.success;
  }

  /**
   * Rate limit research requests submission: max 5 per 10 minutes per user.
   */
  static async limitResearchRequest(userId: string): Promise<boolean> {
    const res = await this.checkLimit(`research_req:${userId}`, 5, 10 * 60 * 1000);
    return res.success;
  }

  /**
   * Global rate limit on expensive background research execution: max 20 per minute across the platform.
   */
  static async limitResearchExecution(): Promise<boolean> {
    const res = await this.checkLimit(`research_exec:global`, 20, 60 * 1000);
    return res.success;
  }

  /**
   * Cleans up expired rate limit entries to prevent DB bloat.
   */
  static async purgeExpiredEntries(): Promise<number> {
    try {
      const deleted = await db.rateLimitEntry.deleteMany({
        where: { resetAt: { lt: new Date() } },
      });
      return deleted.count;
    } catch (e: any) {
      logger.error(`[RATE_LIMITER] Purge expired entries failed: ${e.message}`);
      return 0;
    }
  }
}
