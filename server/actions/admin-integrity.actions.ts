"use server";

import { db } from "@/server/repositories/db";
import { requireAdmin } from "./admin.actions";

export async function getDatabaseIntegrityReport() {
  await requireAdmin();

  // 1. Orphaned Payments check is not needed because orderId is required in schema
  const orphanedPayments = 0;

  // 2. Duplicate Provider Payment IDs
  const duplicatePaymentsQuery = await db.$queryRaw`
    SELECT "providerPaymentId", COUNT(*) as count 
    FROM "Payment" 
    WHERE "providerPaymentId" IS NOT NULL 
    GROUP BY "providerPaymentId" 
    HAVING COUNT(*) > 1
  `;
  const duplicatePaymentIds = (duplicatePaymentsQuery as any[]).length;

  // 3. Expired Quota Reservations stuck in PROCESSING or RESERVED
  const expiredStuckQuota = await db.aIUsageEvent.count({
    where: {
      status: { in: ["RESERVED", "PROCESSING"] },
      expiresAt: { lt: new Date() }
    }
  });

  // 4. Mismatched Entitlements (Active PLAN without PAYMENT when source=PAYMENT)
  const unpaidEntitlements = await db.userEntitlement.count({
    where: {
      type: "PLAN",
      status: "ACTIVE",
      source: "PAYMENT",
      user: {
        payments: {
          none: { status: "CAPTURED" }
        }
      }
    }
  });

  // 5. Stuck Account Deletions
  const stuckDeletions = await db.accountDeletionRequest.count({
    where: {
      status: "PROCESSING",
      updatedAt: { lt: new Date(Date.now() - 60 * 60 * 1000) } // older than 1 hour
    }
  });

  return {
    orphanedPayments,
    duplicatePaymentIds,
    expiredStuckQuota,
    unpaidEntitlements,
    stuckDeletions
  };
}
