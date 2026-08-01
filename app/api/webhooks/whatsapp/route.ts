import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/repositories/db";
import { NotificationStatus } from "@prisma/client";

const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

export async function GET(req: NextRequest) {
  // Meta Webhook Verification
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
    console.log("[WEBHOOK_WHATSAPP] Webhook verified successfully.");
    return new NextResponse(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }

  console.warn("[WEBHOOK_WHATSAPP] Webhook verification failed.");
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verify it's from WhatsApp
    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ error: "Not a WhatsApp event" }, { status: 404 });
    }

    // Process all entries
    for (const entry of body.entry) {
      for (const change of entry.changes) {
        if (change.field === "messages" && change.value.statuses) {
          // Status updates (Sent, Delivered, Read, Failed)
          for (const statusObj of change.value.statuses) {
            const wamid = statusObj.id; // WhatsApp Message ID
            const metaStatus = statusObj.status; // 'sent', 'delivered', 'read', 'failed'
            
            let ourStatus: NotificationStatus = "PENDING";
            if (metaStatus === "sent") ourStatus = "SENT";
            else if (metaStatus === "delivered") ourStatus = "DELIVERED";
            else if (metaStatus === "read") ourStatus = "READ";
            else if (metaStatus === "failed") ourStatus = "FAILED";

            // If failed, extract error
            let errorMsg = null;
            if (ourStatus === "FAILED" && statusObj.errors) {
              errorMsg = statusObj.errors.map((e: {title?: string, message?: string}) => e.title || e.message).join(", ");
            }

            console.log(`[WEBHOOK_WHATSAPP] Status Update: ${wamid} -> ${ourStatus}`);

            await db.notificationLog.updateMany({
              where: { providerMessageId: wamid },
              data: {
                status: ourStatus,
                error: errorMsg
              }
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    const err = error as Error;
    console.error("[WEBHOOK_WHATSAPP] Processing Error:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
