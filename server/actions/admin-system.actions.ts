"use server";

import { db } from "@/server/repositories/db";
import { requireAdmin } from "./admin.actions";
import { logger } from "@/lib/logger";

export async function getAdminWebhookEvents(page = 1, limit = 50, filterStatus = "") {
  await requireAdmin();
  const skip = (page - 1) * limit;

  const where = filterStatus ? { status: filterStatus } : {};

  const [events, total] = await Promise.all([
    db.webhookEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.webhookEvent.count({ where }),
  ]);

  return { events, total };
}

export async function getAdminAIFailures(page = 1, limit = 50) {
  await requireAdmin();
  const skip = (page - 1) * limit;

  const where = { status: "FAILED" as const };

  const [failures, total] = await Promise.all([
    db.aIUsageEvent.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true } }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.aIUsageEvent.count({ where }),
  ]);

  return { failures, total };
}

export async function retryWebhookEvent(eventId: string) {
  const admin = await requireAdmin();
  
  const event = await db.webhookEvent.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Event not found");

  // Atomic update to ensure only FAILED webhooks are retried and prevent concurrent retries
  const result = await db.webhookEvent.updateMany({
    where: { id: eventId, status: "FAILED" },
    data: { 
      status: "PENDING", 
      retryCount: { increment: 1 },
      errorHistory: event.error ? event.error : undefined,
      error: null 
    }
  });

  if (result.count === 0) throw new Error("Event cannot be retried or was already retried");

  await db.adminAuditLog.create({
    data: {
      adminId: admin.id as string,
      targetUserId: "SYSTEM",
      action: "RETRY_WEBHOOK",
      reason: `Retrying webhook ${eventId}`
    }
  });

  logger.info(`[ADMIN] Webhook ${eventId} queued for retry by ${admin.email || "Unknown"}`);
  
  return { success: true };
}
