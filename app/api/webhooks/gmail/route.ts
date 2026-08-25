import { NextRequest, NextResponse, after } from "next/server";
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

    // 2. Extract Body
    const body = await req.json();

    if (!body.message || !body.message.data) {
      console.error("[WEBHOOK_GMAIL] Invalid payload structure.");
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // 3. Temporarily Store Raw Webhook Event for Dead-Letter/Queue processing
    const webhookEvent = await db.webhookEvent.create({
      data: {
        provider: "gmail",
        payload: body,
        processed: false,
        status: "PENDING",
      }
    });

    console.log(`[WEBHOOK_GMAIL] Payload successfully queued. Processing synchronously...`);

    // 4. Process SYNCHRONOUSLY before returning response.
    // The after() approach is unreliable on Vercel serverless — functions can be
    // killed before background work completes, causing webhooks to pile up as PENDING.
    // Google Pub/Sub allows up to 30s for a response, which is plenty of time.
    try {
      const { processWebhooks } = await import("@/jobs/webhook-processor");
      await processWebhooks();

      const { processPendingEmails } = await import("@/jobs/email-processor");
      await processPendingEmails();
    } catch (processingErr) {
      console.error("[WEBHOOK_GMAIL] Synchronous processing failed (will be retried by cron):", processingErr);
      // Don't return an error — the webhook event is already saved in DB
      // and will be picked up by the next cron sweep.
    }

    // 5. Secondary sweep in after() for watch renewals and any remaining items
    after(async () => {
      try {
        const { renewWatches } = await import("@/jobs/watch-renewer");
        await renewWatches();
      } catch (err) {
        console.error("[WEBHOOK_GMAIL] Background watch renewal failed:", err);
      }
    });

    // 6. Acknowledge Receipt
    return NextResponse.json({ success: true });

  } catch (error) {
    const err = error as Error;
    console.error("[WEBHOOK_GMAIL] Webhook processing error:", err.message);
    // Returning 500 will cause Google Pub/Sub to backoff and retry later
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
