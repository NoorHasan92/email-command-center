import "server-only";
import { db } from "@/server/repositories/db";
import { PLAN_AI_LIMITS } from "@/config/plans";
import { logger } from "@/lib/logger";

export interface QuotaDetails {
  baseLimit: number;
  bonusLimit: number;
  totalLimit: number;
  used: number;
  remaining: number;
  resetDate: Date;
}

export class AIQuotaService {
  /**
   * Ensure a billing period exists and is up to date for the user.
   */
  static async refreshBillingPeriodIfNeeded(userId: string) {
    const usage = await db.userAIUsage.findUnique({ where: { userId } });
    const now = new Date();

    if (!usage) {
      // First time initialization
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      await db.userAIUsage.create({
        data: {
          userId,
          billingPeriodStart: start,
          billingPeriodEnd: end,
          platformAiUsed: 0
        }
      });
      return;
    }

    if (now >= usage.billingPeriodEnd) {
      // Rollover needed
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      await db.userAIUsage.update({
        where: { id: usage.id },
        data: {
          billingPeriodStart: start,
          billingPeriodEnd: end,
          platformAiUsed: 0
        }
      });
      // Replenished quota! Recover pending emails.
      await this.recoverPendingEmails(userId);
      return;
    }
  }

  /**
   * Retrieve full quota details dynamically calculated.
   */
  static async getUsage(userId: string): Promise<QuotaDetails> {
    await this.refreshBillingPeriodIfNeeded(userId);
    
    // Auto-recover any stuck reservations that might be lowering our quota artificially
    await this.recoverAbandonedReservations();
    
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { plan: true }
    });
    
    const usage = await db.userAIUsage.findUnique({ where: { userId } });
    
    const activeGrants = await db.aIQuotaGrant.findMany({
      where: {
        userId,
        remainingAmount: { gt: 0 },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });

    const baseLimit = PLAN_AI_LIMITS[user?.plan || "FREE"] || 500;
    const bonusLimit = activeGrants.reduce((acc, grant) => acc + grant.remainingAmount, 0);
    const totalLimit = baseLimit + bonusLimit;
    const used = usage?.platformAiUsed || 0;
    
    // Remaining is total available capacity - what's already used on the base plan
    const baseRemaining = Math.max(0, baseLimit - used);
    const remaining = baseRemaining + bonusLimit;

    return {
      baseLimit,
      bonusLimit,
      totalLimit,
      used,
      remaining,
      resetDate: usage?.billingPeriodEnd || new Date()
    };
  }

  /**
   * Atomically reserve 1 unit of platform quota.
   * Creates an AIUsageEvent in RESERVED state.
   */
  static async reservePlatformQuota(
    userId: string, 
    operationType: "EMAIL_ANALYSIS" | "EMAIL_DRAFT" | "CALENDAR_EXTRACTION"
  ): Promise<{ eventId: string; sourceId: string; type: "BASE" | "GRANT" } | null> {
    await this.refreshBillingPeriodIfNeeded(userId);

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { plan: true }
    });

    const baseLimit = PLAN_AI_LIMITS[user?.plan || "FREE"] || 500;
    
    // Reservation expires in 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    try {
      const reservation = await db.$transaction(async (tx) => {
        // 1. Check base usage
        const usage = await tx.userAIUsage.findUnique({ where: { userId } });
        if (usage && usage.platformAiUsed < baseLimit) {
          await tx.userAIUsage.update({
            where: { id: usage.id },
            data: { platformAiUsed: { increment: 1 } }
          });
          
          const event = await tx.aIUsageEvent.create({
            data: {
              userId,
              operationType,
              source: "PLATFORM",
              status: "RESERVED",
              quotaSourceType: "BASE",
              quotaSourceId: usage.id,
              expiresAt
            }
          });
          
          return { eventId: event.id, sourceId: usage.id, type: "BASE" as const };
        }

        // 2. Base exhausted, try active grants
        const activeGrants = await tx.aIQuotaGrant.findMany({
          where: {
            userId,
            remainingAmount: { gt: 0 },
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          },
          orderBy: { expiresAt: 'asc' } // Expiring soonest first
        });

        if (activeGrants.length > 0) {
          const grantToUse = activeGrants[0];
          await tx.aIQuotaGrant.update({
            where: { id: grantToUse.id },
            data: { remainingAmount: { decrement: 1 } }
          });
          
          const event = await tx.aIUsageEvent.create({
            data: {
              userId,
              operationType,
              source: "PLATFORM",
              status: "RESERVED",
              quotaSourceType: "GRANT",
              quotaSourceId: grantToUse.id,
              expiresAt
            }
          });
          
          return { eventId: event.id, sourceId: grantToUse.id, type: "GRANT" as const };
        }

        return null;
      }, {
        isolationLevel: "Serializable"
      });

      return reservation;
    } catch (error: any) {
      logger.error(`[QUOTA] Failed to reserve quota for ${userId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Start processing an AI request, extending the reservation lease.
   */
  static async startProcessing(eventId: string) {
    try {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minute lease
      
      await db.aIUsageEvent.updateMany({
        where: { id: eventId, status: "RESERVED" },
        data: {
          status: "PROCESSING",
          expiresAt
        }
      });
    } catch (error: any) {
      logger.error(`[QUOTA] Failed to start processing for event ${eventId}: ${error.message}`);
    }
  }

  /**
   * Commit reserved quota and log telemetry
   */
  static async commitPlatformQuota(eventId: string, telemetry: { provider: string; model: string; inputTokens: number; outputTokens: number; estimatedCost: number; latencyMs: number }) {
    try {
      await db.aIUsageEvent.updateMany({
        where: { 
          id: eventId,
          status: { in: ["RESERVED", "PROCESSING"] } 
        },
        data: {
          status: "COMMITTED",
          provider: telemetry.provider,
          model: telemetry.model,
          inputTokens: telemetry.inputTokens,
          outputTokens: telemetry.outputTokens,
          estimatedCost: telemetry.estimatedCost,
          latencyMs: telemetry.latencyMs
        }
      });
    } catch (error: any) {
      logger.error(`[QUOTA] Failed to commit quota for event ${eventId}: ${error.message}`);
    }
  }

  /**
   * Release reserved quota (e.g. if AI call fails)
   */
  static async releasePlatformQuota(reservation: { eventId: string; sourceId: string; type: "BASE" | "GRANT" }) {
    try {
      await db.$transaction(async (tx) => {
        const event = await tx.aIUsageEvent.findUnique({ where: { id: reservation.eventId } });
        if (event?.status === "RELEASED" || event?.status === "EXPIRED" || event?.status === "COMMITTED") return; 
        
        await tx.aIUsageEvent.update({
          where: { id: reservation.eventId },
          data: { status: "RELEASED" }
        });

        if (reservation.type === "BASE") {
          await tx.userAIUsage.update({
            where: { id: reservation.sourceId },
            data: { platformAiUsed: { decrement: 1 } }
          });
        } else if (reservation.type === "GRANT") {
          await tx.aIQuotaGrant.update({
            where: { id: reservation.sourceId },
            data: { remainingAmount: { increment: 1 } }
          });
        }
      });
    } catch (error: any) {
      logger.error(`[QUOTA] Failed to release quota for ${reservation.sourceId}: ${error.message}`);
    }
  }

  /**
   * Background cleanup: Recover stuck reservations that crashed mid-flight.
   */
  static async recoverAbandonedReservations() {
    try {
      const stuckEvents = await db.aIUsageEvent.findMany({
        where: {
          status: { in: ["RESERVED", "PROCESSING"] },
          expiresAt: { lt: new Date() }
        }
      });
      
      for (const event of stuckEvents) {
        if (!event.quotaSourceType || !event.quotaSourceId) continue;
        
        await this.releasePlatformQuota({
          eventId: event.id,
          sourceId: event.quotaSourceId,
          type: event.quotaSourceType as "BASE" | "GRANT"
        });
        
        // Mark as EXPIRED instead of RELEASED so we know it was an abandoned run
        await db.aIUsageEvent.update({
          where: { id: event.id },
          data: { status: "EXPIRED" }
        });
      }
    } catch (error: any) {
      logger.error(`[QUOTA] Failed to recover abandoned reservations: ${error.message}`);
    }
  }

  /**
   * Resumes paused PENDING_QUOTA emails back to QUEUED_FOR_AI if quota is replenished.
   */
  static async recoverPendingEmails(userId: string) {
    try {
      await db.email.updateMany({
        where: { 
          emailAccount: { userId },
          status: "PENDING_QUOTA"
        },
        data: {
          status: "QUEUED_FOR_AI"
        }
      });
      logger.info(`[QUOTA] Recovered PENDING_QUOTA emails for user ${userId}.`);
    } catch (error: any) {
      logger.error(`[QUOTA] Failed to recover pending emails for ${userId}: ${error.message}`);
    }
  }
}
