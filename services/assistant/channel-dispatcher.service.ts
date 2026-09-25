import "server-only";
import { logger } from "@/lib/logger";

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export class ChannelDispatcherService {
  /**
   * Dispatches text message to WhatsApp Cloud API within active 24h window.
   */
  static async sendWhatsAppText(phoneNumber: string, text: string): Promise<string | null> {
    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      logger.warn("[CHANNEL_DISPATCHER] WhatsApp credentials not configured");
      return null;
    }

    const cleanNumber = phoneNumber.replace(/\D/g, "");
    const url = `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanNumber,
          type: "text",
          text: { body: text.substring(0, 4000) },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        logger.error(`[CHANNEL_DISPATCHER] WhatsApp send error: ${JSON.stringify(data)}`);
        return null;
      }
      return data.messages?.[0]?.id || null;
    } catch (e: any) {
      logger.error(`[CHANNEL_DISPATCHER] WhatsApp fetch failed: ${e.message}`);
      return null;
    }
  }

  /**
   * Dispatches interactive reply buttons to WhatsApp within 24h window.
   * Gracefully falls back to plain text if interactive messages are rejected.
   */
  static async sendWhatsAppButtons(
    phoneNumber: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<string | null> {
    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      logger.warn("[CHANNEL_DISPATCHER] WhatsApp credentials not configured");
      return null;
    }

    const cleanNumber = phoneNumber.replace(/\D/g, "");
    const url = `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanNumber,
          type: "interactive",
          interactive: {
            type: "button",
            body: { text: bodyText.substring(0, 1024) },
            action: {
              buttons: buttons.slice(0, 3).map((b) => ({
                type: "reply",
                reply: {
                  id: b.id.substring(0, 256),
                  title: b.title.substring(0, 20),
                },
              })),
            },
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        logger.warn(`[CHANNEL_DISPATCHER] WhatsApp buttons rejected, falling back to text: ${JSON.stringify(data)}`);
        return await this.sendWhatsAppText(phoneNumber, bodyText);
      }
      return data.messages?.[0]?.id || null;
    } catch (e: any) {
      logger.error(`[CHANNEL_DISPATCHER] WhatsApp buttons error: ${e.message}`);
      return await this.sendWhatsAppText(phoneNumber, bodyText);
    }
  }

  /**
   * Dispatches message to Telegram chat via Bot API.
   */
  static async sendTelegramText(chatId: string, text: string, replyMarkup?: any): Promise<string | null> {
    if (!TELEGRAM_BOT_TOKEN) {
      logger.warn("[CHANNEL_DISPATCHER] Telegram bot token not configured");
      return null;
    }

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    try {
      const payload: any = {
        chat_id: chatId,
        text: text.substring(0, 4000),
        parse_mode: "Markdown",
      };
      if (replyMarkup) payload.reply_markup = replyMarkup;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        // Fallback without parse_mode if markdown parsing fails
        const retryPayload: any = {
          chat_id: chatId,
          text: text.substring(0, 4000),
        };
        if (replyMarkup) retryPayload.reply_markup = replyMarkup;

        const retryRes = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(retryPayload),
        });
        const retryData = await retryRes.json();
        return retryData.result?.message_id ? String(retryData.result.message_id) : null;
      }

      return data.result?.message_id ? String(data.result.message_id) : null;
    } catch (e: any) {
      logger.error(`[CHANNEL_DISPATCHER] Telegram send failed: ${e.message}`);
      return null;
    }
  }

  /**
   * Answers a Telegram callback query (button tap) to dismiss loading state.
   */
  static async answerTelegramCallback(callbackQueryId: string, text?: string): Promise<boolean> {
    if (!TELEGRAM_BOT_TOKEN) return false;
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
      });
      return true;
    } catch {
      return false;
    }
  }
}
