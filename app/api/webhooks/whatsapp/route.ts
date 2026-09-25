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
    if (WHATSAPP_APP_SECRET) {
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
    } else {
      logger.warn("[WEBHOOK_WHATSAPP] WHATSAPP_APP_SECRET not configured. Proceeding without signature verification.");
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
            
            let messageText = "";
            let interactiveButtonId: string | null = null;

            if (messageType === "text") {
              messageText = message.text?.body?.trim() || "";
            } else if (messageType === "interactive" && message.interactive?.button_reply) {
              interactiveButtonId = message.interactive.button_reply.id;
              messageText = message.interactive.button_reply.title || "Button tapped";
            }

            if (!providerMessageId || !fromNumber || (!messageText && !interactiveButtonId)) continue;

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

            // 5b. Detect if user replied to an alert message or tapped an interactive button
            let repliedEmailId: string | null = null;

            if (interactiveButtonId && interactiveButtonId.startsWith("research:")) {
              repliedEmailId = interactiveButtonId.replace("research:", "");
            } else if (message.context?.id) {
              const rawCtxId = String(message.context.id);
              const cleanCtxId = rawCtxId.replace(/^wamid\./, "");
              const notif = await db.notificationLog.findFirst({
                where: {
                  channel: "WHATSAPP",
                  OR: [
                    { providerMessageId: rawCtxId },
                    { providerMessageId: cleanCtxId },
                    { providerMessageId: { contains: cleanCtxId } },
                  ],
                },
              });
              if (notif?.emailId) {
                repliedEmailId = notif.emailId;
              }
            }

            if (repliedEmailId) {
              await ConversationService.updateContext(conversation.id, user.id, { activeEmailId: repliedEmailId });
            }

            const currentEmailId = repliedEmailId || conversation.activeEmailId;

            // Record inbound message
            await ConversationService.recordInboundMessage({
              conversationId: conversation.id,
              channel: "WHATSAPP",
              provider: "META",
              providerMessageId,
              content: messageText,
              referencedEmailId: currentEmailId || undefined,
              referencedResearchId: conversation.activeResearchId || undefined,
            });

            // 6. Intent Classification & Routing
            // If button reply with research: prefix, force RESEARCH intent
            const intent = (interactiveButtonId && interactiveButtonId.startsWith("research:"))
              ? { type: "RESEARCH" as const, query: "", isReferential: true, targetEmailId: repliedEmailId || undefined }
              : IntentClassifier.classify(messageText);

            if (intent.type === "RESEARCH") {
              let targetEmailId = intent.targetEmailId || currentEmailId;
              let targetEmail: any = null;

              // Handle numeric selection from recent email list (e.g. "1", "2")
              if (intent.targetIndex) {
                const recentEmails = await db.email.findMany({
                  where: { emailAccount: { userId: user.id } },
                  orderBy: { date: "desc" },
                  take: 5,
                  include: { analysis: true },
                });
                const selected = recentEmails[intent.targetIndex - 1];
                if (selected) {
                  targetEmail = selected;
                  targetEmailId = selected.id;
                  await ConversationService.updateContext(conversation.id, user.id, { activeEmailId: selected.id });
                }
              }

              if (targetEmailId && !targetEmail) {
                targetEmail = await db.email.findUnique({
                  where: { id: targetEmailId },
                  include: { analysis: true },
                });
              }

              // Fallback: If user said "research this company" or "verify this" without direct context, check latest alert or latest email
              if (!targetEmail && intent.isReferential) {
                const latestNotif = await db.notificationLog.findFirst({
                  where: {
                    channel: "WHATSAPP",
                    email: { emailAccount: { userId: user.id } },
                  },
                  orderBy: { createdAt: "desc" },
                  include: { email: { include: { analysis: true } } },
                });

                if (latestNotif?.email) {
                  targetEmail = latestNotif.email;
                  targetEmailId = targetEmail.id;
                } else {
                  targetEmail = await db.email.findFirst({
                    where: { emailAccount: { userId: user.id } },
                    orderBy: { date: "desc" },
                    include: { analysis: true },
                  });
                  if (targetEmail) {
                    targetEmailId = targetEmail.id;
                  }
                }

                if (targetEmailId) {
                  await ConversationService.updateContext(conversation.id, user.id, { activeEmailId: targetEmailId });
                }
              }

              // If user typed /research with no query and no target email, offer list/buttons of recent emails
              if (!targetEmail && (!intent.query || intent.isReferential)) {
                const recentEmails = await db.email.findMany({
                  where: { emailAccount: { userId: user.id } },
                  orderBy: { date: "desc" },
                  take: 3,
                  select: { id: true, subject: true, from: true },
                });

                if (recentEmails.length > 0) {
                  const buttons = recentEmails.map((em, idx) => ({
                    id: `research:${em.id}`,
                    title: `🔎 Email #${idx + 1}`.substring(0, 20),
                  }));

                  const emailListStr = recentEmails
                    .map((em, idx) => `${idx + 1}️⃣ *${(em.subject || "Email").substring(0, 45)}*`)
                    .join("\n");

                  const promptMsg = `🤔 *Which email would you like to investigate?*\n\n${emailListStr}\n\nTap a button below or reply with the email number (e.g. *1* or *2*):`;

                  await ChannelDispatcherService.sendWhatsAppButtons(fromNumber, promptMsg, buttons);
                  continue;
                }
              }

              let researchQuery = intent.query;
              let contextStr = undefined;

              if (targetEmail) {
                if (!researchQuery || intent.isReferential) {
                  researchQuery = `Verify company background, legitimacy, registration links, and domain reputation for: ${targetEmail.subject || "Email"} (Sender: ${targetEmail.from || "Unknown"})`;
                }
                contextStr = `Subject: ${targetEmail.subject}\nFrom: ${targetEmail.from}\nSummary: ${targetEmail.analysis?.summary || ""}\nAction Items: ${(targetEmail.analysis?.actionItems as any[])?.join("; ") || ""}`;
              } else if (!researchQuery) {
                researchQuery = messageText;
              }

              try {
                // Initiate research session (enforces entitlement, capabilities, quota reservation)
                await ResearchOrchestratorService.initiateResearch({
                  userId: user.id,
                  query: researchQuery,
                  conversationId: conversation.id,
                  emailId: targetEmailId || undefined,
                  context: contextStr,
                });

                const targetLabel = targetEmail ? `\n\n📧 *Email:* ${targetEmail.subject}` : "";
                await ChannelDispatcherService.sendWhatsAppText(
                  fromNumber,
                  `🔎 *Deep Research Initiated*${targetLabel}\n\n🎯 *Focus:* Evidence verification, company registry & primary sources\n\nOur AI research engine is cross-checking live sources. Your synthesized executive briefing will be delivered here shortly.`
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
