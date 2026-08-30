import { db } from "@/server/repositories/db";
import { WhatsAppProvider } from "@/services/whatsapp/whatsapp.provider";
import { logger } from "@/lib/logger";
import { startOfDay, endOfDay } from "date-fns";

export async function sendDailyDigests() {
  logger.info("[DIGEST_JOB] Starting daily digest dispatch");
  try {
    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);

    // Find all users who have opted into WhatsApp
    const users = await db.user.findMany({
      where: { whatsappOptIn: true, phoneNumber: { not: null }, isDeleted: false },
      select: { id: true, phoneNumber: true }
    });

    for (const user of users) {
      if (!user.phoneNumber) continue;

      // Aggregate today's metrics for this user
      const analysisRecords = await db.emailAnalysis.findMany({
        where: {
          email: {
            emailAccount: { userId: user.id },
            date: { gte: start, lte: end },
            status: { notIn: ["SKIPPED"] }
          }
        }
      });

      if (analysisRecords.length === 0) {
        continue;
      }

      let importantCount = 0;
      let actionItemsCount = 0;
      let deadlinesCount = 0;
      const actionItemsList: string[] = [];
      const deadlinesList: { task: string; due: string }[] = [];

      for (const record of analysisRecords) {
        if (record.urgencyScore >= 70) importantCount++;
        if (record.requiresAction) {
          actionItemsCount++;
          if (Array.isArray(record.actionItems)) {
            actionItemsList.push(...(record.actionItems as string[]));
          }
        }
        if (record.deadline) {
          deadlinesCount++;
          const task = (Array.isArray(record.actionItems) && record.actionItems[0]) || record.summary?.substring(0, 50) || "Action Required";
          const due = record.deadline.toLocaleString("en-US", {
            timeZone: "Asia/Kolkata",
            dateStyle: "medium",
            timeStyle: "short"
          });
          deadlinesList.push({ task: String(task), due });
        }
      }

      const payload = {
        importantCount,
        actionItemsCount,
        deadlinesCount,
        destination: user.phoneNumber,
        actionItemsList,
        deadlinesList
      };

      try {
        const provider = new WhatsAppProvider(user.id);
        const wamid = await provider.dispatchDigest(payload);
        logger.info(`[DIGEST_JOB] Sent digest to ${user.id} | wamid: ${wamid}`);
      } catch (err: any) {
        logger.error(`[DIGEST_JOB] Failed to send digest to ${user.id}: ${err.message}`);
      }
    }
    
    logger.info("[DIGEST_JOB] Completed daily digest dispatch");
  } catch (error: any) {
    logger.error("[DIGEST_JOB] Error in digest sender job:", error);
  }
}
