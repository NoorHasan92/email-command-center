import { NextResponse } from "next/server";
import { db } from "@/server/repositories/db";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    // Check DB connection
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ready", db: "ok" });
  } catch (error) {
    logger.error({ err: error }, "Readiness check failed");
    return NextResponse.json({ status: "not_ready", db: "error" }, { status: 503 });
  }
}
