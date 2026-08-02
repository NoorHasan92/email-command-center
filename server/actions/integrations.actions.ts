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
