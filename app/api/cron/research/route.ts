import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
import { processPendingResearchSessions } from "@/jobs/research-processor";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const url = new URL(req.url);
    const secret = url.searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET;

    if (process.env.NODE_ENV === "production") {
      if (!cronSecret || (authHeader !== `Bearer ${cronSecret}` && secret !== cronSecret)) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    await processPendingResearchSessions();

    return NextResponse.json({
      success: true,
      message: "Research processor cron executed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[CRON_RESEARCH] Error executing cron:", error);
    return NextResponse.json({ success: false, error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
