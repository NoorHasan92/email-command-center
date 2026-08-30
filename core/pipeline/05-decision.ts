// core/pipeline/05-decision.ts
// This file is responsible for making decisions based on the email analysis.
// It uses the NotificationRule model to make decisions and return the rules that passed the threshold.

import { db } from "@/server/repositories/db";
import { Email, EmailAnalysis, NotificationRule } from "@prisma/client";
import { logger } from "@/lib/logger";


/**
 * Stage 5: Decision Engine
 * Responsibilities:
 * - Evaluates AI analysis results against user notification rules.
 * - Returns rules that passed the threshold.
 */
export async function evaluateDecisions(email: Email, analysis: EmailAnalysis): Promise<NotificationRule[]> {
  logger.info(`[STAGE 05 - DECISION] [STARTED] [ID: ${email.id}]`);

  try {
    // 1. Fetch user account to get userId
    const account = await db.emailAccount.findUnique({
      where: { id: email.emailAccountId },
      select: { userId: true },
    });

    if (!account) {
      throw new Error(`Account not found for email ${email.id}`);
    }

    // 2. Fetch active notification rules for this user
    const rules = await db.notificationRule.findMany({
      where: {
        userId: account.userId,
        isActive: true,
      },
    });

    if (rules.length === 0) {
      logger.info(`[STAGE 05 - DECISION] [SUCCESS] [ID: ${email.id}] | No active rules found for user ${account.userId}`);
      return [];
    }

    // 3. Evaluate each rule
    const matchedRules: NotificationRule[] = [];
    
    for (const rule of rules) {
      // Basic heuristic: Is the score >= threshold? OR is explicit action required?
      if (analysis.urgencyScore >= rule.minScoreThreshold || (analysis.requiresAction && rule.minScoreThreshold <= 80)) {
        logger.info(`[STAGE 05 - DECISION] [MATCH] [ID: ${email.id}] | Rule matched for channel: ${rule.channel}`);
        matchedRules.push(rule);
      }
    }

    logger.info(`[STAGE 05 - DECISION] [SUCCESS] [ID: ${email.id}] | Matched ${matchedRules.length} rules.`);
    return matchedRules;
  } catch (error) {
    logger.error(`[STAGE 05 - DECISION] [FAILED] [ID: ${email.id}] | error=${error}`);
    // Fail safe: return empty to avoid spamming on error
    return [];
  }
}
