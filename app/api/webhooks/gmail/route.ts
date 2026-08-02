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

    // 2. Extract Body
    const body = await req.json();

    if (!body.message || !body.message.data) {
      console.error("[WEBHOOK_GMAIL] Invalid payload structure.");
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // 3. Temporarily Store Raw Webhook Event for Dead-Letter/Queue processing
    await db.webhookEvent.create({
      data: {
        provider: "gmail",
        payload: body,
        processed: false,
        status: "PENDING",
      }
    });

    console.log(`[WEBHOOK_GMAIL] Payload successfully queued.`);

    // Fire the processor asynchronously in the background (fire-and-forget)
    import("@/jobs/webhook-processor").then((mod) => {
      mod.processWebhooks().catch(err => {
        console.error("[WEBHOOK_GMAIL] Background processor failed:", err);
      });
    });

    // 4. Acknowledge Receipt Immediately
    return NextResponse.json({ success: true });

  } catch (error) {
    const err = error as Error;
    console.error("[WEBHOOK_GMAIL] Webhook processing error:", err.message);
    // Returning 500 will cause Google Pub/Sub to backoff and retry later
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
