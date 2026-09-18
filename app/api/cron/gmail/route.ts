import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60s for cron processing
import { renewWatches } from "@/jobs/watch-renewer";
import { processWebhooks } from "@/jobs/webhook-processor";
import { processPendingEmails } from "@/jobs/email-processor";
import { forceSyncStaleAccounts } from "@/jobs/stale-sync";

export async function GET(req: Request) {
  const start = Date.now();
  
  try {
    const authHeader = req.headers.get("authorization");
    const url = new URL(req.url);
    const secret = url.searchParams.get("secret");
    
    if (
      authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
      secret !== process.env.CRON_SECRET && 
      process.env.NODE_ENV === "production"
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const results: Record<string, { status: "success" | "failed"; error?: string }> = {};

    // 1. Renew expiring Gmail watches
    try {
      await renewWatches();
      results.watchRenewer = { status: "success" };
    } catch (err: any) {
      console.error("[CRON_GMAIL] renewWatches failed:", err);
      results.watchRenewer = { status: "failed", error: err?.message || String(err) };
    }

    // 2. Process any pending webhooks that were missed
    try {
      await processWebhooks();
      results.webhookProcessor = { status: "success" };
    } catch (err: any) {
      console.error("[CRON_GMAIL] processWebhooks failed:", err);
      results.webhookProcessor = { status: "failed", error: err?.message || String(err) };
    }

    // 3. Process any pending emails that failed or were stuck
    try {
      await processPendingEmails();
      results.emailProcessor = { status: "success" };
    } catch (err: any) {
      console.error("[CRON_GMAIL] processPendingEmails failed:", err);
      results.emailProcessor = { status: "failed", error: err?.message || String(err) };
    }

    // 4. Force sync accounts that haven't received webhooks recently
    try {
      await forceSyncStaleAccounts();
      results.staleSync = { status: "success" };
    } catch (err: any) {
      console.error("[CRON_GMAIL] forceSyncStaleAccounts failed:", err);
      results.staleSync = { status: "failed", error: err?.message || String(err) };
    }

    const duration = Date.now() - start;
    const allFailed = Object.values(results).every(r => r.status === "failed");
    const anyFailed = Object.values(results).some(r => r.status === "failed");

    console.log(`[CRON_GMAIL] Completed in ${duration}ms`, results);

    return NextResponse.json({ 
      success: !allFailed, 
      message: allFailed 
        ? "All Gmail cron tasks failed" 
        : anyFailed 
          ? "Gmail cron completed with partial failures" 
          : "Gmail cron executed successfully",
      results,
      durationMs: duration,
      timestamp: new Date().toISOString()
    }, { status: allFailed ? 500 : 200 });
  } catch (error) {
    const duration = Date.now() - start;
    const err = error as Error;
    console.error("[CRON_GMAIL] Fatal error executing cron:", err);
    return NextResponse.json({ 
      success: false, 
      error: err?.message || "Internal Server Error",
      durationMs: duration 
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
