import { NextResponse } from "next/server";
import { db } from "@/server/repositories/db";
import { sendAccountDeletionCompletedEmail } from "@/services/transactional-email/email.service";
import { executeAccountCleanup } from "@/server/services/deletion/cleanup.service";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      logger.warn("[CRON] [DELETIONS] Unauthorized attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // 1. Fetch pending deletions
    const pendingDeletions = await db.accountDeletionRequest.findMany({
      where: {
        status: "SCHEDULED",
        scheduledDeletionAt: {
          lte: now,
        },
      },
      include: {
        user: true,
      }
    });

    if (pendingDeletions.length === 0) {
      return NextResponse.json({ message: "No pending deletions to process" });
    }

    logger.info(`[CRON] [DELETIONS] Found ${pendingDeletions.length} requests ready for deletion.`);

    // 2. Lock rows by marking them as PROCESSING
    const idsToProcess = pendingDeletions.map(r => r.id);
    await db.accountDeletionRequest.updateMany({
      where: { id: { in: idsToProcess } },
      data: { status: "PROCESSING" }
    });

    const results = [];

    // 3. Process each deletion
    for (const request of pendingDeletions) {
      if (!request.user) continue;

      const email = request.user.email;
      const name = request.user.name;

      try {
        // Execute deep cleanup (soft delete & scrub)
        await executeAccountCleanup(request.userId);

        // Mark request as COMPLETED
        await db.accountDeletionRequest.update({
          where: { id: request.id },
          data: { status: "COMPLETED", deletedAt: new Date() }
        });

        // Send the final completion email AFTER scrub successfully completes
        // We captured the email address safely before the scrub
        await sendAccountDeletionCompletedEmail(email, name);

        results.push({ userId: request.userId, success: true });
      } catch (err: any) {
        logger.error(`[CRON] [DELETIONS] Failed to process deletion for user ${request.userId}: `, err);
        
        // Mark request as FAILED so it can be investigated
        await db.accountDeletionRequest.update({
          where: { id: request.id },
          data: { status: "FAILED" }
        });

        results.push({ userId: request.userId, success: false, error: err.message });
      }
    }

    return NextResponse.json({
      message: "Processed deletions",
      processed: results.length,
      results,
    });
  } catch (error: any) {
    logger.error("[CRON] [DELETIONS] process-deletions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
