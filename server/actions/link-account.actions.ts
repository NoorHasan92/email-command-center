"use server";

import { auth } from "@/config/auth";
import { db } from "../repositories/db";
import crypto from "crypto";
import { sendLinkAccountCodeEmail, sendLinkAccountActivationEmail } from "@/services/emails/resend";
import { getBaseUrl } from "@/lib/utils";

/**
 * Generates a random alphanumeric code of given length.
 */
function generateCode(length: number = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude similar looking characters
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function initiateAccountLinkAction(targetEmail: string) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return { error: "Unauthorized" };
    }
    
    // Convert to lowercase for checking
    const normalizedTarget = targetEmail.toLowerCase().trim();

    if (normalizedTarget === session.user.email.toLowerCase()) {
      return { error: "You cannot link your primary email as a secondary account." };
    }

    // Check if the target email is already connected as an EmailAccount globally
    const existingAccount = await db.emailAccount.findFirst({
      where: { emailAddress: normalizedTarget }
    });

    if (existingAccount) {
      return { error: "This Gmail account is already connected to an Inbox Sentinel user." };
    }

    const primaryCode = generateCode(6);
    const secondaryCode = generateCode(6);
    const linkToken = crypto.randomBytes(32).toString("hex");

    const request = await db.accountLinkRequest.create({
      data: {
        userId: session.user.id,
        targetEmail: normalizedTarget,
        primaryCode,
        secondaryCode,
        linkToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        status: "PENDING_CODES"
      }
    });

    // Send email to primary account
    await sendLinkAccountCodeEmail(session.user.email, primaryCode, true);

    // Send email to secondary account
    await sendLinkAccountCodeEmail(normalizedTarget, secondaryCode, false);

    return { success: true, requestId: request.id };
  } catch (error: any) {
    console.error("[initiateAccountLinkAction] error:", error);
    return { error: "Failed to initiate linking. Please try again." };
  }
}

export async function verifyLinkCodesAction(requestId: string, primaryCode: string, secondaryCode: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const request = await db.accountLinkRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      return { error: "Request not found." };
    }

    if (request.userId !== session.user.id) {
      return { error: "Unauthorized access to this request." };
    }

    if (request.status !== "PENDING_CODES") {
      return { error: "This request has already been processed or expired." };
    }

    if (new Date() > request.expiresAt) {
      await db.accountLinkRequest.update({
        where: { id: requestId },
        data: { status: "EXPIRED" }
      });
      return { error: "Verification codes have expired. Please start over." };
    }

    if (request.primaryCode !== primaryCode.toUpperCase().trim() || request.secondaryCode !== secondaryCode.toUpperCase().trim()) {
      return { error: "Invalid verification codes. Please double check." };
    }

    // Success! Update status to PENDING_OAUTH
    await db.accountLinkRequest.update({
      where: { id: requestId },
      data: { status: "PENDING_OAUTH" }
    });

    // Send the final OAuth activation link
    const linkUrl = `${getBaseUrl()}/api/integrations/gmail/link?token=${request.linkToken}`;
    
    await sendLinkAccountActivationEmail(request.targetEmail, linkUrl);

    return { success: true };
  } catch (error: any) {
    console.error("[verifyLinkCodesAction] error:", error);
    return { error: "Failed to verify codes." };
  }
}
