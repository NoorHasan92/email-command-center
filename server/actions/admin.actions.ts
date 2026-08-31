"use server";

import { auth } from "@/config/auth";
import { db } from "@/server/repositories/db";
import { revalidatePath } from "next/cache";

/**
 * Ensures the caller is an authenticated ADMIN.
 * Throws an error if not.
 */
export async function requireAdmin() {
  const session = await auth();
  // @ts-expect-error - role is extended but not in next-auth DefaultUser type yet
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }
  return session.user;
}

/**
 * Fetches all users from the database for the admin dashboard.
 */
export async function getUsers() {
  await requireAdmin();

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      aiUsage: true,
      aiConnection: true,
      _count: {
        select: {
          emailAccounts: true,
          auditLogs: true,
        },
      },
    },
  });

  return users;
}

/**
 * Permanently deletes a user from the system.
 */
export async function deleteUser(userId: string) {
  await requireAdmin();

  // Protect against self-deletion or deleting the primary admin, if desired
  // For now, let's just delete the user using Prisma's cascade deletes
  await db.user.delete({
    where: { id: userId },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

/**
 * Grants a manual quota bonus to a user.
 */
export async function grantBonusQuota(userId: string, amount: number, reason: string) {
  const admin = await requireAdmin();

  await db.$transaction(async (tx) => {
    // Upsert UserAIUsage
    const usage = await tx.userAIUsage.upsert({
      where: { userId },
      create: {
        userId,
        lifetimeGranted: amount,
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      update: {
        lifetimeGranted: { increment: amount },
      }
    });

    // Create Grant record
    await tx.aIQuotaGrant.create({
      data: {
        userId,
        amount,
        remainingAmount: amount,
        reason,
        source: "ADMIN",
      }
    });

    // Log admin action
    await tx.adminAuditLog.create({
      data: {
        adminId: admin.id!,
        targetUserId: userId,
        action: "GRANT_AI_QUOTA",
        newValue: { amount, reason },
      }
    });
  });

  const { AIQuotaService } = await import("@/services/ai/quota.service");
  await AIQuotaService.recoverPendingEmails(userId);

  revalidatePath("/admin/ai-operations");
  return { success: true };
}

/**
 * Recalculates user fast-counters from raw AIUsageEvents to fix any drift.
 */
export async function reconcileQuota(targetUserId: string) {
  await requireAdmin();

  const userUsage = await db.userAIUsage.findUnique({ where: { userId: targetUserId } });
  let platformCount = 0;
  
  if (userUsage) {
    // Base plan usage within current billing period
    platformCount = await db.aIUsageEvent.count({
      where: {
        userId: targetUserId,
        status: "COMMITTED",
        quotaSourceType: "BASE",
        createdAt: {
          gte: userUsage.billingPeriodStart,
          lte: userUsage.billingPeriodEnd
        }
      }
    });

    await db.userAIUsage.update({
      where: { userId: targetUserId },
      data: { platformAiUsed: platformCount }
    });
  }

  // Active grants
  const activeGrants = await db.aIQuotaGrant.findMany({
    where: { userId: targetUserId }
  });

  for (const grant of activeGrants) {
    const grantUsage = await db.aIUsageEvent.count({
      where: {
        userId: targetUserId,
        status: "COMMITTED",
        quotaSourceType: "GRANT",
        quotaSourceId: grant.id
      }
    });

    await db.aIQuotaGrant.update({
      where: { id: grant.id },
      data: { remainingAmount: Math.max(0, grant.amount - grantUsage) }
    });
  }

  // Aggregate committed Personal Usage (Lifetime)
  const personalCount = await db.aIUsageEvent.count({
    where: {
      userId: targetUserId,
      source: "PERSONAL",
      status: "COMMITTED"
    }
  });
  
  // Aggregate Fallback specifically (Lifetime)
  const fallbackCount = await db.aIUsageEvent.count({
    where: {
      userId: targetUserId,
      source: "PLATFORM_FALLBACK",
      status: "COMMITTED"
    }
  });

  await db.userAIConnection.update({
    where: { userId: targetUserId },
    data: { 
      personalRequestCount: personalCount,
      fallbackRequestCount: fallbackCount
    }
  }).catch(() => null);

  revalidatePath("/admin/ai-operations");
  return { success: true, platformCount, personalCount, fallbackCount };
}
