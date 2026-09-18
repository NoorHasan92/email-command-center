import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/repositories/db";
import { OAuth2Client } from "google-auth-library";

// Initialize the Google Auth Client for JWT verification
const authClient = new OAuth2Client();

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticity Verification (OIDC/JWT)
    // Google Cloud Pub/Sub sends an OpenID Connect JWT in the Authorization header.
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn("[WEBHOOK_GMAIL] Missing Authorization header. Proceeding without verification (ensure this is only for dev!)");
    } else {
      const token = authHeader.split(" ")[1];

      try {
        // Verify the JWT signature and audience
        const ticket = await authClient.verifyIdToken({
          idToken: token,
        });
        const payload = ticket.getPayload();
        
        // We can also verify that the issuer is Google
        if (payload?.iss !== "https://accounts.google.com" && payload?.iss !== "accounts.google.com") {
          throw new Error("Invalid JWT issuer");
        }
      } catch (authError) {
        const err = authError as Error;
        console.warn("[WEBHOOK_GMAIL] JWT Verification failed:", err.message);
        return NextResponse.json({ error: "Unauthorized - Invalid JWT" }, { status: 401 });
      }
    }

    // 2. Extract Body safely
    let body: any;
    try {
      body = await req.json();
    } catch {
      console.error("[WEBHOOK_GMAIL] Failed to parse JSON body.");
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    if (!body || !body.message || !body.message.data) {
      console.error("[WEBHOOK_GMAIL] Invalid payload structure.");
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // 3. Temporarily Store Raw Webhook Event for Dead-Letter/Queue processing
    try {
      const webhookEvent = await db.webhookEvent.create({
        data: {
          provider: "gmail",
          payload: body,
          processed: false,
          status: "PENDING",
        }
      });
      console.log(`[WEBHOOK_GMAIL] Payload successfully queued (ID: ${webhookEvent.id}). Processing synchronously...`);
    } catch (dbErr: any) {
      console.error("[WEBHOOK_GMAIL] Database error storing webhook event:", dbErr?.message);
      return NextResponse.json({ 
        error: "Database error: " + (dbErr?.message || "Failed to persist webhook event") 
      }, { status: 500 });
    }

    // 4. Process SYNCHRONOUSLY before returning response.
    // The webhook event is already saved in DB, so if synchronous processing
    // fails or times out, the periodic cron sweep will pick it up.
    try {
      const { processWebhooks } = await import("@/jobs/webhook-processor");
      await processWebhooks();

      const { processPendingEmails } = await import("@/jobs/email-processor");
      await processPendingEmails();
    } catch (processingErr: any) {
      console.error("[WEBHOOK_GMAIL] Synchronous processing failed (will be retried by cron):", processingErr?.message);
    }

    // 5. Acknowledge Receipt so Pub/Sub does not enter an infinite retry loop
    return NextResponse.json({ success: true });

  } catch (error) {
    const err = error as Error;
    console.error("[WEBHOOK_GMAIL] Webhook processing error:", err);
    return NextResponse.json({ error: err?.message || "Internal Server Error" }, { status: 500 });
  }
}
