// app/api/webhooks/telegram/route.ts
// Webhook endpoint for Telegram Bot updates.
// Handles /start <linking_token> messages to link user accounts.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/repositories/db";
import { logger } from "@/lib/logger";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Sends a message back to the user via Telegram Bot API.
 */
async function sendTelegramMessage(chatId: string | number, text: string) {
  if (!TELEGRAM_BOT_TOKEN) return;

  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

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
        // User just clicked Start without a token — send welcome message
        await sendTelegramMessage(chatId, 
          `👋 Hey ${firstName}!\n\n` +
          `Welcome to <b>Inbox Sentinel</b> — your AI-powered email guardian.\n\n` +
          `To link your account, go to the <b>Integrations</b> page in the app and click <b>Connect Telegram</b>.\n\n` +
          `That will generate a unique link for you. 🔗`
        );
        return NextResponse.json({ ok: true });
      }

      // Look up the user by their linking token
      const user = await db.user.findUnique({
        where: { telegramLinkToken: linkToken },
      });

      if (!user) {
        await sendTelegramMessage(chatId,
          `❌ Invalid or expired linking token.\n\n` +
          `Please go back to the Integrations page and click <b>Connect Telegram</b> to generate a new link.`
        );
        return NextResponse.json({ ok: true });
      }

      // Link the Telegram account
      await db.user.update({
        where: { id: user.id },
        data: {
          telegramChatId: chatId,
          telegramUsername: username,
          telegramOptIn: true,
          telegramLinkToken: null, // Clear the token after use

          // Auto-add TELEGRAM to their notifyChannels
          notifyChannels: {
            set: (() => {
              const existing = Array.isArray(user.notifyChannels) ? user.notifyChannels as string[] : [];
              if (!existing.includes("TELEGRAM")) {
                return [...existing, "TELEGRAM"];
              }
              return existing;
            })(),
          },
        },
      });

      await sendTelegramMessage(chatId,
        `✅ <b>Account linked successfully!</b>\n\n` +
        `Hey ${firstName}, your Telegram is now connected to Inbox Sentinel.\n\n` +
        `You'll receive AI-powered email alerts right here. 🚀\n\n` +
        `To manage your notification preferences, visit the <b>Integrations</b> page in the app.`
      );

      logger.info(`[TELEGRAM_WEBHOOK] Account linked: userId=${user.id} chatId=${chatId} username=${username}`);
      return NextResponse.json({ ok: true });
    }

    // Handle /stop command to unlink
    if (text === "/stop") {
      const user = await db.user.findFirst({
        where: { telegramChatId: chatId },
      });

      if (user) {
        const existing = Array.isArray(user.notifyChannels) ? user.notifyChannels as string[] : [];
        await db.user.update({
          where: { id: user.id },
          data: {
            telegramOptIn: false,
            notifyChannels: existing.filter(c => c !== "TELEGRAM"),
          },
        });

        await sendTelegramMessage(chatId,
          `🔕 Notifications have been <b>disabled</b>.\n\n` +
          `You can re-enable them anytime from the Integrations page in the app.`
        );
        logger.info(`[TELEGRAM_WEBHOOK] Notifications disabled: userId=${user.id}`);
      } else {
        await sendTelegramMessage(chatId,
          `No linked account found for this chat. Nothing to do! 👋`
        );
      }

      return NextResponse.json({ ok: true });
    }

    // Handle /status command
    if (text === "/status") {
      const user = await db.user.findFirst({
        where: { telegramChatId: chatId },
      });

      if (user) {
        const channels = Array.isArray(user.notifyChannels) ? (user.notifyChannels as string[]).join(", ") : "None";
        await sendTelegramMessage(chatId,
          `📊 <b>Your Inbox Sentinel Status</b>\n\n` +
          `🔗 Account: <b>${user.email}</b>\n` +
          `📱 Telegram: <b>${user.telegramOptIn ? "Active ✅" : "Disabled ❌"}</b>\n` +
          `📢 Active Channels: <b>${channels || "None"}</b>`
        );
      } else {
        await sendTelegramMessage(chatId,
          `No linked account found. Visit the Integrations page to connect your Telegram.`
        );
      }

      return NextResponse.json({ ok: true });
    }

    // Unknown command
    await sendTelegramMessage(chatId,
      `I only understand these commands:\n\n` +
      `/status — Check your account status\n` +
      `/stop — Disable notifications\n\n` +
      `To link your account, use the <b>Connect Telegram</b> button in the app.`
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error({ err: error }, "[TELEGRAM_WEBHOOK] Error processing update");
    // Always return 200 to Telegram to prevent retries
    return NextResponse.json({ ok: true });
  }
}
