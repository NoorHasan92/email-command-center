// app/api/integrations/telegram/link/route.ts
// Generates a unique Telegram deep link for the authenticated user.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { db } from "@/server/repositories/db";
import crypto from "crypto";

const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || "inbox_Sentinel_bot";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate a cryptographically secure linking token
    const linkToken = crypto.randomBytes(16).toString("hex");

    // Store it on the user record (replaces any existing token)
    await db.user.update({
      where: { id: session.user.id },
      data: { telegramLinkToken: linkToken },
    });

    // Build the Telegram deep link
    const deepLink = `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${linkToken}`;

    return NextResponse.json({ deepLink });
  } catch (error) {
    console.error("[TELEGRAM_LINK] Error:", error);
    return NextResponse.json({ error: "Failed to generate link" }, { status: 500 });
  }
}
