"use server";

import { db } from "@/server/repositories/db";
import { auth } from "@/config/auth";
import { logSecurityEvent } from "@/services/security/audit";
import { BaileysAdapter } from "@/services/whatsapp/baileys.adapter";
import { ChannelDispatcherService } from "@/services/assistant/channel-dispatcher.service";
import { sendWhatsAppVerificationEmail } from "@/services/emails/resend";
import crypto from "crypto";

// Max 15 requests per hour
const MAX_REQUESTS = 15;
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

    // Check if phone number is already registered to ANOTHER user
    const existingUser = await db.user.findFirst({
      where: {
        phoneNumber,
        whatsappOptIn: true,
        id: { not: userId }
      }
    });

    if (existingUser) {
      return { error: "This phone number is already connected to another account." };
    }

    // Invalidate existing pending verifications
    await db.whatsAppVerification.updateMany({
      where: { userId, whatsappVerified: false, emailVerified: false },
      data: { expiresAt: new Date() } // Expire them immediately
    });

    // Generate separate codes
    let whatsappCode = generateCode();
    const emailCode = generateCode();
    const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000);

    // Attempt dispatch via WhatsApp System Sender
    let waDelivered = false;
    try {
      const waAdapter = new BaileysAdapter('SYSTEM_SENDER');
      await waAdapter.sendOTP(phoneNumber, whatsappCode);
      waDelivered = true;
    } catch (waErr: any) {
      console.warn("[OTP Dispatch Warning] System WhatsApp sender offline. Falling back to email delivery:", waErr.message);
      // Fallback: If system sender is offline, match codes so the user receives and verifies via their email
      whatsappCode = emailCode;
    }

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

    // Dispatch email verification code
    try {
      await sendWhatsAppVerificationEmail(userEmail, emailCode);
    } catch (emailErr: any) {
      console.error("[OTP Email Dispatch Error]", emailErr);
      if (!waDelivered) {
        await db.whatsAppVerification.delete({ where: { id: verification.id } });
        return { error: "Failed to dispatch verification email. Please check your email configuration." };
      }
    }

    return { 
      success: true, 
      verificationId: verification.id,
      note: waDelivered ? undefined : "System WhatsApp sender is reconnecting. Your 6-digit verification code has been delivered to your email inbox."
    };

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
    const waInputBuffer = Buffer.from((whatsappCodeInput || "").padEnd(6, ' '));
    const isWaMatch = waBuffer.length === waInputBuffer.length && crypto.timingSafeEqual(waBuffer, waInputBuffer);

    const emailBuffer = Buffer.from(verification.emailCode);
    const emailInputBuffer = Buffer.from((emailCodeInput || "").padEnd(6, ' '));
    const isEmailMatch = emailBuffer.length === emailInputBuffer.length && crypto.timingSafeEqual(emailBuffer, emailInputBuffer);

    // Valid if both match, OR if WhatsApp sender was offline (codes mirrored) and user entered email code
    const isMirroredFallback = verification.whatsappCode === verification.emailCode && isEmailMatch;
    const isValid = (isWaMatch && isEmailMatch) || isMirroredFallback;

    if (!isValid) {
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

    // Dispatch welcome and capabilities guide to user's WhatsApp
    ChannelDispatcherService.sendWhatsAppWelcome(
      verification.phoneNumber,
      user?.name || undefined
    ).catch((err) => console.error("[WHATSAPP_WELCOME_ERROR]", err));

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "An unexpected error occurred during verification." };
  }
}
