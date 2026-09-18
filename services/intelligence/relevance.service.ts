import "server-only";
import { db } from "@/server/repositories/db";
import { logger } from "@/lib/logger";
import { PersonalProfileService } from "./profile.service";
import { resolveAIProvider } from "../ai/ai-router";

export interface PersonalRelevanceResult {
  personalRelevanceScore: number;
  personalRelevanceReason: string;
  personalRelevanceCategory: "STRATEGIC" | "ACTION_REQUIRED" | "FYI" | "IRRELEVANT";
  suggestedProfileObservations?: Array<{
    category: "ROLE_GOALS" | "KEY_RELATIONSHIPS" | "PROJECTS_PRIORITIES" | "COMMUNICATION_PREFERENCES" | "INTERESTS_DOMAINS";
    key: string;
    value: string;
    confidence: number;
  }>;
}

export class PersonalRelevanceService {
  /**
   * Evaluates personal relevance of an email for a user with strict failure isolation.
   * Gated by:
   * 1. ULTRA plan entitlement
   * 2. Active PersonalProfile existence
   * 3. Importance threshold (HIGH/CRITICAL priority or requiresAction)
   */
  static async evaluateEmailRelevance(
    userId: string,
    emailId: string,
    emailSubject: string,
    emailSender: string,
    analysis: {
      priority: string;
      requiresAction: boolean;
      summary: string;
      actionItems?: any;
    }
  ): Promise<PersonalRelevanceResult | null> {
    try {
      // 1. Entitlement Gate: ULTRA plan or ADMIN
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { plan: true },
      });

      if (user?.plan !== "ULTRA" && user?.plan !== "ADMIN") {
        return null; // Not entitled
      }

      // 2. Profile Existence Gate: Must have active profile data
      const profileContext = await PersonalProfileService.buildActiveProfileContext(userId);
      if (!profileContext) {
        return null; // No profile configured yet
      }

      // 3. Importance Gate: Only enrich high-signal emails
      const isHighSignal =
        analysis.priority === "HIGH" ||
        analysis.priority === "CRITICAL" ||
        analysis.requiresAction;

      if (!isHighSignal) {
        return null; // Standard low-signal emails do not need relevance enrichment
      }

      logger.info(`[PERSONAL_RELEVANCE] Evaluating relevance for email ${emailId} (User: ${userId})...`);

      // 4. Resolve AI provider for user
      const provider = await resolveAIProvider(userId);

      const prompt = `You are an elite executive intelligence screener.
Given the recipient's personal profile and an incoming email analysis, evaluate its personal relevance to their immediate priorities.

=== USER PROFILE ===
${profileContext}

=== EMAIL DETAILS ===
Sender: ${emailSender}
Subject: ${emailSubject}
Summary: ${analysis.summary}
Requires Action: ${analysis.requiresAction ? "YES" : "NO"}

Evaluate:
1. Personal Relevance Score (0 to 100): How directly does this email impact the user's specific priorities, key relationships, or active projects?
2. Personal Relevance Category: STRATEGIC, ACTION_REQUIRED, FYI, or IRRELEVANT.
3. Brief Reason (max 2 concise sentences): Explain WHY this matters to the user specifically.
4. (Optional) Any new profile insights to propose for user review.

Format your response as a JSON object:
{
  "personalRelevanceScore": <0-100>,
  "personalRelevanceCategory": "STRATEGIC" | "ACTION_REQUIRED" | "FYI" | "IRRELEVANT",
  "personalRelevanceReason": "...",
  "suggestedProfileObservations": [
    { "category": "PROJECTS_PRIORITIES", "key": "...", "value": "...", "confidence": 0.8 }
  ]
}`;

      const aiResponse = await provider.chatConversation?.(
        [{ role: "USER", content: prompt }],
        "Personal Relevance Scoring"
      );

      if (!aiResponse?.reply) {
        return null;
      }

      // Parse response JSON safely
      let parsed: any;
      try {
        const jsonMatch = aiResponse.reply.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse.reply);
      } catch {
        logger.warn(`[PERSONAL_RELEVANCE] Failed to parse AI JSON reply for email ${emailId}`);
        return null;
      }

      const score = typeof parsed.personalRelevanceScore === "number" ? Math.min(100, Math.max(0, parsed.personalRelevanceScore)) : 50;
      const category = ["STRATEGIC", "ACTION_REQUIRED", "FYI", "IRRELEVANT"].includes(parsed.personalRelevanceCategory)
        ? parsed.personalRelevanceCategory
        : "FYI";
      const reason = parsed.personalRelevanceReason || "Relevant to your current workflow.";

      // Update EmailAnalysis with relevance scores
      await db.emailAnalysis.updateMany({
        where: { emailId },
        data: {
          personalRelevanceScore: score,
          personalRelevanceReason: reason,
          personalRelevanceCategory: category,
        },
      });

      // Stage any new AI-inferred profile items into PENDING_APPROVAL
      if (Array.isArray(parsed.suggestedProfileObservations)) {
        for (const obs of parsed.suggestedProfileObservations) {
          if (obs.category && obs.key && obs.value) {
            await PersonalProfileService.addAIInferredItem(
              userId,
              obs.category,
              obs.key,
              obs.value,
              obs.confidence || 0.8,
              `email:${emailId}`
            ).catch((err) => logger.warn(`[PERSONAL_RELEVANCE] Failed to stage inferred item: ${err.message}`));
          }
        }
      }

      return {
        personalRelevanceScore: score,
        personalRelevanceReason: reason,
        personalRelevanceCategory: category,
        suggestedProfileObservations: parsed.suggestedProfileObservations,
      };
    } catch (error: any) {
      // FAILURE ISOLATION: Never let personal relevance error crash email processing
      const correlationId = `relevance:${emailId}:${Date.now()}`;
      const isRetryable = error.status >= 500 || error.code === "ETIMEDOUT" || error.message?.includes("timeout");
      
      logger.error({
        event: "PERSONAL_RELEVANCE_FAILURE",
        correlationId,
        userId,
        emailId,
        errorCode: error.code || error.status || "RELEVANCE_EVAL_ERROR",
        retryable: !!isRetryable,
        errorMessage: error.message,
        timestamp: new Date().toISOString(),
      }, `[PERSONAL_RELEVANCE] Evaluation failed for email ${emailId} (non-fatal): ${error.message}`);

      // Record structured AIUsageEvent failure record for auditability
      await db.aIUsageEvent.create({
        data: {
          userId,
          operationType: "PERSONAL_RELEVANCE_EVAL",
          source: "PLATFORM",
          status: "FAILED",
          errorCode: (error.code || error.message || "EVAL_FAILURE").substring(0, 200),
          correlationId,
        },
      }).catch((dbErr) => logger.warn(`[PERSONAL_RELEVANCE] Failed to log failure event: ${dbErr.message}`));

      return null;
    }
  }
}
