"use server";

import { db } from "@/server/repositories/db";
import { auth } from "@/config/auth";
import { logSecurityEvent } from "@/services/security/audit";

export async function toggleWhatsAppAction(phoneNumber: string | null) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    if (phoneNumber) {
      // Connect
      await db.user.update({
        where: { id: session.user.id },
        data: { 
          whatsappOptIn: true,
          phoneNumber: phoneNumber 
        }
      });
      await logSecurityEvent("PROFILE_UPDATED", session.user.id, { note: "WhatsApp connected" });
    } else {
      // Disconnect
      await db.user.update({
        where: { id: session.user.id },
        data: { 
          whatsappOptIn: false,
          phoneNumber: null 
        }
      });
      await logSecurityEvent("PROFILE_UPDATED", session.user.id, { note: "WhatsApp disconnected" });
    }

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to update WhatsApp integration" };
  }
}

export async function disconnectGmailAction(accountId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    // Simply delete the EmailAccount record. This will cascade delete emails.
    await db.emailAccount.delete({
      where: {
        id: accountId,
        userId: session.user.id // ensure they own it
      }
    });

    await logSecurityEvent("PROFILE_UPDATED", session.user.id, { note: "Gmail disconnected" });
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to disconnect Gmail" };
  }
}

export async function disconnectTelegramAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const user = await db.user.findUnique({ where: { id: session.user.id } });
    const existing = Array.isArray(user?.notifyChannels) ? user.notifyChannels as string[] : [];

    await db.user.update({
      where: { id: session.user.id },
      data: {
        telegramOptIn: false,
        telegramChatId: null,
        telegramUsername: null,
        telegramLinkToken: null,
        notifyChannels: existing.filter(c => c !== "TELEGRAM"),
      }
    });

    await logSecurityEvent("PROFILE_UPDATED", session.user.id, { note: "Telegram disconnected" });
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to disconnect Telegram" };
  }
}

export async function updateNotifyChannelsAction(channels: string[]) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    // Validate channels — only allow known values
    const validChannels = ["WHATSAPP", "TELEGRAM", "EMAIL"];
    const filtered = channels.filter(c => validChannels.includes(c));

    await db.user.update({
      where: { id: session.user.id },
      data: { notifyChannels: filtered }
    });

    await logSecurityEvent("PROFILE_UPDATED", session.user.id, { note: `Notify channels updated: ${filtered.join(", ")}` });
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to update notification channels" };
  }
}
