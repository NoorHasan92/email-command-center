// services/emails/resend.ts
// Email delivery service using Resend.

import { Resend } from "resend";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";
import "server-only";

// Use a mock client if no API key is provided (e.g., development without Resend configured)
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendVerificationEmail(email: string, token: string) {
  // Use env.NEXT_PUBLIC_APP_URL to ensure absolute URL
  const verifyUrl = `${env.NEXT_PUBLIC_APP_URL}/verify?token=${token}`;

  if (!resend) {
    logger.info(`[MOCK EMAIL] Verification Email to ${email}. Link: ${verifyUrl}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: email,
    subject: "Verify your email - Inbox Sentinel",
    html: `<p>Click the link below to verify your email address:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });

  if (error) {
    logger.error({ err: error, email }, "[RESEND] Failed to send verification email");
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  // Use env.NEXT_PUBLIC_APP_URL to ensure absolute URL
  const resetUrl = `${env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  if (!resend) {
    logger.info(`[MOCK EMAIL] Password Reset Email to ${email}. Link: ${resetUrl}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: email,
    subject: "Reset your password - Inbox Sentinel",
    html: `<p>Click the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });

  if (error) {
    logger.error({ err: error, email }, "[RESEND] Failed to send password reset email");
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
}

export async function sendWhatsAppVerificationEmail(email: string, code: string) {
  if (!resend) {
    logger.info(`[MOCK EMAIL] WhatsApp Verification Email to ${email}. Code: ${code}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: email,
    subject: "WhatsApp Verification Code - Inbox Sentinel",
    html: `
      <h2>Verify your WhatsApp number</h2>
      <p>Please enter the following code in Inbox Sentinel to verify your WhatsApp number:</p>
      <h1 style="font-size: 32px; letter-spacing: 4px; padding: 10px; background-color: #f4f4f5; border-radius: 8px; display: inline-block;">${code}</h1>
      <p>This code expires in 5 minutes.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });

  if (error) {
    logger.error({ err: error, email }, "[RESEND] Failed to send WhatsApp verification email");
    throw new Error(`Failed to send WhatsApp verification email: ${error.message}`);
  }
}
