"use server";

import { db } from "@/server/repositories/db";
import { requireAdmin } from "./admin.actions";
import { logger } from "@/lib/logger";

export async function getAdminPayments(page = 1, limit = 50, search = "") {
  await requireAdmin();
  const skip = (page - 1) * limit;

  const where = search ? {
    OR: [
      { receiptNumber: { contains: search, mode: 'insensitive' as const } },
      { providerPaymentId: { contains: search, mode: 'insensitive' as const } },
      { user: { email: { contains: search, mode: 'insensitive' as const } } },
      { order: { referenceNumber: { contains: search, mode: 'insensitive' as const } } },
    ]
  } : {};

  const [payments, total] = await Promise.all([
    db.payment.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        order: { select: { id: true, referenceNumber: true, productType: true } }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.payment.count({ where }),
  ]);

  return { payments, total };
}

export async function getAdminRevenueMetrics() {
  await requireAdmin();

  const [totalRevenue, totalPayments, successfulPayments] = await Promise.all([
    db.payment.aggregate({
      where: { status: "CAPTURED" },
      _sum: { amount: true },
    }),
    db.payment.count(),
    db.payment.count({ where: { status: "CAPTURED" } })
  ]);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentPayments = await db.payment.findMany({
    where: { 
      status: "CAPTURED",
      createdAt: { gte: thirtyDaysAgo }
    },
    select: { amount: true, createdAt: true },
    orderBy: { createdAt: "asc" }
  });

  const dailyRevenue = recentPayments.reduce((acc, p) => {
    const date = p.createdAt.toISOString().split("T")[0];
    acc[date] = (acc[date] || 0) + p.amount;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalRevenue: (totalRevenue._sum.amount || 0) / 100, 
    totalPayments,
    successfulPayments,
    dailyRevenue: Object.entries(dailyRevenue).map(([date, amount]) => ({
      date,
      amount: amount / 100
    }))
  };
}

export async function getAdminTransactionalEmails(page = 1, limit = 50, search = "") {
  await requireAdmin();
  const skip = (page - 1) * limit;

  const where = search ? {
    OR: [
      { recipient: { contains: search, mode: 'insensitive' as const } },
      { idempotencyKey: { contains: search, mode: 'insensitive' as const } },
      { subject: { contains: search, mode: 'insensitive' as const } },
    ]
  } : {};

  const [emails, total] = await Promise.all([
    db.transactionalEmailLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.transactionalEmailLog.count({ where }),
  ]);

  return { emails, total };
}

export async function getAdminAccountDeletions(page = 1, limit = 50, search = "") {
  await requireAdmin();
  const skip = (page - 1) * limit;

  const where = search ? {
    user: {
      email: { contains: search, mode: 'insensitive' as const }
    }
  } : {};

  const [requests, total] = await Promise.all([
    db.accountDeletionRequest.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { requestedAt: "desc" },
      skip,
      take: limit,
    }),
    db.accountDeletionRequest.count({ where }),
  ]);

  return { requests, total };
}

export async function getPaymentAnomalies() {
  await requireAdmin();

  // Find users with CAPTURED payments but NO active PLAN entitlement
  const missingEntitlement = await db.user.findMany({
    where: {
      payments: {
        some: {
          status: "CAPTURED",
          order: {
            productType: { in: ["PLAN_PRO", "PLAN_ULTRA"] }
          }
        }
      },
      entitlements: {
        none: {
          type: "PLAN",
          status: "ACTIVE"
        }
      }
    },
    select: { id: true, email: true, name: true, plan: true }
  });

  // Find users with an ACTIVE PAYMENT entitlement but NO captured payments
  const unpaidEntitlementUsers = await db.userEntitlement.findMany({
    where: {
      type: "PLAN",
      status: "ACTIVE",
      source: "PAYMENT",
      user: {
        payments: {
          none: { status: "CAPTURED" }
        }
      }
    },
    include: { user: { select: { id: true, email: true, name: true, plan: true } } }
  });
  
  const unpaidEntitlement = unpaidEntitlementUsers.map(e => e.user);

  return { missingEntitlement, unpaidEntitlement };
}

export async function forceFailDeletion(requestId: string) {
  const admin = await requireAdmin();
  
  const request = await db.accountDeletionRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error("Request not found");
  if (request.status !== "PROCESSING") throw new Error("Can only force fail PROCESSING requests");

  await db.accountDeletionRequest.update({
    where: { id: requestId },
    data: { status: "FAILED", feedback: "Admin forced failure from stuck PROCESSING state." }
  });

  await db.adminAuditLog.create({
    data: {
      adminId: admin.id as string,
      targetUserId: request.userId,
      action: "FORCE_FAIL_DELETION",
      reason: `Forced failure of deletion request ${requestId}`
    }
  });

  logger.info(`[ADMIN] User ${admin.email || "Unknown"} forced failure for deletion ${requestId}`);
  return { success: true };
}

export async function retryDeletion(requestId: string) {
  const admin = await requireAdmin();
  
  const request = await db.accountDeletionRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error("Request not found");
  if (request.status !== "FAILED") throw new Error("Can only retry FAILED requests");

  const result = await db.accountDeletionRequest.updateMany({
    where: { id: requestId, status: "FAILED" },
    data: { status: "SCHEDULED" } // Next cron will pick it up
  });

  if (result.count === 0) throw new Error("Failed to retry (status changed).");

  await db.adminAuditLog.create({
    data: {
      adminId: admin.id as string,
      targetUserId: request.userId,
      action: "RETRY_DELETION",
      reason: `Scheduled deletion request ${requestId} for retry`
    }
  });

  logger.info(`[ADMIN] User ${admin.email || "Unknown"} retried deletion ${requestId}`);
  return { success: true };
}
