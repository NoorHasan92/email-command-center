"use server";

import { db } from "@/server/repositories/db";
import { auth } from "@/config/auth";
import { NotificationChannel } from "@prisma/client";

export async function getRulesAction() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const rules = await db.notificationRule.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });
    return { rules };
  } catch (error) {
    console.error(error);
    return { error: "Failed to fetch rules" };
  }
}

export async function createRuleAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const minScoreThreshold = parseInt(formData.get("minScoreThreshold")?.toString() || "80", 10);
    const channel = formData.get("channel")?.toString() as NotificationChannel || "WHATSAPP";
    const appliedAccountsRaw = formData.get("appliedAccounts")?.toString();
    const appliedAccounts = appliedAccountsRaw ? JSON.parse(appliedAccountsRaw) : [];

    await db.notificationRule.create({
      data: {
        userId: session.user.id,
        minScoreThreshold,
        channel,
        appliedAccounts
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to create rule" };
  }
}

export async function updateRuleAction(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const minScoreThreshold = parseInt(formData.get("minScoreThreshold")?.toString() || "80", 10);
    const channel = formData.get("channel")?.toString() as NotificationChannel;
    const appliedAccountsRaw = formData.get("appliedAccounts")?.toString();
    const appliedAccounts = appliedAccountsRaw ? JSON.parse(appliedAccountsRaw) : [];
    
    const rule = await db.notificationRule.findUnique({ where: { id } });
    if (!rule || rule.userId !== session.user.id) return { error: "Not found or unauthorized" };

    await db.notificationRule.update({
      where: { id },
      data: {
        minScoreThreshold,
        channel,
        appliedAccounts
      }
    });

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to update rule" };
  }
}

export async function toggleRuleAction(id: string, isActive: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const rule = await db.notificationRule.findUnique({ where: { id } });
    if (!rule || rule.userId !== session.user.id) return { error: "Not found or unauthorized" };

    await db.notificationRule.update({
      where: { id },
      data: { isActive }
    });

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to toggle rule" };
  }
}

export async function deleteRuleAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const rule = await db.notificationRule.findUnique({ where: { id } });
    if (!rule || rule.userId !== session.user.id) return { error: "Not found or unauthorized" };

    await db.notificationRule.delete({ where: { id } });

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to delete rule" };
  }
}
