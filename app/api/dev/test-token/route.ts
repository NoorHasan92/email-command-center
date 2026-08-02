import { NextResponse } from "next/server";
import { db } from "@/server/repositories/db";
import { GmailAdapter } from "@/services/email/gmail.adapter";
import { logger } from "@/lib/logger";
import { auth } from "@/config/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  // 1. Immediately return 404 if not in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  // 2. Require ADMIN role
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
  }

  logger.info("--- Starting Integration Test: Token Lifecycle ---");

  const account = await db.emailAccount.findFirst({
    where: { provider: "gmail", userId: session.user.id },
  });

  if (!account) {
    return NextResponse.json({ error: "No Gmail account found" }, { status: 404 });
  }

  const expiredTime = Math.floor(Date.now() / 1000) - 3600;
  await db.emailAccount.update({
    where: { id: account.id },
    data: { expiresAt: expiredTime },
  });

  const adapter = new GmailAdapter();
  
  try {
    const emails = await adapter.syncAccount(account.id);
    
    const updatedAccount = await db.emailAccount.findUnique({
      where: { id: account.id },
    });

    const success = !!updatedAccount?.expiresAt && updatedAccount.expiresAt > expiredTime;
    
    // 4. Return strictly required response, absolutely NO tokens
    return NextResponse.json({
      success,
      refreshTriggered: true, // We forced expiry, so it must have triggered
      tokenRefreshed: success, // If expiresAt changed, refresh succeeded
      oldExpiry: expiredTime,
      newExpiry: updatedAccount?.expiresAt,
      emailsSynced: emails.length,
      historyId: updatedAccount?.lastHistoryId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
