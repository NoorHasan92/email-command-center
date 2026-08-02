import { db } from "@/server/repositories/db";
import { Email, Prisma } from "@prisma/client";
import { IAIProvider } from "../interfaces/IAIProvider";
import { logger } from "@/lib/logger";

export async function analyzeEmail(email: Email, aiProvider: IAIProvider) {
  logger.info(`[STAGE 04 - ANALYZER] [AI_REQUEST_STARTED] [ID: ${email.id}] | metadata={"providerId": "${email.providerMessageId}"}`);

  // 1. Ensure body exists or provide explicit instruction for attachment-only emails
  let payloadText = email.plainText?.trim() || email.htmlBody?.trim() || "";
  
  if (payloadText.length === 0) {
    logger.warn(`[STAGE 04 - ANALYZER] [ID: ${email.id}] | Email has no body text. Flagging as attachment-only for AI.`);
    payloadText = "[NO BODY TEXT PROVIDED. THIS EMAIL LIKELY ONLY CONTAINS AN ATTACHMENT. CLASSIFY BASED ON SUBJECT ONLY.]";
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
  
  if (payloadText.length > (MAX_START_CHARS + MAX_END_CHARS + 100)) {
    const startText = payloadText.substring(0, MAX_START_CHARS);
    const endText = payloadText.substring(payloadText.length - MAX_END_CHARS);
    payloadText = `${startText}\n\n...[TRUNCATED_BY_SYSTEM]...\n\n${endText}`;
  }

  try {
    // 3. Fire AI Request
    const analysis = await aiProvider.analyzeEmail(
      payloadText, 
      email.subject || "No Subject", 
      { from: email.from, date: email.date }
    );

    logger.info(`[STAGE 04 - ANALYZER] [AI_REQUEST_COMPLETED] [ID: ${email.id}] | metadata={"latencyMs": ${analysis.latencyMs}, "tokens": ${analysis.totalTokens}}`);

    // 4. Save to DB
    await db.$transaction(async (tx) => {
      await tx.emailAnalysis.create({
        data: {
          emailId: email.id,
          summary: analysis.summary,
          category: analysis.category,
          priority: analysis.priority,
          confidence: analysis.confidence,
          requiresAction: analysis.requiresAction,
          reasoning: analysis.reasoning,
          deadline: analysis.deadline,
          actionItems: analysis.actionItems.length > 0 ? analysis.actionItems : Prisma.DbNull,
          entities: analysis.entities.length > 0 ? analysis.entities : Prisma.DbNull,
          sentiment: analysis.sentiment,
          urgencyScore: analysis.urgencyScore,
          estimatedReadingTime: analysis.estimatedReadingTime,
          suggestedNotification: analysis.suggestedNotification,

          // Telemetry
          model: analysis.model,
          promptTokens: analysis.promptTokens,
          completionTokens: analysis.completionTokens,
          totalTokens: analysis.totalTokens,
          latencyMs: analysis.latencyMs,
          finishReason: analysis.finishReason,
          
          // Versioning
          aiProvider: "GEMINI",
          promptVersion: "1.0",
          modelVersion: analysis.model,
        }
      });

      await tx.email.update({
        where: { id: email.id },
        data: { status: "AI_COMPLETE" },
      });
    });

    logger.info(`[STAGE 04 - ANALYZER] [AI_ANALYSIS_STORED] [ID: ${email.id}]`);

    return analysis;
  } catch (error) {
    logger.error(`[STAGE 04 - ANALYZER] [AI_REQUEST_FAILED] [ID: ${email.id}] | error=${error}`);
    throw error; // Let the orchestrator job handle the retry and state change
  }
}
