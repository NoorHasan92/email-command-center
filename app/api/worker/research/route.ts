import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
import { processPendingResearchSessions } from "@/jobs/research-processor";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const secret = process.env.CRON_SECRET || process.env.INTERNAL_WORKER_SECRET;

    if (process.env.NODE_ENV === "production") {
      if (!secret || authHeader !== `Bearer ${secret}`) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    // Run sweep asynchronously or inline up to timeout
    await processPendingResearchSessions();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[WORKER_RESEARCH] Execution error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
