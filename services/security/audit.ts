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
  | "ACCOUNT_REGISTERED";

export async function logSecurityEvent(action: AuditAction, userId?: string | null, metadata?: any) {
  try {
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    await db.auditLog.create({
      data: {
        userId,
        action,
        ipAddress,
        userAgent,
        metadata: metadata || undefined,
      },
    });
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
