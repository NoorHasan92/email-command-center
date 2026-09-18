import { db } from "@/server/repositories/db";
import { logger } from "@/lib/logger";
import { resolveAIProvider } from "@/services/ai/ai-router";
import { ResearchQuotaService } from "@/services/research/research-quota.service";
import { ChannelDispatcherService } from "@/services/assistant/channel-dispatcher.service";

let isProcessing = false;

export async function processPendingResearchSessions() {
  if (isProcessing) {
    logger.info("[JOB] [RESEARCH_PROCESSOR] Already processing in this container, skipping.");
    return;
  }
  isProcessing = true;

  try {
    // 0. Auto-recover any abandoned or expired quota reservations
    await ResearchQuotaService.recoverAbandonedReservations();

    const now = new Date();

    // Find pending sessions or sessions with expired leases (orphaned workers)
    const pendingSessions = await db.researchSession.findMany({
      where: {
        OR: [
          { status: "PENDING", retryCount: { lt: 3 } },
          { status: "PROCESSING", leaseExpiresAt: { lt: now }, retryCount: { lt: 3 } },
        ],
      },
      take: 10,
      orderBy: { createdAt: "asc" },
      include: {
        user: true,
        conversation: true,
      },
    });

    if (pendingSessions.length === 0) {
      return;
    }

    logger.info(`[JOB] [RESEARCH_PROCESSOR] Sweeping ${pendingSessions.length} pending research sessions...`);

    for (const session of pendingSessions) {
      // 1. Truly atomic lease acquisition: ensures mutual exclusion even for expired PROCESSING leases
      const leaseExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min lease
      const claimed = await db.researchSession.updateMany({
        where: {
          id: session.id,
          OR: [
            { status: "PENDING" },
            { status: "PROCESSING", leaseExpiresAt: { lt: now } },
          ],
        },
        data: {
          status: "PROCESSING",
          leaseExpiresAt,
        },
      });

      if (claimed.count === 0) {
        // Claimed by concurrent worker instance
        continue;
      }

      try {
        logger.info(`[JOB] [RESEARCH_PROCESSOR] Processing ResearchSession ${session.id} for user ${session.userId}...`);

        // Deletion Safety Check: Abort if user was deleted
        const currentUser = await db.user.findUnique({
          where: { id: session.userId },
          select: { id: true, isDeleted: true },
        });
        if (!currentUser || currentUser.isDeleted) {
          logger.warn(`[JOB] [RESEARCH_PROCESSOR] User ${session.userId} was deleted. Aborting session ${session.id}.`);
          continue;
        }

        // 2. Resolve AI Provider
        const provider = await resolveAIProvider(session.userId);

        // 3. Step 1: Execute research discovery (Generates AIUsageEvent #1)
        const discovery = await provider.executeResearch!({
          query: session.query,
          context: session.context || undefined,
          researchSessionId: session.id,
          correlationId: `research:${session.id}:discovery`,
        } as any);

        // 4. Step 2: Synthesize briefing (Generates AIUsageEvent #2)
        const synthesis = await provider.synthesizeBriefing!(
          discovery.findings,
          session.context || undefined,
          {
            researchSessionId: session.id,
            correlationId: `research:${session.id}:synthesis`,
          } as any
        );

        // 5. Persist ResearchFindings (Idempotency: clear previous findings on retry before inserting)
        await db.researchFinding.deleteMany({
          where: { researchSessionId: session.id },
        });

        for (const finding of discovery.findings) {
          await db.researchFinding.create({
            data: {
              researchSessionId: session.id,
              claim: finding.claim,
              evidenceSnippet: finding.evidenceSnippet,
              verificationStatus: finding.verificationStatus,
              confidenceScore: finding.confidenceScore,
              relevance: finding.relevance,
              isPrimarySource: finding.isPrimarySource,
              sources: finding.sources as any,
            },
          });
        }

        const totalTokens =
          (discovery.telemetry?.totalTokens || 0) + (synthesis.telemetry?.totalTokens || 0);
        const totalLatencyMs =
          (discovery.telemetry?.latencyMs || 0) + (synthesis.telemetry?.latencyMs || 0);

        // 6. Update session to COMPLETED
        await db.researchSession.update({
          where: { id: session.id },
          data: {
            status: "COMPLETED",
            summary: discovery.summary,
            epistemicConclusion: synthesis.epistemicConclusion,
            totalTokens,
            totalLatencyMs,
            completedAt: new Date(),
            leaseExpiresAt: null,
          },
        });

        // 7. Commit product quota reservation atomically
        await ResearchQuotaService.commitQuota(session.id);

        // 8. Deliver executive briefing to user (Outbound Idempotency Check)
        const briefingMessage = `🔍 *Deep Research Briefing: ${session.query}*\n\n${synthesis.briefingMarkdown}\n\n⚖️ *Evidence Synthesis*: ${synthesis.epistemicConclusion}`;

        // Ensure we do not dispatch duplicate messages on retry
        const existingOutbound = await db.assistantMessage.findFirst({
          where: {
            referencedResearchId: session.id,
            role: "ASSISTANT",
          },
        });

        if (!existingOutbound) {
          if (session.conversation) {
            await db.assistantMessage.create({
              data: {
                conversationId: session.conversation.id,
                role: "ASSISTANT",
                content: briefingMessage,
                channel: session.conversation.channel,
                provider: "SYSTEM",
                referencedResearchId: session.id,
              },
            });

            // Update conversation active context to point to this completed research
            await db.assistantConversation.update({
              where: { id: session.conversation.id },
              data: { activeResearchId: session.id },
            });

            // Dispatch to appropriate channel
            if (session.conversation.channel === "WHATSAPP") {
              await ChannelDispatcherService.sendWhatsAppText(session.conversation.channelChatId, briefingMessage);
            } else if (session.conversation.channel === "TELEGRAM") {
              await ChannelDispatcherService.sendTelegramText(session.conversation.channelChatId, briefingMessage);
            }
          } else if (session.user) {
            // Fallback to user notification preferences
            if (session.user.whatsappOptIn && session.user.phoneNumber) {
              await ChannelDispatcherService.sendWhatsAppText(session.user.phoneNumber, briefingMessage);
            } else if (session.user.telegramOptIn && session.user.telegramChatId) {
              await ChannelDispatcherService.sendTelegramText(session.user.telegramChatId, briefingMessage);
            }
          }
        }

        logger.info(`[JOB] [RESEARCH_PROCESSOR] ResearchSession ${session.id} successfully completed and delivered.`);
      } catch (err: any) {
        logger.error(`[JOB] [RESEARCH_PROCESSOR] Error processing session ${session.id}: ${err.message}`);

        // If session was deleted, safely ignore
        const sessionExists = await db.researchSession.findUnique({ where: { id: session.id } });
        if (!sessionExists) return;

        const nextRetryCount = session.retryCount + 1;
        if (nextRetryCount < 3) {
          // Retryable failure: reset to PENDING
          await db.researchSession.update({
            where: { id: session.id },
            data: {
              status: "PENDING",
              retryCount: nextRetryCount,
              error: err.message,
              leaseExpiresAt: null,
            },
          });
        } else {
          // Max retries reached: Mark FAILED and release quota
          await db.researchSession.update({
            where: { id: session.id },
            data: {
              status: "FAILED",
              retryCount: nextRetryCount,
              error: err.message,
              leaseExpiresAt: null,
            },
          });

          // Release quota reservation so user is not penalized for system failure
          await ResearchQuotaService.releaseQuota(session.id, err.message);

          // Deliver failure notification (idempotently)
          const failureMessage = `⚠️ *Research Update*: We encountered an issue completing your research inquiry on "${session.query}". Your monthly research quota has been restored. Error: ${err.message.substring(0, 100)}.`;
          if (session.conversation) {
            if (session.conversation.channel === "WHATSAPP") {
              await ChannelDispatcherService.sendWhatsAppText(session.conversation.channelChatId, failureMessage);
            } else if (session.conversation.channel === "TELEGRAM") {
              await ChannelDispatcherService.sendTelegramText(session.conversation.channelChatId, failureMessage);
            }
          }
        }
      }
    }
  } finally {
    isProcessing = false;
  }
}
