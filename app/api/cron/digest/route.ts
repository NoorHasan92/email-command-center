import { NextResponse } from "next/server";
import { sendDailyDigests } from "@/jobs/digest-sender";

export async function GET(req: Request) {
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

    await sendDailyDigests();

    return NextResponse.json({ success: true, message: "Digest cron executed successfully" });
  } catch (error) {
    console.error("[CRON_DIGEST] Error executing cron:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
