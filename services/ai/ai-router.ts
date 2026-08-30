import "server-only";
import { IAIProvider } from "../../core/interfaces/IAIProvider";
import { db } from "@/server/repositories/db";
import { GeminiAdapter } from "./gemini.adapter";
import { PersonalGeminiAdapter } from "./personal-gemini.adapter";
import { HybridAIProvider } from "./hybrid-ai.provider";
import { hasByokAccess } from "@/lib/byok";
import { decrypt } from "../security/encryption";
import { logger } from "@/lib/logger";

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
    return platformProvider;
  }

  // 1. Check if user has BYOK active
  if (!hasByokAccess(user) || !user.aiConnection || user.aiConnection.status !== "ACTIVE") {
    // Wrap to ensure _source metric is logged
    return new class PlatformWrapper implements IAIProvider {
      async analyzeEmail(emailText: string, subject: string, metadata?: any) {
        const result: any = await platformProvider.analyzeEmail(emailText, subject, metadata);
        result._source = "PLATFORM";
        return result;
      }
    };
  }

  const aiConnection = user.aiConnection;
  
  // 2. Setup Personal Provider
  const decryptedKey = decrypt(aiConnection.encryptedApiKey);
  if (!decryptedKey) {
    logger.error(`[AI_ROUTER] Failed to decrypt API key for user ${userId}. Defaulting to Platform AI.`);
    return platformProvider;
  }
  
  const personalProvider = new PersonalGeminiAdapter(decryptedKey, aiConnection.selectedModel);

  // 3. Apply Processing Mode Logic
  switch (aiConnection.processingMode) {
    case "PERSONAL":
      logger.info(`[AI_ROUTER] Routing user ${userId} to PERSONAL AI only.`);
      return new class PersonalWrapper implements IAIProvider {
        async analyzeEmail(emailText: string, subject: string, metadata?: any) {
          const result: any = await personalProvider.analyzeEmail(emailText, subject, metadata);
          // Async update stats
          db.userAIConnection.update({
            where: { id: aiConnection.id },
            data: { personalRequestCount: { increment: 1 } }
          }).catch(err => logger.error(`[AI_ROUTER] Failed to update stats: ${err}`));
          return result;
        }
      };
      
    case "HYBRID":
      logger.info(`[AI_ROUTER] Routing user ${userId} to HYBRID AI (Fallback: ${aiConnection.allowPlatformFallback}).`);
      return new HybridAIProvider(
        personalProvider,
        platformProvider,
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
      return new class PlatformWrapper implements IAIProvider {
        async analyzeEmail(emailText: string, subject: string, metadata?: any) {
          const result: any = await platformProvider.analyzeEmail(emailText, subject, metadata);
          result._source = "PLATFORM";
          return result;
        }
      };
  }
}
