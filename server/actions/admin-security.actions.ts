"use server";

import { db } from "@/server/repositories/db";
import { requireAdmin } from "./admin.actions";
import { logger } from "@/lib/logger";

export async function getAdminSecurityLogs(page = 1, limit = 50, search = "") {
  await requireAdmin();
  const skip = (page - 1) * limit;

  const where = search ? {
    OR: [
      { user: { email: { contains: search, mode: 'insensitive' as const } } },
      { ipAddress: { contains: search, mode: 'insensitive' as const } },
    ]
  } : {};

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.auditLog.count({ where }),
  ]);

  return { logs, total };
}

// Example destructive action requiring admin
export async function revokeUserSessions(targetUserId: string) {
  const admin = await requireAdmin();
  
  if (admin.id === targetUserId) {
    throw new Error("Cannot revoke your own active sessions from this panel.");
  }

  // Delete all sessions for the target user
  await db.session.deleteMany({
    where: { userId: targetUserId }
  });

  // Log to AdminAuditLog
  await db.adminAuditLog.create({
    data: {
      adminId: admin.id as string,
      targetUserId,
      action: "REVOKE_ALL_SESSIONS",
      reason: "Admin manual revocation via Security Center"
    }
  });

  logger.info(`[ADMIN] User ${admin.email || "Unknown"} revoked all sessions for user ${targetUserId}`);
  
  return { success: true };
}

export async function getSuspiciousActivity() {
  await requireAdmin();

  // Find users with more than 5 failed login attempts
  const highFailureUsers = await db.user.findMany({
    where: { failedLoginAttempts: { gte: 5 } },
    select: { id: true, email: true, name: true, failedLoginAttempts: true, lockedUntil: true }
  });

  // Find recent lockout events
  const recentLockouts = await db.auditLog.findMany({
    where: { 
      action: "ACCOUNT_LOCKED",
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    },
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
    take: 10
  });

  return { highFailureUsers, recentLockouts };
}
