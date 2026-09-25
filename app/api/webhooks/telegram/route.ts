import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/repositories/db";
import { logger } from "@/lib/logger";
import { WebhookDeduplicationService } from "@/services/security/deduplication.service";
import { DistributedRateLimiter } from "@/services/security/rate-limiter.service";
import { ConversationService } from "@/services/assistant/conversation.service";
import { IntentClassifier } from "@/services/assistant/intent-classifier";
import { ResearchOrchestratorService } from "@/services/research/research-orchestrator.service";
import { ChannelDispatcherService } from "@/services/assistant/channel-dispatcher.service";
import { ResearchQuotaService } from "@/services/research/research-quota.service";
import { resolveAIProvider } from "@/services/ai/ai-router";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

/**
 * Sends a message back to the user via Telegram Bot API.
 */
async function sendTelegramMessage(chatId: string | number, text: string) {
  return await ChannelDispatcherService.sendTelegramText(String(chatId), text);
}

export async function POST(req: NextRequest) {
  try {
    // 1. Webhook Secret Token Verification (Production Security)
    if (TELEGRAM_WEBHOOK_SECRET) {
      const secretToken = req.headers.get("x-telegram-bot-api-secret-token");
      if (secretToken !== TELEGRAM_WEBHOOK_SECRET) {
        logger.warn("[TELEGRAM_WEBHOOK] Unauthorized secret token.");
        return new NextResponse("Unauthorized", { status: 401 });
      }
    } else {
      logger.warn("[TELEGRAM_WEBHOOK] TELEGRAM_WEBHOOK_SECRET is not configured. Proceeding without header verification.");
    }

    let update: any;
    try {
      update = await req.json();
    } catch {
      logger.warn("[TELEGRAM_WEBHOOK] Malformed JSON payload received.");
      return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
    }

    // 2. Deduplication check on update_id
    if (update.update_id) {
      const isDuplicate = await WebhookDeduplicationService.isDuplicate(
        "TELEGRAM",
        "TELEGRAM",
        String(update.update_id)
      );
      if (isDuplicate) {
        return NextResponse.json({ ok: true });
      }
    }

    // Handle Inline Keyboard Callback Queries (e.g. [ 🔎 Deep Research & Cross-Check ] button tap)
    if (update.callback_query) {
      const cb = update.callback_query;
      const callbackId = cb.id;
      const data = cb.data || "";
      const cbChatId = String(cb.message?.chat?.id || cb.from?.id);

      await ChannelDispatcherService.answerTelegramCallback(callbackId, "🔎 Launching Deep Research...");

      const cbUser = await db.user.findFirst({ where: { telegramChatId: cbChatId } });
      if (!cbUser) {
        await ChannelDispatcherService.sendTelegramText(cbChatId, "👋 Please link your account first via Settings > Integrations.");
        return NextResponse.json({ ok: true });
      }

      if (data.startsWith("research:")) {
        const emailId = data.replace("research:", "");
        const targetEmail = await db.email.findUnique({
          where: { id: emailId },
          include: { analysis: true },
        });

        if (!targetEmail) {
          await ChannelDispatcherService.sendTelegramText(cbChatId, "❌ Email not found or deleted.");
          return NextResponse.json({ ok: true });
        }

        const cbConv = await ConversationService.getOrCreateConversation(cbUser.id, "TELEGRAM", cbChatId);
        await ConversationService.updateContext(cbConv.id, cbUser.id, { activeEmailId: targetEmail.id });

        const researchQuery = `Verify company background, legitimacy, registration links, and domain reputation for: ${targetEmail.subject || "Email"} (Sender: ${targetEmail.from || "Unknown"})`;

        try {
          await ResearchOrchestratorService.initiateResearch({
            userId: cbUser.id,
            query: researchQuery,
            conversationId: cbConv.id,
            emailId: targetEmail.id,
            context: `Subject: ${targetEmail.subject}\nFrom: ${targetEmail.from}\nSummary: ${targetEmail.analysis?.summary || ""}\nAction Items: ${(targetEmail.analysis?.actionItems as any[])?.join("; ") || ""}`,
          });

          await ChannelDispatcherService.sendTelegramText(
            cbChatId,
            `🔎 *Deep Research Initiated*\n\n📧 *Email:* ${targetEmail.subject}\n🎯 *Focus:* Company background, registry verification & link authenticity\n\nOur AI research engine is cross-checking live primary sources. Your synthesized executive briefing will arrive here shortly.`
          );

          // Trigger background worker (non-blocking)
          const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
          const secret = process.env.CRON_SECRET || process.env.INTERNAL_WORKER_SECRET;
          fetch(`${baseUrl}/api/worker/research`, {
            method: "POST",
            headers: secret ? { Authorization: `Bearer ${secret}` } : {},
          }).catch(() => {});
        } catch (err: any) {
          await ChannelDispatcherService.sendTelegramText(cbChatId, `⚠️ *Research Request Failed*: ${err.message}`);
        }
      }

      return NextResponse.json({ ok: true });
    }

    // Only handle text messages
    const message = update.message;
    if (!message?.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(message.chat.id);
    const text = message.text.trim();
    const username = message.from?.username || null;
    const firstName = message.from?.first_name || "there";

    // Handle /start command with linking token
    if (text.startsWith("/start")) {
      const parts = text.split(" ");
      const linkToken = parts[1];

      if (!linkToken) {
        await sendTelegramMessage(
          chatId,
          `👋 Hey ${firstName}!\n\n` +
            `Welcome to *Inbox Sentinel* — your AI-powered email intelligence guardian.\n\n` +
            `To link your account, visit Settings > Integrations in the app and click *Connect Telegram* to generate your secure link.`
        );
        return NextResponse.json({ ok: true });
      }

      // Look up user by linking token
      const user = await db.user.findUnique({
        where: { telegramLinkToken: linkToken },
      });

      if (!user) {
        await sendTelegramMessage(
          chatId,
          `❌ Invalid or expired linking token.\n\nPlease generate a fresh link from Settings > Integrations.`
        );
        return NextResponse.json({ ok: true });
      }

      // Link account
      await db.user.update({
        where: { id: user.id },
        data: {
          telegramChatId: chatId,
          telegramUsername: username,
          telegramOptIn: true,
          telegramLinkToken: null,
          notifyChannels: {
            set: (() => {
              const existing = Array.isArray(user.notifyChannels) ? (user.notifyChannels as string[]) : [];
              return existing.includes("TELEGRAM") ? existing : [...existing, "TELEGRAM"];
            })(),
          },
        },
      });

      await sendTelegramMessage(
        chatId,
        `✅ *Account linked successfully!*\n\nHey ${firstName}, your Telegram is now connected to Inbox Sentinel. You'll receive AI alerts and can run deep research commands directly from here.`
      );

      logger.info(`[TELEGRAM_WEBHOOK] Account linked: userId=${user.id} chatId=${chatId}`);
      return NextResponse.json({ ok: true });
    }

    // Handle /stop command
    if (text === "/stop") {
      const user = await db.user.findFirst({ where: { telegramChatId: chatId } });
      if (user) {
        const existing = Array.isArray(user.notifyChannels) ? (user.notifyChannels as string[]) : [];
        await db.user.update({
          where: { id: user.id },
          data: {
            telegramOptIn: false,
            notifyChannels: existing.filter((c) => c !== "TELEGRAM"),
          },
        });
        await sendTelegramMessage(chatId, `🔕 Notifications have been disabled. You can re-enable anytime in Settings.`);
      }
      return NextResponse.json({ ok: true });
    }

    // Find linked user
    const user = await db.user.findFirst({ where: { telegramChatId: chatId } });
    if (!user) {
      await sendTelegramMessage(
        chatId,
        `👋 Your Telegram is not yet linked to Inbox Sentinel. Please visit Settings > Integrations in the app to connect.`
      );
      return NextResponse.json({ ok: true });
    }

    // Rate Limiting Check
    const rateLimitOk = await DistributedRateLimiter.limitInboundMessage(user.id);
    if (!rateLimitOk) {
      await sendTelegramMessage(chatId, `⚠️ Rate limit exceeded. Please wait a moment before sending more messages.`);
      return NextResponse.json({ ok: true });
    }

    // Resolve Conversation Context
    const conversation = await ConversationService.getOrCreateConversation(user.id, "TELEGRAM", chatId);

    // Detect if user replied to an alert message
    let repliedEmailId: string | null = null;
    if (message.reply_to_message?.message_id) {
      const notif = await db.notificationLog.findFirst({
        where: {
          channel: "TELEGRAM",
          providerMessageId: String(message.reply_to_message.message_id),
        },
      });
      if (notif?.emailId) {
        repliedEmailId = notif.emailId;
        await ConversationService.updateContext(conversation.id, user.id, { activeEmailId: repliedEmailId });
      }
    }

    const currentEmailId = repliedEmailId || conversation.activeEmailId;

    // Record Inbound Message
    await ConversationService.recordInboundMessage({
      conversationId: conversation.id,
      channel: "TELEGRAM",
      provider: "TELEGRAM",
      providerMessageId: String(message.message_id),
      content: text,
      referencedEmailId: currentEmailId || undefined,
      referencedResearchId: conversation.activeResearchId || undefined,
    });

    // Classify Intent
    const intent = IntentClassifier.classify(text);

    if (intent.type === "RESEARCH") {
      let targetEmailId = currentEmailId;
      let targetEmail: any = null;

      if (targetEmailId) {
        targetEmail = await db.email.findUnique({
          where: { id: targetEmailId },
          include: { analysis: true },
        });
      }

      // If user said "research this mail" or "research this company" without direct context, check latest email
      if (!targetEmail && intent.isReferential) {
        targetEmail = await db.email.findFirst({
          where: { emailAccount: { userId: user.id } },
          orderBy: { date: "desc" },
          include: { analysis: true },
        });
        if (targetEmail) {
          targetEmailId = targetEmail.id;
          await ConversationService.updateContext(conversation.id, user.id, { activeEmailId: targetEmail.id });
        }
      }

      // If user typed /research with no query and no target email, offer interactive picker of recent emails
      if (!targetEmail && (!intent.query || intent.isReferential)) {
        const recentEmails = await db.email.findMany({
          where: { emailAccount: { userId: user.id } },
          orderBy: { date: "desc" },
          take: 4,
          select: { id: true, subject: true, from: true },
        });

        if (recentEmails.length > 0) {
          const keyboard = recentEmails.map((em, idx) => [
            {
              text: `🔎 ${idx + 1}. ${(em.subject || "Email").substring(0, 35)}...`,
              callback_data: `research:${em.id}`,
            },
          ]);

          await ChannelDispatcherService.sendTelegramText(
            chatId,
            `🤔 *Which email would you like to investigate?*\n\nTap an email below to cross-check its company, links, and legitimacy:`,
            { inline_keyboard: keyboard }
          );
          return NextResponse.json({ ok: true });
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
        researchQuery = text;
      }

      try {
        await ResearchOrchestratorService.initiateResearch({
          userId: user.id,
          query: researchQuery || text || "Investigate email",
          conversationId: conversation.id,
          emailId: targetEmailId || undefined,
          context: contextStr,
        });

        const targetLabel = targetEmail ? `\n\n📧 *Email:* ${targetEmail.subject}` : "";
        await sendTelegramMessage(
          chatId,
          `🔎 *Investigation Initiated*${targetLabel}\n\n🎯 *Focus:* Evidence verification, company registry & primary sources\n\nOur AI research engine is cross-checking Google Search. Your synthesized executive briefing will arrive here shortly.`
        );

        // Trigger background worker (non-blocking)
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const secret = process.env.CRON_SECRET || process.env.INTERNAL_WORKER_SECRET;
        fetch(`${baseUrl}/api/worker/research`, {
          method: "POST",
          headers: secret ? { Authorization: `Bearer ${secret}` } : {},
        }).catch(() => {});
      } catch (err: any) {
        await sendTelegramMessage(chatId, `⚠️ *Research Request Failed*: ${err.message}`);
      }
    } else if (intent.type === "STATUS") {
      const quota = await ResearchQuotaService.getUsage(user.id);
      await sendTelegramMessage(
        chatId,
        `📊 *Your Inbox Sentinel Status*\n\n• Account: ${user.email}\n• Plan: *${user.plan}*\n• Deep Research Quota: *${quota.completedCount} used, ${quota.remaining} remaining* this month.\n• Reset Date: ${quota.resetDate.toLocaleDateString()}`
      );
    } else if (intent.type === "HELP") {
      await sendTelegramMessage(
        chatId,
        `🤖 *Inbox Sentinel Commands*\n\n• /research <query> — Autonomous evidence investigation\n• /status — Account and research quota status\n• /stop — Disable Telegram notifications\n• /help — Show this help menu\n\nYou can also chat directly with me to ask questions about your emails or follow up on research.`
      );
    } else {
      // General Conversational Turn
      const history = await ConversationService.getRecentHistory(conversation.id, 6);
      const provider = await resolveAIProvider(user.id);

      const replyResult = await provider.chatConversation?.(
        history,
        conversation.activeEmailId ? `Active Email ID: ${conversation.activeEmailId}` : undefined
      );

      const replyText = replyResult?.reply || "I've received your message.";

      await ConversationService.recordOutboundMessage({
        conversationId: conversation.id,
        channel: "TELEGRAM",
        content: replyText,
        referencedEmailId: conversation.activeEmailId || undefined,
      });

      await sendTelegramMessage(chatId, replyText);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    logger.error({ err: error }, "[TELEGRAM_WEBHOOK] Error processing update");
    return NextResponse.json({ ok: true });
  }
}
