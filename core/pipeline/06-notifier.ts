// core/pipeline/06-notifier.ts
// This file is responsible for dispatching notifications to external channels.
// It uses the NotificationProvider interface to dispatch notifications to different channels.

import { db } from "@/server/repositories/db";
import { Email, EmailAnalysis, NotificationRule } from "@prisma/client";
import { INotificationProvider, NotificationPayload } from "../interfaces/INotificationProvider";
import { logger } from "@/lib/logger";


/**
 * Stage 6: Notification Engine
 * Responsibilities:
 * - Dispatches alerts to external channels idempotently.
 * - Tracks delivery success in NotificationLog.
 */
export async function dispatchNotifications(
  email: Email,
  analysis: EmailAnalysis,
  matchedRules: NotificationRule[],
  providerRegistry: Record<string, INotificationProvider>
) {
  logger.info(`[STAGE 06 - NOTIFIER] [STARTED] [ID: ${email.id}] | Dispatching ${matchedRules.length} notifications.`);

  for (const rule of matchedRules) {
    const channelName = rule.channel;

    // 1. Idempotency Check
    const existingLog = await db.notificationLog.findUnique({
      where: {
        emailId_channel: {
          emailId: email.id,
          channel: channelName,
        }
      }
    });

    if (existingLog && ["SENT", "DELIVERED", "READ"].includes(existingLog.status)) {
      logger.info(`[STAGE 06 - NOTIFIER] [SKIPPED] [ID: ${email.id}] | Already sent ${channelName}.`);
      continue;
    }

    // 2. Select Provider
    const provider = providerRegistry[channelName];
    if (!provider) {
      logger.error(`[STAGE 06 - NOTIFIER] [FAILED] [ID: ${email.id}] | No provider for channel: ${channelName}`);
      continue;
    }

    // 3. Fetch User Contact Info
    const emailAccount = await db.emailAccount.findUnique({ where: { id: email.emailAccountId }, select: { userId: true } });
    const user = await db.user.findUnique({ where: { id: emailAccount?.userId } });

    if (!user || !user.phoneNumber || !user.whatsappOptIn) {
      logger.info(`[STAGE 06 - NOTIFIER] [SKIPPED] [ID: ${email.id}] | User opted out or no phone number.`);
      continue;
    }

    // 4. Prepare Payload
    const payload: NotificationPayload = {
      emailId: email.id,
      subject: email.subject || "No Subject",
      score: analysis.score,
      explanation: analysis.explanation || "No explanation provided.",
      actionRequired: analysis.isActionRequired,
      destination: user.phoneNumber,
    };

    // 5. Dispatch and Log
    try {
      const providerMessageId = await provider.dispatch(payload);

      await db.notificationLog.upsert({
        where: {
          emailId_channel: {
            emailId: email.id,
            channel: channelName,
          }
        },
        create: {
          emailId: email.id,
          channel: channelName,
          status: "SENT",
          providerMessageId,
          dispatchedAt: new Date(),
        },
        update: {
          status: "SENT",
          providerMessageId,
          dispatchedAt: new Date(),
        }
      });

      logger.info(`[STAGE 06 - NOTIFIER] [SUCCESS] [ID: ${email.id}] | Channel: ${channelName} | WAMID: ${providerMessageId}`);
      
    } catch (error: any) {
      logger.error(`[STAGE 06 - NOTIFIER] [FAILED] [ID: ${email.id}] | Channel: ${channelName} | error=${error.message}`);
      
      await db.notificationLog.upsert({
        where: { emailId_channel: { emailId: email.id, channel: channelName } },
        create: { emailId: email.id, channel: channelName, status: "FAILED", error: error.message },
        update: { status: "FAILED", error: error.message, retryCount: { increment: 1 } }
      });
      // Let orchestrator handle background retry if needed
    }
  }
}
