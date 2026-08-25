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

    // 1. Renew expiring Gmail watches
    await renewWatches();

    // 2. Process any pending webhooks that were missed
    await processWebhooks();

    // 3. Process any pending emails that failed or were stuck
    await processPendingEmails();

    // 4. Force sync accounts that haven't received webhooks recently
    await forceSyncStaleAccounts();

    const duration = Date.now() - start;
    console.log(`[CRON_GMAIL] Completed successfully in ${duration}ms`);

    return NextResponse.json({ 
      success: true, 
      message: "Gmail cron executed successfully",
      durationMs: duration,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const duration = Date.now() - start;
    console.error("[CRON_GMAIL] Error executing cron:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Internal Server Error",
      durationMs: duration 
    }, { status: 500 });
  }
}
