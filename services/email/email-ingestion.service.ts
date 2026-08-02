import { db } from "@/server/repositories/db";
import { StandardizedEmail } from "../../core/interfaces/IEmailProvider";
import { logger } from "@/lib/logger";

export class EmailIngestionService {
  /**
   * Centralized ingestion pipeline for all email providers.
   * Handles duplicate detection, Prisma insertion, and pipeline triggering.
   */
  static async ingest(emailAccountId: string, newEmails: StandardizedEmail[]): Promise<number> {
    let successfulInserts = 0;

    for (const email of newEmails) {
      // 1. Duplicate Detection
      const existing = await db.email.findUnique({
        where: { 
          emailAccountId_providerMessageId: {
            emailAccountId: emailAccountId,
            providerMessageId: email.providerMessageId
          }
        }
      });

      if (existing) {
        logger.info(`Skipped duplicate\nmessageId: ${email.providerMessageId}`);
        continue;
      }

      // 2. Prisma Insert
      logger.info(`Attempting Email insert`);
      try {
        const inserted = await db.email.create({
          data: {
            emailAccountId: emailAccountId,
            providerMessageId: email.providerMessageId,
            threadId: email.threadId,
            subject: email.subject,
            from: email.from,
            to: email.to,
            date: email.date,
            plainText: email.plainText,
            htmlBody: email.htmlBody,
            status: "SYNCED"
          }
        });
        logger.info(`Email inserted successfully\ndatabaseId: ${inserted.id}`);
        successfulInserts++;
      } catch (insertError: any) {
        logger.error(`Complete error stack during insertion:\n${insertError.stack || insertError.message}`);
      }
    }

    // 3. Pipeline Trigger
    if (successfulInserts > 0) {
      logger.info(`[INGESTION] Completed. Inserted ${successfulInserts} new emails. Triggering processor.`);
      try {
        const mod = await import("@/jobs/email-processor");
        await mod.processPendingEmails();
      } catch (err: any) {
        logger.error(`[INGESTION] Failed to trigger email processor: ${err.message}`);
      }
    }

    return successfulInserts;
  }
}
