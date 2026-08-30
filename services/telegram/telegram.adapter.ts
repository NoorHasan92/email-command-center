// services/telegram/telegram.adapter.ts
// Telegram Bot API notification adapter implementing INotificationProvider.

import { INotificationProvider, NotificationPayload } from "../../core/interfaces/INotificationProvider";
import { logger } from "@/lib/logger";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Utility for Exponential Backoff on rate limits
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      const err = error as any;
      if (err.status === 429 || err.message?.includes("429")) {
        attempt++;
        const retryAfter = err.retryAfter || Math.pow(2, attempt);
        const delayMs = retryAfter * 1000 + Math.random() * 500;
        logger.warn(`[TELEGRAM_ADAPTER] Rate limit hit. Retrying in ${Math.round(delayMs)}ms... (Attempt ${attempt}/${maxRetries})`);
        await new Promise(r => setTimeout(r, delayMs));
      } else {
        throw error;
      }
    }
  }
  throw new Error(`[TELEGRAM_ADAPTER] Operation failed after ${maxRetries} retries.`);
}

/**
 * Escapes special characters for Telegram MarkdownV2 format.
 */
function escapeMarkdownV2(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}

export class TelegramAdapter implements INotificationProvider {
  /**
   * Dispatches a notification to a Telegram chat.
   * Resolves with the Telegram message_id string if successful.
   */
  async dispatch(payload: NotificationPayload): Promise<string> {
    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error("[TELEGRAM_ADAPTER] Missing TELEGRAM_BOT_TOKEN in environment.");
    }

    const chatId = payload.destination;
    if (!chatId) {
      throw new Error("[TELEGRAM_ADAPTER] No chat_id (destination) provided.");
    }

    const priorityEmoji = payload.actionRequired ? "🔴" : "🟡";
    const priorityLabel = payload.actionRequired ? "Action Required" : "High Priority";
    const scoreBar = "█".repeat(Math.round(payload.score / 10)) + "░".repeat(10 - Math.round(payload.score / 10));

    // Build a beautifully formatted MarkdownV2 message
    const subject = escapeMarkdownV2(payload.subject.substring(0, 100));
    const explanation = escapeMarkdownV2(payload.explanation.substring(0, 800));
    const scoreText = escapeMarkdownV2(`${payload.score}/100`);
    const barText = escapeMarkdownV2(scoreBar);

    const message = [
      `${priorityEmoji} *Inbox Sentinel Alert*`,
      ``,
      `📧 *Subject:* ${subject}`,
      `⚡ *Priority:* ${escapeMarkdownV2(priorityLabel)}`,
      `📊 *Urgency:* ${scoreText}`,
      `${barText}`,
      ``,
      `💡 *AI Analysis:*`,
      explanation,
    ];

    if (payload.actionItems && payload.actionItems.length > 0) {
      message.push(``, `🎯 *Action Required*`);
      payload.actionItems.forEach(item => {
        message.push(`• ${escapeMarkdownV2(item)}`);
      });
    }

    if (payload.deadline) {
      message.push(``, `⏳ *Due:* ${escapeMarkdownV2(payload.deadline)}`);
    }

    if (payload.smartDraftGenerated) {
      message.push(``, `📝 *A Smart Draft reply has been automatically saved to your Gmail Drafts folder\\.*`);
    }

    message.push(
      ``,
      `\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_`,
      `_Powered by Inbox Sentinel_`
    );

    const finalMessage = message.join("\n");

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const sendRequest = async () => {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: finalMessage,
          parse_mode: "MarkdownV2",
          disable_web_page_preview: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg = data.description || response.statusText;
        const err = new Error(`Telegram API Error: ${errMsg}`);
        (err as any).status = response.status;
        if (data.parameters?.retry_after) {
          (err as any).retryAfter = data.parameters.retry_after;
        }
        throw err;
      }

      return data;
    };

    try {
      const data = await withRetry(sendRequest);

      if (data.ok && data.result?.message_id) {
        const messageId = String(data.result.message_id);
        logger.info(`[TELEGRAM_ADAPTER] Message sent. chat_id=${chatId} message_id=${messageId}`);
        return messageId;
      }

      throw new Error("No message_id returned from Telegram");
    } catch (error) {
      logger.error({ err: error }, "[TELEGRAM_ADAPTER] Dispatch Failed");
      throw error;
    }
  }
}
