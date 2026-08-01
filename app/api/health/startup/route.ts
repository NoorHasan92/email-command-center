import { NextResponse } from "next/server";
import { db } from "@/server/repositories/db";
import { logger } from "@/lib/logger";
import { validateSecrets } from "@/lib/validateSecrets";

export async function GET() {
  try {
    // 1. Validate Secrets
    validateSecrets();

    // 2. Check DB
    await db.$queryRaw`SELECT 1`;
    
    return NextResponse.json({ status: "startup_complete" });
  } catch (error: unknown) {
    logger.fatal({ err: error }, "Startup check failed");
    return NextResponse.json({ status: "startup_failed", reason: (error as Error).message }, { status: 500 });
  }
}
