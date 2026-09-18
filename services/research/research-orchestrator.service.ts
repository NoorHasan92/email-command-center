import "server-only";
import { db } from "@/server/repositories/db";
import { logger } from "@/lib/logger";
import { resolveAIProvider } from "../ai/ai-router";
import { ResearchQuotaService } from "./research-quota.service";
import { DistributedRateLimiter } from "../security/rate-limiter.service";
import { PLAN_RESEARCH_LIMITS } from "@/config/plans";

export class ResearchOrchestratorService {
  /**
   * Orchestrates research initiation in strict accordance with the required order:
   * 1. Authenticate / User check
   * 2. Entitlement verification
   * 3. AI provider resolution
   * 4. Capability inspection (must support webSearch)
   * 5. Validation
   * 6. Create ResearchSession (PENDING)
   * 7. Atomically reserve product quota
   * 8. Trigger background execution
   */
  static async initiateResearch(params: {
    userId: string;
    query: string;
    context?: string;
    conversationId?: string;
    emailId?: string;
  }) {
    const { userId, query, context, conversationId, emailId } = params;

    // 1. Authenticate & fetch user
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, plan: true },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND: User does not exist.");
    }

    // 2. Entitlement Check
    const planLimit = PLAN_RESEARCH_LIMITS[user.plan] || 0;
    if (planLimit <= 0) {
      throw new Error(
        "ENTITLEMENT_REQUIRED: Deep Research is an exclusive feature of the Ultra plan. Please upgrade to access autonomous evidence-based investigation."
      );
    }

    // 3. Resolve AI Provider
    const provider = await resolveAIProvider(userId);

    // 4. Inspect Provider Capabilities
    const caps = await provider.getCapabilities();
    if (caps.webSearch !== "SUPPORTED") {
      throw new Error(
        "CAPABILITY_UNAVAILABLE: Your configured AI provider does not support web search grounding. Please switch to a supported Gemini model or Platform AI in Settings."
      );
    }

    // 5. Validate query
    const cleanedQuery = query.trim();
    if (cleanedQuery.length < 5) {
      throw new Error("INVALID_QUERY: Research query must be at least 5 characters long.");
    }

    // Rate Limiting Check
    const rateLimitOk = await DistributedRateLimiter.limitResearchRequest(userId);
    if (!rateLimitOk) {
      throw new Error("RATE_LIMITED: You have submitted too many research requests recently. Please wait a few minutes.");
    }

    // 6. Create ResearchSession in PENDING state
    const session = await db.researchSession.create({
      data: {
        userId,
        conversationId,
        emailId,
        query: cleanedQuery,
        context,
        status: "PENDING",
      },
    });

    // 7. Atomically reserve research quota
    const reservation = await ResearchQuotaService.reserveQuota(userId, session.id);
    if (!reservation) {
      await db.researchSession.update({
        where: { id: session.id },
        data: {
          status: "FAILED",
          error: "Monthly research quota exhausted.",
        },
      });
      throw new Error("QUOTA_EXHAUSTED: You have used all available deep research inquiries for this billing period.");
    }

    logger.info(`[RESEARCH_ORCHESTRATOR] Successfully initiated ResearchSession ${session.id} for user ${userId}`);

    return {
      sessionId: session.id,
      status: "PENDING",
      message: "Deep research investigation initiated. An executive evidence-based briefing will be delivered upon completion.",
    };
  }
}
