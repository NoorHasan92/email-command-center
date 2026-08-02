"use server";

import { db } from "@/server/repositories/db";
import { auth } from "@/config/auth";
import { EmailStatus } from "@prisma/client";

export async function markEmailReviewedAction(emailId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const email = await db.email.findUnique({
      where: { id: emailId },
      include: { emailAccount: true }
    });

    if (!email || email.emailAccount.userId !== session.user.id) {
      return { error: "Not found or unauthorized" };
    }

    await db.email.update({
      where: { id: emailId },
      data: { status: EmailStatus.NOTIFIED }
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to mark email as reviewed:", error);
    return { error: "Failed to mark email as reviewed" };
  }
}
