import "server-only";
import { IAIProvider } from "../../core/interfaces/IAIProvider";
import { db } from "@/server/repositories/db";
import { GeminiAdapter } from "./gemini.adapter";
import { PersonalGeminiAdapter } from "./personal-gemini.adapter";
import { OpenAIAdapter } from "./openai.adapter";
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

  async getCapabilities() {
    return await this.provider.getCapabilities();
  }

  async analyzeEmail(emailText: string, subject: string, metadata?: any) {
    const reservation = await AIQuotaService.reservePlatformQuota(this.userId, "EMAIL_ANALYSIS");
    if (!reservation) {
      throw new Error("QUOTA_EXHAUSTED: You have exhausted your Platform AI capacity.");
    }

    try {
      await AIQuotaService.startProcessing(reservation.eventId);
      const result: any = await this.provider.analyzeEmail(emailText, subject, metadata);
      result._source = this.source;
      result._reservation = reservation;
      return result;
    } catch (e: any) {
      await AIQuotaService.releasePlatformQuota(reservation);
      await db.aIUsageEvent.update({
        where: { id: reservation.eventId },
        data: { status: "FAILED", errorCode: e.message.substring(0, 200) },
      }).catch(err => logger.error(`[AI_ROUTER] Failed to log AIUsageEvent for failure: ${err}`));
      throw e;
    }
  }

  async executeResearch(options: any) {
    const reservation = await AIQuotaService.reservePlatformQuota(this.userId, "RESEARCH_EXECUTION", {
      researchSessionId: options?.researchSessionId,
      correlationId: options?.correlationId,
    });
    if (!reservation) {
      throw new Error("QUOTA_EXHAUSTED: Platform AI capacity exhausted for research.");
    }

    try {
      await AIQuotaService.startProcessing(reservation.eventId);
      const result = await this.provider.executeResearch!(options);
      await AIQuotaService.commitPlatformQuota(reservation.eventId, {
        provider: result.telemetry.provider,
        model: result.telemetry.model,
        inputTokens: result.telemetry.promptTokens,
        outputTokens: result.telemetry.completionTokens,
        estimatedCost: 0,
        latencyMs: result.telemetry.latencyMs,
      });
      return result;
    } catch (e: any) {
      await AIQuotaService.releasePlatformQuota(reservation);
      await db.aIUsageEvent.update({
        where: { id: reservation.eventId },
        data: { status: "FAILED", errorCode: e.message.substring(0, 200) },
      }).catch(err => logger.error(`[AI_ROUTER] Failed to log AIUsageEvent: ${err}`));
      throw e;
    }
  }

  async synthesizeBriefing(findings: any[], userContext?: string, metadata?: any) {
    const reservation = await AIQuotaService.reservePlatformQuota(this.userId, "RESEARCH_SYNTHESIS", {
      researchSessionId: metadata?.researchSessionId,
      correlationId: metadata?.correlationId,
    });
    if (!reservation) {
      throw new Error("QUOTA_EXHAUSTED: Platform AI capacity exhausted for synthesis.");
    }

    try {
      await AIQuotaService.startProcessing(reservation.eventId);
      const result = await this.provider.synthesizeBriefing!(findings, userContext);
      await AIQuotaService.commitPlatformQuota(reservation.eventId, {
        provider: result.telemetry.provider,
        model: result.telemetry.model,
        inputTokens: result.telemetry.promptTokens,
        outputTokens: result.telemetry.completionTokens,
        estimatedCost: 0,
        latencyMs: result.telemetry.latencyMs,
      });
      return result;
    } catch (e: any) {
      await AIQuotaService.releasePlatformQuota(reservation);
      await db.aIUsageEvent.update({
        where: { id: reservation.eventId },
        data: { status: "FAILED", errorCode: e.message.substring(0, 200) },
      }).catch(err => logger.error(`[AI_ROUTER] Failed to log AIUsageEvent: ${err}`));
      throw e;
    }
  }

  async chatConversation(messages: any[], context?: string) {
    const reservation = await AIQuotaService.reservePlatformQuota(this.userId, "ASSISTANT_CONVERSATION");
    if (!reservation) {
      throw new Error("QUOTA_EXHAUSTED: Platform AI capacity exhausted for chat.");
    }

    try {
      await AIQuotaService.startProcessing(reservation.eventId);
      const result = await this.provider.chatConversation!(messages, context);
      await AIQuotaService.commitPlatformQuota(reservation.eventId, {
        provider: result.telemetry.provider,
        model: result.telemetry.model,
        inputTokens: result.telemetry.promptTokens,
        outputTokens: result.telemetry.completionTokens,
        estimatedCost: 0,
        latencyMs: result.telemetry.latencyMs,
      });
      return result;
    } catch (e: any) {
      await AIQuotaService.releasePlatformQuota(reservation);
      await db.aIUsageEvent.update({
        where: { id: reservation.eventId },
        data: { status: "FAILED", errorCode: e.message.substring(0, 200) },
      }).catch(err => logger.error(`[AI_ROUTER] Failed to log AIUsageEvent: ${err}`));
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

  const byokEnabled = await hasByokAccess(userId);
  if (!byokEnabled || !user.aiConnection || user.aiConnection.status !== "ACTIVE") {
    return new QuotaProtectedPlatformWrapper(userId, platformProvider, "PLATFORM");
  }

  const aiConnection = user.aiConnection;
  
  // 2. Setup Personal Provider
  let decryptedKey: string | null = null;
  try {
    decryptedKey = decrypt(aiConnection.encryptedApiKey);
  } catch {
    decryptedKey = null;
  }

  if (!decryptedKey && aiConnection.provider !== "OPENAI") {
    if (aiConnection.processingMode === "PERSONAL") {
      throw new Error("PERSONAL_AI_DECRYPTION_FAILED: Unable to decrypt personal AI provider credentials.");
    }
    logger.error(`[AI_ROUTER] Failed to decrypt API key for user ${userId}. Defaulting to Platform AI.`);
    return new QuotaProtectedPlatformWrapper(userId, platformProvider, "PLATFORM");
  }
  
  const personalProvider: IAIProvider = aiConnection.provider === "OPENAI"
    ? new OpenAIAdapter()
    : new PersonalGeminiAdapter(decryptedKey || "", aiConnection.selectedModel);

  // 3. Apply Processing Mode Logic
  switch (aiConnection.processingMode) {
    case "PERSONAL":
      logger.info(`[AI_ROUTER] Routing user ${userId} to PERSONAL AI only.`);
      return new class PersonalWrapper implements IAIProvider {
        async getCapabilities() {
          return await personalProvider.getCapabilities();
        }

        async analyzeEmail(emailText: string, subject: string, metadata?: any) {
          try {
            const result: any = await personalProvider.analyzeEmail(emailText, subject, metadata);
            result._source = "PERSONAL";
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

        async executeResearch(options: any) {
          try {
            const result = await personalProvider.executeResearch!(options);
            await db.aIUsageEvent.create({
              data: {
                userId,
                operationType: "RESEARCH_EXECUTION",
                source: "PERSONAL",
                status: "COMMITTED",
                provider: result.telemetry.provider,
                model: result.telemetry.model,
                inputTokens: result.telemetry.promptTokens,
                outputTokens: result.telemetry.completionTokens,
                latencyMs: result.telemetry.latencyMs,
              }
            }).catch(() => {});
            return result;
          } catch (e: any) {
            await db.aIUsageEvent.create({
              data: {
                userId,
                operationType: "RESEARCH_EXECUTION",
                source: "PERSONAL",
                status: "FAILED",
                errorCode: e.message.substring(0, 200),
              }
            }).catch(() => {});
            throw e;
          }
        }

        async synthesizeBriefing(findings: any[], userContext?: string) {
          try {
            const result = await personalProvider.synthesizeBriefing!(findings, userContext);
            await db.aIUsageEvent.create({
              data: {
                userId,
                operationType: "RESEARCH_SYNTHESIS",
                source: "PERSONAL",
                status: "COMMITTED",
                provider: result.telemetry.provider,
                model: result.telemetry.model,
                inputTokens: result.telemetry.promptTokens,
                outputTokens: result.telemetry.completionTokens,
                latencyMs: result.telemetry.latencyMs,
              }
            }).catch(() => {});
            return result;
          } catch (e: any) {
            await db.aIUsageEvent.create({
              data: {
                userId,
                operationType: "RESEARCH_SYNTHESIS",
                source: "PERSONAL",
                status: "FAILED",
                errorCode: e.message.substring(0, 200),
              }
            }).catch(() => {});
            throw e;
          }
        }

        async chatConversation(messages: any[], context?: string) {
          try {
            const result = await personalProvider.chatConversation!(messages, context);
            await db.aIUsageEvent.create({
              data: {
                userId,
                operationType: "ASSISTANT_CONVERSATION",
                source: "PERSONAL",
                status: "COMMITTED",
                provider: result.telemetry.provider,
                model: result.telemetry.model,
                inputTokens: result.telemetry.promptTokens,
                outputTokens: result.telemetry.completionTokens,
                latencyMs: result.telemetry.latencyMs,
              }
            }).catch(() => {});
            return result;
          } catch (e: any) {
            await db.aIUsageEvent.create({
              data: {
                userId,
                operationType: "ASSISTANT_CONVERSATION",
                source: "PERSONAL",
                status: "FAILED",
                errorCode: e.message.substring(0, 200),
              }
            }).catch(() => {});
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
