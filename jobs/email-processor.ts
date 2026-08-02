import { db } from "@/server/repositories/db";
import { normalizeEmail } from "@/core/pipeline/02-normalizer";
import { prefilterEmail } from "@/core/pipeline/03-prefilter";
import { analyzeEmail } from "@/core/pipeline/04-analyzer";
import { GeminiAdapter } from "@/services/ai/gemini.adapter";
import { logger } from "@/lib/logger";

const aiProvider = new GeminiAdapter();

export async function processPendingEmails() {
  logger.info("[JOB] [EMAIL_PROCESSOR] [STARTED] Sweeping queued emails...");

  const pendingEmails = await db.email.findMany({
    where: { 
      status: { in: ["SYNCED", "QUEUED_FOR_AI"] }, 
      retryCount: { lt: 3 } 
    },
    take: 50,
  });

  if (pendingEmails.length === 0) {
    logger.info("[JOB] [EMAIL_PROCESSOR] [SUCCESS] No queued emails.");
    return;
  }

  logger.info(`[JOB] [EMAIL_PROCESSOR] [INFO] Found ${pendingEmails.length} emails to process.`);

  for (const rawEmail of pendingEmails) {
    try {
      // 1. Mark as AI_PROCESSING to prevent other workers from grabbing it
      const email = await db.email.update({
        where: { id: rawEmail.id },
        data: { status: "AI_PROCESSING", retryCount: { increment: 1 } },
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
        await db.email.update({ where: { id: email.id }, data: { pipelineMetrics: metrics } });
        continue;
      }

      // 4. Analyzer (Gemini)
      stageStart = performance.now();
      await analyzeEmail(normalizedEmail, aiProvider);
      metrics.analyzer = Math.round(performance.now() - stageStart);

      // 5. Update Metrics (Status is already updated to AI_COMPLETE in analyzer)
      await db.email.update({
        where: { id: email.id },
        data: { pipelineMetrics: metrics }
      });

      // 6. Notifier Engine (WhatsApp Integration)
      const analysis = await db.emailAnalysis.findUnique({ where: { emailId: email.id } });
      if (analysis && (analysis.suggestedNotification || analysis.urgencyScore >= 80)) {
        const { WhatsAppAdapter } = await import("@/services/whatsapp/whatsapp.adapter");
        const { dispatchNotifications } = await import("@/core/pipeline/06-notifier");
        
        const mockRule = { channel: "WHATSAPP" } as any;
        
        stageStart = performance.now();
        await dispatchNotifications(
          normalizedEmail,
          analysis,
          [mockRule],
          { WHATSAPP: new WhatsAppAdapter() }
        );
        metrics.notifier = Math.round(performance.now() - stageStart);
        
        await db.email.update({
          where: { id: email.id },
          data: { pipelineMetrics: metrics }
        });
      }

    } catch (error: any) {
      logger.error(`[JOB] [EMAIL_PROCESSOR] [FAILED] [ID: ${rawEmail.id}] | error=${error.message}`);
      
      const newStatus = rawEmail.retryCount + 1 >= 3 ? "AI_FAILED" : "QUEUED_FOR_AI";
      
      const metrics: any = (rawEmail.pipelineMetrics as any) || {};
      metrics.error = error.message;

      await db.email.update({
        where: { id: rawEmail.id },
        data: { status: newStatus, pipelineMetrics: metrics },
      });
    }
  }

  logger.info("[JOB] [EMAIL_PROCESSOR] [COMPLETED]");
}
