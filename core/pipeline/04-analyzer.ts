// core/pipeline/04-analyzer.ts
// This file is responsible for analyzing emails using AI.
// It uses the IAIProvider interface to analyze emails and convert them to a standardized format.

import { db } from "@/server/repositories/db";
import { Email, Prisma } from "@prisma/client";
import { IAIProvider } from "../interfaces/IAIProvider";
import { logger } from "@/lib/logger";


/**
 * Stage 4: AI Analyzer
 * Responsibilities:
 * - Orchestrates the AI Provider.
 * - Parses and stores structured results in the database.
 * - Updates email status to COMPLETED.
 */
export async function analyzeEmail(email: Email, aiProvider: IAIProvider) {
  logger.info(`[STAGE 04 - ANALYZER] [STARTED] [ID: ${email.id}] | metadata={"providerId": "${email.providerMessageId}"}`);

  if (!email.plainText) {
    logger.error(`[STAGE 04 - ANALYZER] [FAILED] [ID: ${email.id}] | Missing plainText.`);
    throw new Error(`Email ${email.id} has no plainText for analysis.`);
  }

  // 1. Idempotency Check
  const existingAnalysis = await db.emailAnalysis.findUnique({
    where: { emailId: email.id }
  });

  if (existingAnalysis) {
    logger.info(`[STAGE 04 - ANALYZER] [SKIPPED] [ID: ${email.id}] | Analysis already exists.`);
    return existingAnalysis;
  }

  // 2. Intelligent Truncation
  const MAX_START_CHARS = 2000;
  const MAX_END_CHARS = 1000;
  
  let payloadText = email.plainText;
  if (payloadText.length > (MAX_START_CHARS + MAX_END_CHARS + 100)) {
    const startText = payloadText.substring(0, MAX_START_CHARS);
    const endText = payloadText.substring(payloadText.length - MAX_END_CHARS);
    payloadText = `${startText}\n\n...[TRUNCATED_BY_SYSTEM]...\n\n${endText}`;
  }

  try {
    // 3. Prepare Dynamic Context (Milestone 8)
    const emailAccount = await db.emailAccount.findUnique({
      where: { id: email.emailAccountId },
      select: { userId: true }
    });

    let contextData: any = {};
    if (emailAccount?.userId) {
      const userId = emailAccount.userId;
      
      // Fetch Sender Profile
      const senderProfile = await db.senderProfile.findUnique({
        where: { userId_emailAddress: { userId, emailAddress: email.from } }
      });

      // Fetch Learning Rules (simplified match: applying all rules for this user for now, or filter by domain/sender)
      // In a production system, we might evaluate pattern matching before passing to the AI to save tokens.
      const learningRules = await db.userLearningRule.findMany({
        where: { userId }
      });

      // Fetch Thread Context (Last 3 emails in the thread)
      let threadContext: string[] = [];
      if (email.threadId) {
        const threadEmails = await db.email.findMany({
          where: { 
            emailAccountId: email.emailAccountId,
            threadId: email.threadId, 
            id: { not: email.id } 
          },
          orderBy: { date: 'desc' },
          take: 3,
          select: { plainText: true }
        });
        threadContext = threadEmails.map(e => e.plainText || "").reverse();
      }

      contextData = {
        senderProfile,
        learningRules,
        threadContext
      };
    }

    // 4. Fire AI Request
    const analysis = await aiProvider.analyzeEmail(
      payloadText, 
      email.subject || "No Subject", 
      { from: email.from, date: email.date },
      contextData
    );

    logger.info(`[STAGE 04 - ANALYZER] [SUCCESS] [ID: ${email.id}] | metadata={"score": ${analysis.score}, "latencyMs": ${analysis.latencyMs}, "cost": ${analysis.estimatedCost}}`);

    // 4. Save to DB
    await db.$transaction(async (tx) => {
      await tx.emailAnalysis.create({
        data: {
          emailId: email.id,
          score: analysis.score,
          explanation: analysis.explanation,
          isActionRequired: analysis.isActionRequired,
          extractedDeadlines: analysis.extractedDeadlines.length > 0 ? analysis.extractedDeadlines : Prisma.DbNull,
          
          confidence: analysis.confidence,
          category: analysis.category,
          actionSummary: analysis.actionSummary,
          consequence: analysis.consequence,
          opportunityDetected: analysis.opportunityDetected,
          opportunityType: analysis.opportunityType,
          priority: analysis.priority,
          suggestedNextStep: analysis.suggestedNextStep,
          estimatedReadTime: analysis.estimatedReadTime,
          reminderSuggested: analysis.reminderSuggested,
          reminderReason: analysis.reminderReason,
          reminderPriority: analysis.reminderPriority,
          reminderWindow: analysis.reminderWindow,
          requiresHumanReview: analysis.requiresHumanReview,
          appliedRules: analysis.appliedRules,

          model: analysis.model,
          promptTokens: analysis.promptTokens,
          completionTokens: analysis.completionTokens,
          totalTokens: analysis.totalTokens,
          estimatedCost: analysis.estimatedCost,
          latencyMs: analysis.latencyMs,
          
          promptVersion: "2.0",
          modelVersion: analysis.model,
          aiProvider: "OPENAI",
          aiVersion: analysis.aiVersion,
        }
      });

      await tx.email.update({
        where: { id: email.id },
        data: { status: "COMPLETED" },
      });
    });

    return analysis;
  } catch (error) {
    logger.error(`[STAGE 04 - ANALYZER] [FAILED] [ID: ${email.id}] | error=${error}`);
    // Note: We don't mark as FAILED here, the orchestrator job will catch this and increment retryCount.
    throw error;
  }
}
