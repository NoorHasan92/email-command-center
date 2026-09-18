import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/server/repositories/db";
import { NotificationStatus } from "@prisma/client";
import { logger } from "@/lib/logger";
import { WebhookDeduplicationService } from "@/services/security/deduplication.service";
import { DistributedRateLimiter } from "@/services/security/rate-limiter.service";
import { ConversationService } from "@/services/assistant/conversation.service";
import { IntentClassifier } from "@/services/assistant/intent-classifier";
import { ResearchOrchestratorService } from "@/services/research/research-orchestrator.service";
import { ChannelDispatcherService } from "@/services/assistant/channel-dispatcher.service";
import { ResearchQuotaService } from "@/services/research/research-quota.service";
import { resolveAIProvider } from "@/services/ai/ai-router";

const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const WHATSAPP_APP_SECRET = process.env.WHATSAPP_APP_SECRET;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
    logger.info("[WEBHOOK_WHATSAPP] Webhook verified successfully.");
    return new NextResponse(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
  }

  logger.warn("[WEBHOOK_WHATSAPP] Webhook verification failed.");
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // 1. HMAC Signature Verification (Meta X-Hub-Signature-256)
    if (process.env.NODE_ENV === "production") {
      if (!WHATSAPP_APP_SECRET) {
        logger.error("[WEBHOOK_WHATSAPP] WHATSAPP_APP_SECRET is not configured in production.");
        return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
      }

      const signature = req.headers.get("x-hub-signature-256");
      if (!signature) {
        logger.warn("[WEBHOOK_WHATSAPP] Missing signature header.");
        return NextResponse.json({ error: "Missing signature" }, { status: 401 });
      }

      const expectedSignature = `sha256=${crypto
        .createHmac("sha256", WHATSAPP_APP_SECRET)
        .update(rawBody)
        .digest("hex")}`;

      const sigBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expectedSignature);

      if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
        logger.error("[WEBHOOK_WHATSAPP] Invalid signature.");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      logger.warn("[WEBHOOK_WHATSAPP] Malformed JSON payload.");
      return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
    }

    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ error: "Not a WhatsApp event" }, { status: 404 });
    }

    // Process all entries
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        // A. Delivery Status Updates (Sent, Delivered, Read, Failed)
        if (change.field === "messages" && change.value.statuses) {
          for (const statusObj of change.value.statuses) {
            const wamid = statusObj.id;
            const metaStatus = statusObj.status;

            let ourStatus: NotificationStatus = "PENDING";
            if (metaStatus === "sent") ourStatus = "SENT";
            else if (metaStatus === "delivered") ourStatus = "DELIVERED";
            else if (metaStatus === "read") ourStatus = "READ";
            else if (metaStatus === "failed") ourStatus = "FAILED";

            let errorMsg = null;
            if (ourStatus === "FAILED" && statusObj.errors) {
              errorMsg = statusObj.errors.map((e: any) => e.title || e.message).join(", ");
            }

            await db.notificationLog.updateMany({
              where: { providerMessageId: wamid },
              data: {
                status: ourStatus,
                error: errorMsg,
              },
            });
          }
        }

        // B. Inbound User Messages
        if (change.field === "messages" && change.value.messages) {
          for (const message of change.value.messages) {
            const providerMessageId = message.id;
            const fromNumber = message.from; // Phone number string
            const messageType = message.type;
            const messageText = message.text?.body?.trim() || "";

            if (!providerMessageId || !fromNumber) continue;

            // 2. Strict Deduplication Check: (channel, provider, providerMessageId)
            const isDuplicate = await WebhookDeduplicationService.isDuplicate(
              "WHATSAPP",
              "META",
              providerMessageId
            );

            if (isDuplicate) {
              // Duplicate webhook delivery -> immediate no-op
              continue;
            }

            // Only process text messages currently
            if (messageType !== "text" || !messageText) {
              continue;
            }

            // 3. User Authentication by phone number
            const cleanFrom = fromNumber.replace(/\D/g, "");
            const user = await db.user.findFirst({
              where: {
                phoneNumber: { contains: cleanFrom.slice(-10) },
              },
            });

            if (!user) {
              await ChannelDispatcherService.sendWhatsAppText(
                fromNumber,
                "👋 Hello! Your phone number is not linked to an Inbox Sentinel account. Please log in and link your WhatsApp in Integrations Settings."
              );
              continue;
            }

            // 4. Distributed Rate Limiting Check
            const rateLimitOk = await DistributedRateLimiter.limitInboundMessage(user.id);
            if (!rateLimitOk) {
              await ChannelDispatcherService.sendWhatsAppText(
                fromNumber,
                "⚠️ Rate limit exceeded. Please wait a moment before sending more messages."
              );
              continue;
            }

            // 5. Deterministic Conversation Context Resolution
            const conversation = await ConversationService.getOrCreateConversation(
              user.id,
              "WHATSAPP",
              cleanFrom
            );

            // Record inbound message
            await ConversationService.recordInboundMessage({
              conversationId: conversation.id,
              channel: "WHATSAPP",
              provider: "META",
              providerMessageId,
              content: messageText,
              referencedEmailId: conversation.activeEmailId || undefined,
              referencedResearchId: conversation.activeResearchId || undefined,
            });

            // 6. Intent Classification & Routing
            const intent = IntentClassifier.classify(messageText);

            if (intent.type === "RESEARCH") {
              try {
                // Initiate research session (enforces entitlement, capabilities, quota reservation)
                const result = await ResearchOrchestratorService.initiateResearch({
                  userId: user.id,
                  query: intent.query || messageText,
                  conversationId: conversation.id,
                  emailId: conversation.activeEmailId || undefined,
                });

                await ChannelDispatcherService.sendWhatsAppText(
                  fromNumber,
                  `🔎 *Investigation Initiated*\n\nQuery: "${intent.query || messageText}"\n\nOur AI research engine is examining primary sources. Your synthesized executive briefing will be delivered here shortly.`
                );

                // Trigger background sweep (non-blocking)
                const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
                const secret = process.env.CRON_SECRET || process.env.INTERNAL_WORKER_SECRET;
                fetch(`${baseUrl}/api/worker/research`, {
                  method: "POST",
                  headers: secret ? { Authorization: `Bearer ${secret}` } : {},
                }).catch(() => {});
              } catch (err: any) {
                await ChannelDispatcherService.sendWhatsAppText(
                  fromNumber,
                  `⚠️ *Research Request Failed*: ${err.message}`
                );
              }
            } else if (intent.type === "STATUS") {
              const quota = await ResearchQuotaService.getUsage(user.id);
              await ChannelDispatcherService.sendWhatsAppText(
                fromNumber,
                `📊 *Inbox Sentinel Status*\n\nPlan: ${user.plan}\nDeep Research Inquiries: ${quota.completedCount} used, ${quota.remaining} remaining this month.\nBilling period resets: ${quota.resetDate.toLocaleDateString()}`
              );
            } else if (intent.type === "HELP") {
              await ChannelDispatcherService.sendWhatsAppText(
                fromNumber,
                `🤖 *Inbox Sentinel Assistant*\n\nCommands:\n• /research <topic> — Autonomous evidence investigation\n• /status — Quota and plan summary\n• /help — Show this help menu\n\nYou can also chat with me to inquire about your emails or follow up on previous briefings.`
              );
            } else {
              // Conversational turn
              const history = await ConversationService.getRecentHistory(conversation.id, 6);
              const provider = await resolveAIProvider(user.id);

              const replyResult = await provider.chatConversation?.(
                history,
                conversation.activeEmailId ? `Active Email ID: ${conversation.activeEmailId}` : undefined
              );

              const replyText = replyResult?.reply || "I've received your message.";

              await ConversationService.recordOutboundMessage({
                conversationId: conversation.id,
                channel: "WHATSAPP",
                content: replyText,
                referencedEmailId: conversation.activeEmailId || undefined,
              });

              await ChannelDispatcherService.sendWhatsAppText(fromNumber, replyText);
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error(`[WEBHOOK_WHATSAPP] Processing Error: ${error.message}`);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
