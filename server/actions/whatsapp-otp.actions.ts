"use server";

import { db } from "@/server/repositories/db";
import { auth } from "@/config/auth";
import { logSecurityEvent } from "@/services/security/audit";
import { WhatsAppAdapter } from "@/services/whatsapp/whatsapp.adapter";
import { sendWhatsAppVerificationEmail } from "@/services/emails/resend";
import crypto from "crypto";

// Max 3 requests per hour
const MAX_REQUESTS = 3;
const COOLDOWN_HOURS = 1;
// 5 minutes expiry
const EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;

function generateCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function sendWhatsAppOTPAction(phoneNumber: string) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    // Check rate limit
    const anHourAgo = new Date(Date.now() - COOLDOWN_HOURS * 60 * 60 * 1000);
    const recentRequests = await db.whatsAppVerification.count({
      where: {
        userId,
        createdAt: { gte: anHourAgo }
      }
    });

    if (recentRequests >= MAX_REQUESTS) {
      return { error: "Too many requests. Please try again later." };
    }

    // Invalidate existing pending verifications
    await db.whatsAppVerification.updateMany({
      where: { userId, whatsappVerified: false, emailVerified: false },
      data: { expiresAt: new Date() } // Expire them immediately
    });

    // Generate separate codes
    const whatsappCode = generateCode();
    const emailCode = generateCode();
    const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000);

    // Save to DB
    const verification = await db.whatsAppVerification.create({
      data: {
        userId,
        phoneNumber,
        whatsappCode,
        emailCode,
        expiresAt
      }
    });

    // Dispatch codes
    try {
      const waAdapter = new WhatsAppAdapter();
      await waAdapter.sendOTP(phoneNumber, whatsappCode);
      
      await sendWhatsAppVerificationEmail(userEmail, emailCode);

      return { success: true, verificationId: verification.id };
    } catch (error: any) {
      console.error("[OTP Dispatch Error]", error);
      // Clean up the failed attempt
      await db.whatsAppVerification.delete({ where: { id: verification.id } });
      return { error: error.message || "Failed to send verification codes." };
    }

  } catch (error) {
    console.error(error);
    return { error: "An unexpected error occurred." };
  }
}

export async function verifyWhatsAppOTPAction(verificationId: string, whatsappCodeInput: string, emailCodeInput: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }
    const userId = session.user.id;

    const verification = await db.whatsAppVerification.findUnique({
      where: { id: verificationId }
    });

    if (!verification || verification.userId !== userId) {
      return { error: "Verification not found." };
    }

    if (verification.expiresAt < new Date()) {
      return { error: "Verification codes have expired. Please request new ones." };
    }

    if (verification.attempts >= MAX_ATTEMPTS) {
      return { error: "Too many failed attempts. Please request new codes." };
    }

    // Secure timing-safe comparison
    // Pad inputs to match length if they are short (timingSafeEqual requires equal length buffers)
    const waBuffer = Buffer.from(verification.whatsappCode);
    const waInputBuffer = Buffer.from(whatsappCodeInput.padEnd(6, ' '));
    const isWaMatch = waBuffer.length === waInputBuffer.length && crypto.timingSafeEqual(waBuffer, waInputBuffer);

    const emailBuffer = Buffer.from(verification.emailCode);
    const emailInputBuffer = Buffer.from(emailCodeInput.padEnd(6, ' '));
    const isEmailMatch = emailBuffer.length === emailInputBuffer.length && crypto.timingSafeEqual(emailBuffer, emailInputBuffer);

    if (!isWaMatch || !isEmailMatch) {
      await db.whatsAppVerification.update({
        where: { id: verificationId },
        data: { attempts: { increment: 1 } }
      });
      return { error: "Invalid codes. Please check both your WhatsApp and Email." };
    }

    // Success! Update the user profile
    const user = await db.user.findUnique({ where: { id: userId } });
    const existingChannels = Array.isArray(user?.notifyChannels) ? user.notifyChannels as string[] : [];
    const newChannels = Array.from(new Set([...existingChannels, "WHATSAPP"]));

    await db.user.update({
      where: { id: userId },
      data: {
        phoneNumber: verification.phoneNumber,
        whatsappOptIn: true,
        notifyChannels: newChannels
      }
    });

    // Cleanup the verification record
    await db.whatsAppVerification.delete({ where: { id: verificationId } });
    
    await logSecurityEvent("PROFILE_UPDATED", userId, { note: "WhatsApp connected via OTP" });

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "An unexpected error occurred during verification." };
  }
}
