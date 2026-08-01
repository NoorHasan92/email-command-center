// jobs/email-processor.ts
// This file is the main entry point for the email processing pipeline.
// It is responsible for fetching emails from the database and running them through the pipeline.
// The pipeline is a series of steps that are executed in order.

import { db } from "@/server/repositories/db";
import { normalizeEmail } from "../core/pipeline/02-normalizer";
import { prefilterEmail } from "../core/pipeline/03-prefilter";
import { analyzeEmail } from "../core/pipeline/04-analyzer";
import { evaluateDecisions } from "../core/pipeline/05-decision";
import { dispatchNotifications } from "../core/pipeline/06-notifier";
import { OpenAIAdapter } from "../services/ai/openai.adapter";
import { WhatsAppAdapter } from "../services/whatsapp/whatsapp.adapter";
import { logger } from "@/lib/logger";


// Initialize singleton adapters
const aiProvider = new OpenAIAdapter();
const notificationProviders = {
  WHATSAPP: new WhatsAppAdapter(),
  // EMAIL: new EmailAdapter(),
};

/**
 * The core orchestrator job that runs asynchronously.
 * Fetches PENDING emails, runs them through the pipeline, and handles retries.
 */
export async function processPendingEmails() {
  logger.info("[JOB] [EMAIL_PROCESSOR] [STARTED] Sweeping pending emails...");

  const pendingEmails = await db.email.findMany({
    where: { status: "PENDING", retryCount: { lt: 3 } },
    take: 50, // Process in batches
  });

  if (pendingEmails.length === 0) {
    logger.info("[JOB] [EMAIL_PROCESSOR] [SUCCESS] No pending emails.");
    return;
  }

  logger.info(`[JOB] [EMAIL_PROCESSOR] [INFO] Found ${pendingEmails.length} emails to process.`);

  for (const rawEmail of pendingEmails) {
    try {
      // 1. Mark as PROCESSING to prevent other workers from grabbing it
      const email = await db.email.update({
        where: { id: rawEmail.id },
        data: { status: "PROCESSING", retryCount: { increment: 1 } },
      });
      const metrics: Record<string, number> = (email.pipelineMetrics as any) || {};

      // 2. Normalizer
      let stageStart = performance.now();
      const normalizedEmail = await normalizeEmail(email);
      metrics.normalizer = Math.round(performance.now() - stageStart);

      // 3. PreFilter
      stageStart = performance.now();
      const shouldSkip = await prefilterEmail(normalizedEmail);
      metrics.prefilter = Math.round(performance.now() - stageStart);
      
      if (shouldSkip) {
        // Status updated to SKIPPED inside prefilterEmail
        // We can update the metrics too
        await db.email.update({ where: { id: email.id }, data: { pipelineMetrics: metrics } });
        continue;
      }

      // 4. Analyzer
      stageStart = performance.now();
      const analysis = await analyzeEmail(normalizedEmail, aiProvider);
      metrics.analyzer = Math.round(performance.now() - stageStart);

      // 5. Decision Engine
      stageStart = performance.now();
      const emailAnalysisRecord = await db.emailAnalysis.findUnique({
        where: { emailId: email.id }
      });

      if (!emailAnalysisRecord) {
        throw new Error(`Failed to retrieve stored analysis for email: ${email.id}`);
      }

      const matchedRules = await evaluateDecisions(normalizedEmail, emailAnalysisRecord);
      metrics.decision = Math.round(performance.now() - stageStart);

      // 6. Notifier
      stageStart = performance.now();
      if (matchedRules.length > 0) {
        await dispatchNotifications(normalizedEmail, emailAnalysisRecord, matchedRules, notificationProviders);
      } else {
        logger.info(`[JOB] [EMAIL_PROCESSOR] [INFO] [ID: ${email.id}] No notification thresholds met.`);
      }
      metrics.notifier = Math.round(performance.now() - stageStart);

      // Save final metrics and mark as COMPLETED
      await db.email.update({
        where: { id: email.id },
        data: { 
          status: "COMPLETED",
          pipelineMetrics: metrics 
        }
      });

    } catch (error) {
      logger.error(`[JOB] [EMAIL_PROCESSOR] [FAILED] [ID: ${rawEmail.id}] | error=${error}`);
      
      // Mark as FAILED if retry limit reached, otherwise back to PENDING
      const newStatus = rawEmail.retryCount + 1 >= 3 ? "FAILED" : "PENDING";
      
      await db.email.update({
        where: { id: rawEmail.id },
        data: { status: newStatus },
      });
    }
  }

  logger.info("[JOB] [EMAIL_PROCESSOR] [COMPLETED]");
}
