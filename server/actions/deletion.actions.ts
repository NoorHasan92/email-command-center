"use server";

import { db } from "@/server/repositories/db";
import { auth } from "@/config/auth";
import { randomBytes, createHash } from "crypto";
import { sendAccountDeletionConfirmationEmail, sendAccountDeletionScheduledEmail, sendAccountDeletionCancelledEmail } from "@/services/transactional-email/email.service";

export async function requestAccountDeletionAction({ reason, feedback }: { reason?: string; feedback?: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;

    // Check if already requested
    const existing = await db.accountDeletionRequest.findUnique({
      where: { userId },
    });

    if (existing && existing.status !== "CANCELLED" && existing.status !== "EXPIRED") {
      return { success: false, error: "Deletion request already exists" };
    }

    // Generate secure token
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create or update request
    await db.accountDeletionRequest.upsert({
      where: { userId },
      update: {
        status: "CONFIRMATION_PENDING",
        reason,
        feedback,
        confirmationTokenHash: tokenHash,
        confirmationExpiresAt: expiresAt,
        requestedAt: new Date(),
      },
      create: {
        userId,
        status: "CONFIRMATION_PENDING",
        reason,
        feedback,
        confirmationTokenHash: tokenHash,
        confirmationExpiresAt: expiresAt,
        requestedAt: new Date(),
      },
    });

    // Send confirmation email
    await sendAccountDeletionConfirmationEmail(userId, token);

    return { success: true };
  } catch (error: any) {
    console.error("Failed to request account deletion:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function confirmAccountDeletionAction(token: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;
    const tokenHash = createHash("sha256").update(token).digest("hex");

    const request = await db.accountDeletionRequest.findUnique({
      where: { userId },
    });

    if (!request) {
      return { success: false, error: "No deletion request found" };
    }

    if (request.status !== "CONFIRMATION_PENDING") {
      return { success: false, error: "Request is not pending confirmation" };
    }

    if (request.confirmationTokenHash !== tokenHash || request.confirmationExpiresAt < new Date()) {
      return { success: false, error: "Token is invalid or expired" };
    }

    // 14 day grace period
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 14);

    // Update status to SCHEDULED
    await db.$transaction(async (tx) => {
      await tx.accountDeletionRequest.update({
        where: { id: request.id },
        data: {
          status: "SCHEDULED",
          confirmedAt: new Date(),
          scheduledDeletionAt: scheduledDate,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { accountStatus: "DELETION_SCHEDULED" },
      });
    });

    // Send Scheduled Email
    await sendAccountDeletionScheduledEmail(userId, scheduledDate);

    return { success: true };
  } catch (error: any) {
    console.error("Failed to confirm account deletion:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function cancelAccountDeletionAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "User not found" };

    const request = await db.accountDeletionRequest.findUnique({
      where: { userId },
    });

    if (!request || (request.status !== "SCHEDULED" && request.status !== "CONFIRMATION_PENDING")) {
      return { success: false, error: "No active deletion request found" };
    }

    // Cancel deletion
    await db.$transaction(async (tx) => {
      await tx.accountDeletionRequest.update({
        where: { id: request.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { accountStatus: "ACTIVE" },
      });
    });

    // Send Cancellation Email
    await sendAccountDeletionCancelledEmail(userId, user.email, user.name);

    return { success: true };
  } catch (error: any) {
    console.error("Failed to cancel account deletion:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
