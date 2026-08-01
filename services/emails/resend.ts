import { Resend } from "resend";
import { env } from "@/config/env";
import "server-only";

// Use a mock client if no API key is provided (e.g., development without Resend configured)
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const SENDER_EMAIL = "Inbox Sentinel <onboarding@resend.dev>"; // Update this in production

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${token}`;

  if (!resend) {
    console.log(`[MOCK EMAIL] Verification Email to ${email}. Link: ${verifyUrl}`);
    return;
  }

  await resend.emails.send({
    from: SENDER_EMAIL,
    to: email,
    subject: "Verify your email - Inbox Sentinel",
    html: `<p>Click the link below to verify your email address:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  if (!resend) {
    console.log(`[MOCK EMAIL] Password Reset Email to ${email}. Link: ${resetUrl}`);
    return;
  }

  await resend.emails.send({
    from: SENDER_EMAIL,
    to: email,
    subject: "Reset your password - Inbox Sentinel",
    html: `<p>Click the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });
}
