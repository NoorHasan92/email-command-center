"use server";

import { auth } from "@/config/auth";
import { db } from "@/server/repositories/db";
import { hasByokAccess } from "@/lib/byok";
import { encrypt } from "@/services/security/encryption";
import { GoogleGenAI } from "@google/genai";
import { AIProcessingMode, AIConnectionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

/**
 * Validates and stores a new Gemini API Key for BYOK
 */
export async function connectAIKeyAction(apiKey: string, model: string = "gemini-2.5-flash") {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { byokEnabled: true, plan: true }
    });

    if (!user || !hasByokAccess(user)) {
      return { error: "BYOK add-on is not enabled for this account." };
    }

    if (!apiKey || !apiKey.trim().startsWith("AIza")) {
      return { error: "Invalid API key format. Gemini API keys usually start with 'AIza'." };
    }

    const trimmedKey = apiKey.trim();

    // Verification step
    try {
      const ai = new GoogleGenAI({ apiKey: trimmedKey });
      // Lightweight verification request (doesn't consume generation tokens usually)
      await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Respond with the word OK."
      });
    } catch (verifyError: any) {
      logger.warn(`[BYOK] Verification failed for user ${session.user.id}: ${verifyError.message}`);
      const status = verifyError.status || verifyError.response?.status;
      
      if (status === 400) return { error: "Invalid API key or request format." };
      if (status === 401 || status === 403) return { error: "API key is unauthorized, revoked, or lacks billing." };
      if (status === 429) return { error: "This API key has exhausted its quota or is rate limited." };
      
      return { error: "Failed to verify API key with Google. Ensure the key is active." };
    }

    const encryptedApiKey = encrypt(trimmedKey);
    if (!encryptedApiKey) {
      return { error: "Internal encryption error" };
    }

    const keyLastFour = trimmedKey.slice(-4);

    await db.userAIConnection.upsert({
      where: { userId: session.user.id },
      update: {
        encryptedApiKey,
        keyLastFour,
        status: "ACTIVE" as AIConnectionStatus,
        lastVerifiedAt: new Date(),
        selectedModel: model,
      },
      create: {
        userId: session.user.id,
        encryptedApiKey,
        keyLastFour,
        status: "ACTIVE" as AIConnectionStatus,
        selectedModel: model,
        processingMode: "HYBRID" as AIProcessingMode,
        allowPlatformFallback: true,
        lastVerifiedAt: new Date(),
      }
    });

    const { AIQuotaService } = await import("@/services/ai/quota.service");
    await AIQuotaService.recoverPendingEmails(session.user.id);

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    logger.error(`[BYOK] Connection error: ${error.message}`);
    return { error: "An unexpected error occurred while saving the key." };
  }
}

export async function disconnectAIKeyAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    await db.userAIConnection.delete({
      where: { userId: session.user.id }
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2025') {
      return { success: true }; // Already deleted/doesn't exist
    }
    return { error: "Failed to disconnect AI key." };
  }
}

export async function verifyAIKeyAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const connection = await db.userAIConnection.findUnique({
      where: { userId: session.user.id }
    });

    if (!connection) {
      return { error: "No AI key connected." };
    }

    const { decrypt } = await import("@/services/security/encryption");
    const decryptedKey = decrypt(connection.encryptedApiKey);
    
    if (!decryptedKey) {
      return { error: "Failed to decrypt stored API key." };
    }

    try {
      const ai = new GoogleGenAI({ apiKey: decryptedKey });
      await ai.models.generateContent({
        model: connection.selectedModel || "gemini-2.5-flash",
        contents: "Respond with the word OK."
      });
      
      // Update last verified at
      await db.userAIConnection.update({
        where: { id: connection.id },
        data: { 
          status: "ACTIVE" as AIConnectionStatus,
          lastVerifiedAt: new Date(),
          lastErrorCode: null
        }
      });
      
      revalidatePath("/settings");
      return { success: true };
    } catch (verifyError: any) {
      logger.warn(`[BYOK] Re-verification failed for user ${session.user.id}: ${verifyError.message}`);
      const status = verifyError.status || verifyError.response?.status;
      
      let newStatus: AIConnectionStatus = "INVALID";
      let errorMsg = "Failed to verify API key with Google.";
      
      if (status === 400) {
        errorMsg = "Invalid API key or request format.";
        newStatus = "INVALID";
      } else if (status === 401 || status === 403) {
        errorMsg = "API key is unauthorized, revoked, or lacks billing.";
        newStatus = "REVOKED";
      } else if (status === 429) {
        errorMsg = "This API key has exhausted its quota or is rate limited.";
        newStatus = "ACTIVE"; // Don't mark invalid just for rate limiting
      }
      
      await db.userAIConnection.update({
        where: { id: connection.id },
        data: { 
          status: newStatus,
          lastErrorCode: status ? String(status) : null
        }
      });
      
      revalidatePath("/settings");
      return { error: errorMsg };
    }
  } catch (error: any) {
    logger.error(`[BYOK] Verification action error: ${error.message}`);
    return { error: "An unexpected error occurred during verification." };
  }
}


export async function updateAIProcessingModeAction(
  processingMode: AIProcessingMode, 
  allowPlatformFallback: boolean
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const connection = await db.userAIConnection.findUnique({
      where: { userId: session.user.id }
    });

    if (!connection) return { error: "No connection found" };

    await db.userAIConnection.update({
      where: { id: connection.id },
      data: { processingMode, allowPlatformFallback }
    });
    
    const { AIQuotaService } = await import("@/services/ai/quota.service");
    await AIQuotaService.recoverPendingEmails(session.user.id);

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    return { error: "Failed to update AI processing mode." };
  }
}

export async function getAIConnectionStatusAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const connection = await db.userAIConnection.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        provider: true,
        keyLastFour: true,
        status: true,
        selectedModel: true,
        processingMode: true,
        allowPlatformFallback: true,
        lastVerifiedAt: true,
        personalRequestCount: true,
        fallbackRequestCount: true,
      }
    });

    return { success: true, connection };
  } catch (error: any) {
    return { error: "Failed to retrieve connection status." };
  }
}
