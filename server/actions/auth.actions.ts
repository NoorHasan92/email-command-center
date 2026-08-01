"use server";
// server/actions/auth.actions.ts
// Server actions for user registration, login, and sessions.


import { db } from "@/server/repositories/db";
import { hashPassword, verifyPassword, validatePasswordStrength } from "@/services/security/password";
import { generateSecureToken, generateSessionToken } from "@/services/security/tokens";
import { logSecurityEvent, parseUserAgent } from "@/services/security/audit";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/services/emails/resend";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import crypto from "crypto";
import "server-only";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

async function createDatabaseSession(userId: string) {
  const sessionToken = generateSessionToken();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const headersList = await headers();
  const userAgentStr = headersList.get("user-agent") || "";
  const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";

  const { deviceType, browser, os } = parseUserAgent(userAgentStr);

  await db.session.create({
    data: {
      sessionToken,
      userId,
      expires,
      userAgent: userAgentStr,
      ipAddress,
      deviceType,
      browser,
      os,
    },
  });

  const useSecureCookies = process.env.NODE_ENV === "production";
  const cookieName = useSecureCookies ? "__Secure-authjs.session-token" : "authjs.session-token";

  // Next.js 15 requires cookies() to be awaited
  const cookieStore = await cookies();
  cookieStore.set(cookieName, sessionToken, {
    httpOnly: true,
    secure: useSecureCookies,
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function loginAction(formData: FormData) {
  try {
    const parsed = loginSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: "Invalid input" };

    const { email, password } = parsed.data;

    const user = await db.user.findUnique({ where: { email } });

    if (!user || user.isDeleted || !user.passwordHash) {
      await logSecurityEvent("LOGIN_FAILED", user?.id, { reason: "Invalid credentials or account deleted" });
      return { error: "Invalid email or password" };
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return { error: "Account is temporarily locked. Try again later." };
    }

    const isValid = await verifyPassword(user.passwordHash, password);

    if (!isValid) {
      const attempts = user.failedLoginAttempts + 1;
      const lockedUntil = attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) : null;

      await db.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          lockedUntil,
          lastFailedLoginAt: new Date(),
        },
      });

      if (lockedUntil) {
        await logSecurityEvent("ACCOUNT_LOCKED", user.id);
        return { error: "Account locked due to too many failed attempts." };
      }

      await logSecurityEvent("LOGIN_FAILED", user.id, { reason: "Invalid password" });
      return { error: "Invalid email or password" };
    }

    // Require email verification before login
    if (!user.emailVerified) {
      return { error: "Please verify your email address before logging in." };
    }

    // Success login
    await db.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    await createDatabaseSession(user.id);
    await logSecurityEvent("LOGIN_SUCCESS", user.id);

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "An unexpected error occurred" };
  }
}

export async function registerAction(formData: FormData) {
  try {
    const parsed = registerSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: parsed.error.errors[0].message };

    const { name, email, password } = parsed.data;

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      // Don't reveal account existence directly for security, but return generic error or handle flow
      return { error: "Email is already registered" };
    }

    const strength = validatePasswordStrength(password, [name, email]);
    if (!strength.isStrongEnough) {
      return { error: "Password is too weak. " + (strength.feedback.warning || "") };
    }

    const passwordHash = await hashPassword(password);

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    // Generate Verification Token
    const rawToken = generateSecureToken();
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    
    await db.verificationToken.create({
      data: {
        identifier: email,
        token: hashedToken,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    await sendVerificationEmail(email, rawToken);
    await logSecurityEvent("ACCOUNT_REGISTERED", user.id);

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "An unexpected error occurred" };
  }
}

export async function logoutAction() {
  const useSecureCookies = process.env.NODE_ENV === "production";
  const cookieName = useSecureCookies ? "__Secure-authjs.session-token" : "authjs.session-token";

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(cookieName)?.value;

  if (sessionToken) {
    const session = await db.session.findUnique({ where: { sessionToken } });
    if (session) {
      await db.session.delete({ where: { sessionToken } });
      await logSecurityEvent("LOGOUT", session.userId);
    }
  }

  cookieStore.delete(cookieName);
  return { success: true };
}

export async function logoutAllDevicesAction(formData?: FormData) {
  const useSecureCookies = process.env.NODE_ENV === "production";
  const cookieName = useSecureCookies ? "__Secure-authjs.session-token" : "authjs.session-token";

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(cookieName)?.value;

  if (sessionToken) {
    const currentSession = await db.session.findUnique({ where: { sessionToken } });
    if (currentSession) {
      await db.session.deleteMany({
        where: {
          userId: currentSession.userId,
          NOT: { id: currentSession.id },
        },
      });
      await logSecurityEvent("PASSWORD_CHANGED", currentSession.userId, { note: "Logged out all other devices" });
    }
  }
  
  revalidatePath("/settings");
}

export async function getActiveSessions() {
  const useSecureCookies = process.env.NODE_ENV === "production";
  const cookieName = useSecureCookies ? "__Secure-authjs.session-token" : "authjs.session-token";

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(cookieName)?.value;

  if (!sessionToken) return { sessions: [], currentSessionId: null };

  const currentSession = await db.session.findUnique({ where: { sessionToken } });
  if (!currentSession) return { sessions: [], currentSessionId: null };

  const sessions = await db.session.findMany({
    where: { userId: currentSession.userId },
    orderBy: { expires: "desc" },
    select: {
      id: true,
      expires: true,
      userAgent: true,
      ipAddress: true,
      deviceType: true,
      browser: true,
      os: true,
    }
  });

  return { sessions, currentSessionId: currentSession.id };
}

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function forgotPasswordAction(formData: FormData) {
  try {
    const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: "Invalid email" };

    const { email } = parsed.data;
    const user = await db.user.findUnique({ where: { email } });

    // Always return success even if user doesn't exist (prevent email enumeration)
    if (!user || user.isDeleted) return { success: true };

    const rawToken = generateSecureToken();
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    await db.passwordResetToken.create({
      data: {
        email,
        token: hashedToken,
        expires: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
      },
    });

    await sendPasswordResetEmail(email, rawToken);
    await logSecurityEvent("PASSWORD_RESET_REQUESTED", user.id);

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "An unexpected error occurred" };
  }
}

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function resetPasswordAction(formData: FormData) {
  try {
    const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: parsed.error.errors[0].message };

    const { token: rawToken, password } = parsed.data;
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    const resetTokenRecord = await db.passwordResetToken.findUnique({
      where: { token: hashedToken },
    });

    if (!resetTokenRecord || resetTokenRecord.expires < new Date()) {
      return { error: "Invalid or expired token" };
    }

    const user = await db.user.findUnique({ where: { email: resetTokenRecord.email } });
    if (!user || user.isDeleted) return { error: "Invalid user" };

    const strength = validatePasswordStrength(password, [user.email, user.name || ""]);
    if (!strength.isStrongEnough) {
      return { error: "Password is too weak. " + (strength.feedback.warning || "") };
    }

    const passwordHash = await hashPassword(password);

    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    await db.passwordResetToken.delete({ where: { id: resetTokenRecord.id } });
    
    // Invalidate all existing sessions on password reset
    await db.session.deleteMany({ where: { userId: user.id } });

    await logSecurityEvent("PASSWORD_RESET_COMPLETED", user.id);
    await logSecurityEvent("PASSWORD_CHANGED", user.id);

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "An unexpected error occurred" };
  }
}
