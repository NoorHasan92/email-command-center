// services/security/audit.ts
// Audit logging service for security events.

import { db } from "@/server/repositories/db";
import { headers } from "next/headers";
import { UAParser } from "ua-parser-js";
import "server-only";

export type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "PASSWORD_CHANGED"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET_COMPLETED"
  | "PROFILE_UPDATED"
  | "ACCOUNT_LOCKED"
  | "ACCOUNT_REGISTERED"
  | "ACCOUNT_LINK_SUCCESS"
  | "ACCOUNT_LINK_FAILED_EMAIL_MISMATCH"
  | "ACCOUNT_LINK_FAILED_ALREADY_LINKED"
  | "GMAIL_CONNECT_STARTED"
  | "GMAIL_CONNECTED"
  | "GMAIL_CONNECT_FAILED"
  | "GMAIL_WATCH_REGISTERED"
  | "GMAIL_WATCH_FAILED";

export async function logSecurityEvent(action: AuditAction, userId?: string | null, metadata?: any, tx?: any) {
  try {
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    // Verify user exists before inserting to prevent FK constraint violations
    if (userId) {
      const userExists = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!userExists) {
        console.warn(`[AUDIT] Skipping log for non-existent userId=${userId} action=${action}`);
        return;
      }
    }

    const data: any = {
      userId: userId || undefined,
      action,
      ipAddress,
      userAgent,
      metadata: metadata || undefined,
    };

    if (tx) {
      await tx.auditLog.create({ data });
    } else {
      await db.auditLog.create({ data });
    }
  } catch (error) {
    console.error("Failed to log security event:", error);
  }
}

export function parseUserAgent(userAgentString: string) {
  const parser = new UAParser(userAgentString);
  const result = parser.getResult();
  return {
    deviceType: result.device.type || "desktop",
    browser: `${result.browser.name || "Unknown"} ${result.browser.version || ""}`.trim(),
    os: `${result.os.name || "Unknown"} ${result.os.version || ""}`.trim(),
  };
}
