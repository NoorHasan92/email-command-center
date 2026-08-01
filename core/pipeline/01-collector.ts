// core/pipeline/01-collector.ts
// This file is responsible for collecting emails from the email provider.
// It uses the IEmailProvider interface to collect emails and convert them to a standardized format.
// It also uses the db.email.upsert method to persist the email in the database.

import { db } from "@/server/repositories/db";
import { Email } from "@prisma/client";
import { StandardizedEmail } from "../interfaces/IEmailProvider";
import { logger } from "@/lib/logger";


/**
 * Stage 1: Collector
 * Responsibilities:
 * - Persists the raw or semi-processed payload from the email provider into the DB.
 * - Enforces uniqueness to prevent double processing.
 * - Decouples ingestion (fast) from analysis (slow).
 */
export async function collectEmail(emailAccountId: string, payload: StandardizedEmail): Promise<Email> {
  try {
    const startTime = performance.now();
    logger.info(`[STAGE 01 - COLLECTOR] [STARTED] | emailAccountId=${emailAccountId} providerMessageId=${payload.providerMessageId}`);
    
    // Idempotency: If this exact message already exists for this account, simply return it.
    const email = await db.email.upsert({
      where: {
        emailAccountId_providerMessageId: {
          emailAccountId,
          providerMessageId: payload.providerMessageId,
        },
      },
      create: {
        emailAccountId,
        providerMessageId: payload.providerMessageId,
        subject: payload.subject,
        from: payload.from,
        to: payload.to,
        date: payload.date,
        htmlBody: payload.htmlBody,
        plainText: payload.plainText,
        threadId: payload.threadId,
        status: "PENDING",
      },
      update: {
        // We only update non-destructive fields if it already exists.
        // It might be PENDING from a previous aborted run.
        subject: payload.subject,
        from: payload.from,
        to: payload.to,
        date: payload.date,
        htmlBody: payload.htmlBody,
        plainText: payload.plainText,
        threadId: payload.threadId,
      },
    });

    const latency = Math.round(performance.now() - startTime);

    // Update the metrics
    const existingMetrics = email.pipelineMetrics ? (email.pipelineMetrics as any) : {};
    const updatedMetrics = { ...existingMetrics, collector: latency };

    const updatedEmail = await db.email.update({
      where: { id: email.id },
      data: { pipelineMetrics: updatedMetrics }
    });

    logger.info(`[STAGE 01 - COLLECTOR] [SUCCESS] [ID: ${email.id}] | metadata={"providerId": "${payload.providerMessageId}", "subject": "${payload.subject}"} | latency=${latency}ms`);
    return updatedEmail;
  } catch (error) {
    logger.error(`[STAGE 01 - COLLECTOR] [FAILED] | metadata={"providerId": "${payload.providerMessageId}"} | error=${error}`);
    throw error;
  }
}
