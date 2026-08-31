import { db } from "@/server/repositories/db";
import { logger } from "@/lib/logger";

export type EntitlementSource = "PAYMENT" | "ADMIN_GRANT" | "PROMOTION" | "TRIAL" | "LEGACY" | "SYSTEM";
export type EntitlementType = "PLAN" | "FEATURE";
export type EntitlementValue = "FREE" | "PRO" | "ULTRA" | "BYOK_ADDON" | string;

export interface GrantParams {
  type: EntitlementType;
  value: EntitlementValue;
  source: EntitlementSource;
  expiresAt?: Date;
  paymentId?: string;
  orderId?: string;
  grantedByAdminId?: string;
  metadata?: any;
}

export class EntitlementService {
  /**
   * Determine the user's highest active plan (ULTRA > PRO > FREE)
   */
  static async getEffectivePlan(userId: string): Promise<string> {
    const entitlements = await db.userEntitlement.findMany({
      where: {
        userId,
        type: "PLAN",
        status: "ACTIVE",
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
      }
    });

    const plans = entitlements.map(e => e.value);

    if (plans.includes("ULTRA")) return "ULTRA";
    if (plans.includes("PRO")) return "PRO";

    // Legacy fallback
    const user = await db.user.findUnique({ where: { id: userId }, select: { plan: true } });
    if (user?.plan === "ADMIN") return "ADMIN";
    if (user?.plan === "ULTRA") return "ULTRA";
    if (user?.plan === "PRO") return "PRO";

    return "FREE";
  }

  /**
   * Check if a user has a specific feature active.
   */
  static async hasFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const entitlement = await db.userEntitlement.findFirst({
      where: {
        userId,
        type: "FEATURE",
        value: feature,
        status: "ACTIVE",
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
      }
    });

    if (entitlement) return true;

    // Admin always gets access
    const plan = await this.getEffectivePlan(userId);
    if (plan === "ADMIN") return true;

    // Legacy fallback for BYOK
    if (feature === "BYOK_ADDON") {
      const user = await db.user.findUnique({ where: { id: userId }, select: { byokEnabled: true } });
      return user?.byokEnabled === true;
    }

    return false;
  }

  /**
   * Grant a new entitlement to a user.
   */
  static async grant(userId: string, params: GrantParams) {
    const entitlement = await db.userEntitlement.create({
      data: {
        userId,
        type: params.type,
        value: params.value,
        source: params.source,
        expiresAt: params.expiresAt,
        paymentId: params.paymentId,
        orderId: params.orderId,
        grantedByAdminId: params.grantedByAdminId,
        metadata: params.metadata || {}
      }
    });

    logger.info({
      userId,
      entitlementId: entitlement.id,
      type: params.type,
      value: params.value,
      source: params.source
    }, "Entitlement granted");

    return entitlement;
  }

  /**
   * Revoke an active entitlement
   */
  static async revoke(entitlementId: string, adminId: string, reason: string) {
    const updated = await db.userEntitlement.update({
      where: { id: entitlementId },
      data: {
        status: "REVOKED",
        revokedAt: new Date()
      }
    });

    await db.adminAuditLog.create({
      data: {
        adminId,
        targetUserId: updated.userId,
        action: "REVOKE_ENTITLEMENT",
        reason,
        previousValue: { status: "ACTIVE" },
        newValue: { status: "REVOKED" }
      }
    });

    logger.warn({ entitlementId, userId: updated.userId, reason }, "Entitlement revoked");

    return updated;
  }
}
