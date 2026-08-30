import "server-only";
import { IAIProvider } from "../../core/interfaces/IAIProvider";
import { db } from "@/server/repositories/db";
import { GeminiAdapter } from "./gemini.adapter";
import { PersonalGeminiAdapter } from "./personal-gemini.adapter";
import { HybridAIProvider } from "./hybrid-ai.provider";
import { hasByokAccess } from "@/lib/byok";
import { decrypt } from "../security/encryption";
import { logger } from "@/lib/logger";
import { AIQuotaService } from "./quota.service";

/**
 * Wraps an AI provider with atomic quota reservation logic.
 */
class QuotaProtectedPlatformWrapper implements IAIProvider {
  constructor(private userId: string, private provider: IAIProvider, private source: "PLATFORM" | "PLATFORM_FALLBACK") {}

  async analyzeEmail(emailText: string, subject: string, metadata?: any) {
    const reservation = await AIQuotaService.reservePlatformQuota(this.userId, "EMAIL_ANALYSIS");
    if (!reservation) {
      throw new Error("QUOTA_EXHAUSTED: You have exhausted your Platform AI capacity.");
    }

    try {
      // 1. Extend the lease before the long-running AI API call to avoid race conditions
      await AIQuotaService.startProcessing(reservation.eventId);

      // 2. Perform the actual AI call
      const result: any = await this.provider.analyzeEmail(emailText, subject, metadata);
      result._source = this.source;
      result._reservation = reservation; // Pass reservation up to be committed
      return result;
    } catch (e: any) {
      // If the AI call fails, release the reservation atomically
      await AIQuotaService.releasePlatformQuota(reservation);
      
      // Update the event to FAILED
      await db.aIUsageEvent.update({
        where: { id: reservation.eventId },
        data: {
          status: "FAILED",
          errorCode: e.message.substring(0, 200),
        }
      }).catch(err => logger.error(`[AI_ROUTER] Failed to log AIUsageEvent for failure: ${err}`));

      throw e;
    }
  }
}

/**
 * Resolves the appropriate AI provider for a specific user.
 * Evaluates BYOK entitlement, processing mode preferences, and fallback logic.
 */
export async function resolveAIProvider(userId: string): Promise<IAIProvider> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { aiConnection: true }
  });

  const platformProvider = new GeminiAdapter();

  if (!user) {
    logger.warn(`[AI_ROUTER] User ${userId} not found. Defaulting to Platform AI.`);
    return new QuotaProtectedPlatformWrapper(userId, platformProvider, "PLATFORM");
  }

  // 1. Check if user has BYOK active
  if (!hasByokAccess(user) || !user.aiConnection || user.aiConnection.status !== "ACTIVE") {
    return new QuotaProtectedPlatformWrapper(userId, platformProvider, "PLATFORM");
  }

  const aiConnection = user.aiConnection;
  
  // 2. Setup Personal Provider
  const decryptedKey = decrypt(aiConnection.encryptedApiKey);
  if (!decryptedKey) {
    logger.error(`[AI_ROUTER] Failed to decrypt API key for user ${userId}. Defaulting to Platform AI.`);
    return new QuotaProtectedPlatformWrapper(userId, platformProvider, "PLATFORM");
  }
  
  const personalProvider = new PersonalGeminiAdapter(decryptedKey, aiConnection.selectedModel);

  // 3. Apply Processing Mode Logic
  switch (aiConnection.processingMode) {
    case "PERSONAL":
      logger.info(`[AI_ROUTER] Routing user ${userId} to PERSONAL AI only.`);
      return new class PersonalWrapper implements IAIProvider {
        async analyzeEmail(emailText: string, subject: string, metadata?: any) {
          try {
            const result: any = await personalProvider.analyzeEmail(emailText, subject, metadata);
            result._source = "PERSONAL";
            // Async update stats
            db.userAIConnection.update({
              where: { id: aiConnection.id },
              data: { personalRequestCount: { increment: 1 } }
            }).catch(err => logger.error(`[AI_ROUTER] Failed to update stats: ${err}`));
            return result;
          } catch (e: any) {
            await db.aIUsageEvent.create({
              data: {
                userId,
                operationType: "EMAIL_ANALYSIS",
                source: "PERSONAL",
                status: "FAILED",
                errorCode: e.message.substring(0, 200),
              }
            }).catch(err => logger.error(`[AI_ROUTER] Failed to log AIUsageEvent for failure: ${err}`));
            throw e;
          }
        }
      };
      
    case "HYBRID":
      logger.info(`[AI_ROUTER] Routing user ${userId} to HYBRID AI (Fallback: ${aiConnection.allowPlatformFallback}).`);
      
      // If fallback is allowed, wrap the platform provider in a quota-protected wrapper.
      // This ensures quota is only reserved if and when the personal provider fails and the fallback is invoked.
      const fallbackProvider = aiConnection.allowPlatformFallback 
        ? new QuotaProtectedPlatformWrapper(userId, platformProvider, "PLATFORM_FALLBACK")
        : platformProvider;

      return new HybridAIProvider(
        personalProvider,
        fallbackProvider,
        aiConnection.allowPlatformFallback,
        async () => {
          await db.userAIConnection.update({
            where: { id: aiConnection.id },
            data: { fallbackRequestCount: { increment: 1 } }
          });
        }
      );
      
    case "PLATFORM":
    default:
      logger.info(`[AI_ROUTER] Routing user ${userId} to PLATFORM AI only.`);
      return new QuotaProtectedPlatformWrapper(userId, platformProvider, "PLATFORM");
  }
}
