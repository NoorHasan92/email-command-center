"use server";

import { db } from "@/server/repositories/db";
import { auth } from "@/config/auth";
import { revalidatePath } from "next/cache";

export async function simulateGmailConnection() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Simulate a delay for OAuth and initial sync
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Create a mock EmailAccount to pass the guard
  await db.emailAccount.create({
    data: {
      userId: session.user.id,
      provider: "gmail",
      providerAccountId: `mock-gmail-${Date.now()}`,
      emailAddress: session.user.email || "user@gmail.com",
      accessToken: "mock-access-token",
      syncStatus: "ACTIVE",
      totalEmailsSynced: 145,
      lastSyncCompletedAt: new Date(),
    }
  });

  revalidatePath("/");
  return { success: true };
}
