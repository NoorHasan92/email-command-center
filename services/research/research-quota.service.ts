import "server-only";
import { db } from "@/server/repositories/db";
import { PLAN_RESEARCH_LIMITS } from "@/config/plans";
import { logger } from "@/lib/logger";

export interface ResearchQuotaDetails {
  baseLimit: number;
  completedCount: number;
  reservedCount: number;
  remaining: number;
  resetDate: Date;
}

export class ResearchQuotaService {
  /**
   * Ensures the user's research billing period exists and is current.
   */
  static async refreshBillingPeriodIfNeeded(userId: string) {
    const usage = await db.userResearchUsage.findUnique({ where: { userId } });
    const now = new Date();

    if (!usage) {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      await db.userResearchUsage.upsert({
        where: { userId },
        create: {
          userId,
          billingPeriodStart: start,
          billingPeriodEnd: end,
          completedCount: 0,
          reservedCount: 0,
        },
        update: {},
      });
      return;
    }

    if (now >= usage.billingPeriodEnd) {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      // Atomic guard against concurrent double-reset
      await db.userResearchUsage.updateMany({
        where: { id: usage.id, billingPeriodEnd: usage.billingPeriodEnd },
        data: {
          billingPeriodStart: start,
          billingPeriodEnd: end,
          completedCount: 0,
          reservedCount: 0,
        },
      });
    }
  }

  /**
   * Recovers any abandoned reservations that expired without being committed or released.
   */
  static async recoverAbandonedReservations() {
    try {
      const now = new Date();
      const expired = await db.researchQuotaReservation.findMany({
        where: {
          status: "RESERVED",
          expiresAt: { lt: now },
        },
        take: 20,
      });

      for (const res of expired) {
        await this.releaseQuota(res.researchSessionId, "Reservation expired / lease timeout");
      }
    } catch (e: any) {
      logger.error(`[RESEARCH_QUOTA] Failed to recover abandoned reservations: ${e.message}`);
    }
  }

  /**
   * Gets current research quota balance for a user.
   */
  static async getUsage(userId: string): Promise<ResearchQuotaDetails> {
    await this.refreshBillingPeriodIfNeeded(userId);
    await this.recoverAbandonedReservations();

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    const usage = await db.userResearchUsage.findUnique({ where: { userId } });
    const baseLimit = PLAN_RESEARCH_LIMITS[user?.plan || "FREE"] || 0;

    const completed = usage?.completedCount || 0;
    const reserved = usage?.reservedCount || 0;
    const remaining = Math.max(0, baseLimit - (completed + reserved));

    return {
      baseLimit,
      completedCount: completed,
      reservedCount: reserved,
      remaining,
      resetDate: usage?.billingPeriodEnd || new Date(),
    };
  }

  /**
   * Atomically reserves 1 research quota unit for a specific ResearchSession.
   * If the ResearchSession already has an active reservation, reuses it (idempotency).
   */
  static async reserveQuota(
    userId: string,
    researchSessionId: string
  ): Promise<{ reservationId: string } | null> {
    await this.refreshBillingPeriodIfNeeded(userId);

    // Idempotency: Check if reservation already exists for this session
    const existing = await db.researchQuotaReservation.findUnique({
      where: { researchSessionId },
    });

    if (existing) {
      if (existing.status === "RESERVED") {
        return { reservationId: existing.id };
      }
      if (existing.status === "COMMITTED") {
        // Already successfully executed and committed
        return { reservationId: existing.id };
      }
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    const baseLimit = PLAN_RESEARCH_LIMITS[user?.plan || "FREE"] || 0;
    if (baseLimit <= 0) {
      return null; // Not entitled
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lease

    try {
      return await db.$transaction(
        async (tx) => {
          const usage = await tx.userResearchUsage.findUnique({ where: { userId } });
          if (!usage) return null;

          const totalInFlight = usage.completedCount + usage.reservedCount;
          if (totalInFlight >= baseLimit) {
            return null; // Quota exhausted
          }

          // Increment reserved count
          await tx.userResearchUsage.update({
            where: { id: usage.id },
            data: { reservedCount: { increment: 1 } },
          });

          // Create or update reservation record
          const reservation = await tx.researchQuotaReservation.upsert({
            where: { researchSessionId },
            create: {
              userId,
              researchSessionId,
              status: "RESERVED",
              billingPeriodEnd: usage.billingPeriodEnd,
              expiresAt,
            },
            update: {
              status: "RESERVED",
              expiresAt,
              reason: null,
            },
          });

          return { reservationId: reservation.id };
        },
        { isolationLevel: "Serializable" }
      );
    } catch (e: any) {
      logger.error(`[RESEARCH_QUOTA] Failed to reserve quota for ${userId}: ${e.message}`);
      return null;
    }
  }

  /**
   * Commits reserved quota when research successfully completes.
   */
  static async commitQuota(researchSessionId: string): Promise<boolean> {
    try {
      return await db.$transaction(async (tx) => {
        const reservation = await tx.researchQuotaReservation.findUnique({
          where: { researchSessionId },
        });

        if (!reservation) {
          logger.warn(`[RESEARCH_QUOTA] No reservation found to commit for session ${researchSessionId}`);
          return false;
        }

        if (reservation.status === "COMMITTED") {
          return true; // Already committed idempotently
        }

        if (reservation.status !== "RESERVED") {
          logger.warn(`[RESEARCH_QUOTA] Reservation ${reservation.id} in state ${reservation.status} cannot be committed`);
          return false;
        }

        // Update reservation to COMMITTED
        await tx.researchQuotaReservation.update({
          where: { id: reservation.id },
          data: {
            status: "COMMITTED",
            committedAt: new Date(),
          },
        });

        // Decrement reserved, increment completed
        await tx.userResearchUsage.update({
          where: { userId: reservation.userId },
          data: {
            reservedCount: { decrement: 1 },
            completedCount: { increment: 1 },
          },
        });

        return true;
      });
    } catch (e: any) {
      logger.error(`[RESEARCH_QUOTA] Failed to commit quota for ${researchSessionId}: ${e.message}`);
      return false;
    }
  }

  /**
   * Releases reserved quota when research fails, ensuring failed attempts do not consume quota.
   */
  static async releaseQuota(researchSessionId: string, reason?: string): Promise<boolean> {
    try {
      return await db.$transaction(async (tx) => {
        const reservation = await tx.researchQuotaReservation.findUnique({
          where: { researchSessionId },
        });

        if (!reservation) return false;
        if (reservation.status === "RELEASED" || reservation.status === "COMMITTED") {
          return true; // Idempotent
        }

        await tx.researchQuotaReservation.update({
          where: { id: reservation.id },
          data: {
            status: "RELEASED",
            releasedAt: new Date(),
            reason: reason || "Research execution failure",
          },
        });

        await tx.userResearchUsage.update({
          where: { userId: reservation.userId },
          data: {
            reservedCount: { decrement: 1 },
          },
        });

        return true;
      });
    } catch (e: any) {
      logger.error(`[RESEARCH_QUOTA] Failed to release quota for ${researchSessionId}: ${e.message}`);
      return false;
    }
  }
}
