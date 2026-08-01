import { NextResponse } from "next/server";
import { db } from "@/server/repositories/db";

export async function GET() {
  try {
    const totalConnectedAccounts = await db.emailAccount.count({
      where: { provider: "gmail" }
    });

    const activeWatches = await db.emailAccount.count({
      where: { provider: "gmail", syncStatus: "ACTIVE" }
    });

    const fortyEightHoursFromNow = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const expiringWatches = await db.emailAccount.count({
      where: {
        provider: "gmail",
        syncStatus: { not: "ERROR" },
        OR: [
          { watchExpiration: { lte: fortyEightHoursFromNow } },
          { watchExpiration: null }
        ]
      }
    });

    const failedAccounts = await db.emailAccount.count({
      where: { provider: "gmail", syncStatus: "ERROR" }
    });

    const deadLetterQueue = await db.webhookEvent.count({
      where: { provider: "gmail", status: "FAILED" }
    });

    const pendingQueueSize = await db.webhookEvent.count({
      where: { provider: "gmail", status: "PENDING" }
    });

    // We can also aggregate total emails synced
    const syncMetrics = await db.emailAccount.aggregate({
      _sum: { totalEmailsSynced: true },
    });

    return NextResponse.json({
      health: "OK",
      timestamp: new Date().toISOString(),
      gmail: {
        accounts: {
          total: totalConnectedAccounts,
          active: activeWatches,
          error: failedAccounts,
          expiring: expiringWatches,
        },
        queue: {
          backlog: pendingQueueSize,
          deadLetter: deadLetterQueue,
        },
        metrics: {
          totalEmailsSynced: syncMetrics._sum.totalEmailsSynced || 0
        }
      }
    });

  } catch (error) {
    console.error("[HEALTH_API] Failed to fetch Gmail health metrics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
