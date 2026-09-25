import "server-only";
import { logger } from "@/lib/logger";
import { markdownToTelegramHtml, stripMarkdown } from "@/services/telegram/format.utils";

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
      const formattedHtml = markdownToTelegramHtml(text);
      const payload: any = {
        chat_id: chatId,
        text: formattedHtml.substring(0, 4096),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      };
      if (replyMarkup) payload.reply_markup = replyMarkup;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        logger.warn(`[CHANNEL_DISPATCHER] Telegram HTML parse failed (${data.description}), falling back to clean plain text`);
        const cleanPlainText = stripMarkdown(text).substring(0, 4096);
        const retryPayload: any = {
          chat_id: chatId,
          text: cleanPlainText,
          disable_web_page_preview: true,
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

  /**
   * Dispatches an onboarding welcome guide to user on Telegram.
   */
  static async sendTelegramWelcome(chatId: string, userName?: string): Promise<boolean> {
    const name = userName ? userName : "there";
    const text = `✅ *Telegram Connected Successfully!* 🛡️

Hey ${name}, your Telegram is now linked to *Inbox Sentinel*!

Here is what you can do directly from this chat:

🚨 *Real-Time Email Alerts*
When an urgent or action-required email arrives, Sentinel alerts you instantly with an AI analysis and an inline *[ 🔎 Deep Research & Cross-Check ]* button for 1-tap verification!

🔎 *Autonomous Deep Research & Grounding*
• *1-Tap Button:* Tap the button on any alert to instantly verify company background and link authenticity against Google Search.
• *Swipe-to-Reply:* Reply to any email alert with *"Research this company"* or *"verify this"*.
• *On-Demand Research:* Send */research* to pick from your recent emails or investigate a query.

📊 *Check Quota & Plan Status*
• Send */status* anytime to view your plan tier, monthly research inquiries used, and remaining credits.

💬 *Natural AI Assistant*
• Ask anything about your emails: *"What are my urgent emails today?"* or ask follow-ups about previous briefings.

❓ *Need Help?*
• Send */help* anytime to display this command guide.`;

    try {
      const res = await this.sendTelegramText(chatId, text);
      return !!res;
    } catch (e: any) {
      logger.error(`[CHANNEL_DISPATCHER] Failed to send Telegram welcome: ${e.message}`);
      return false;
    }
  }

  /**
   * Dispatches an onboarding welcome guide to user on WhatsApp.
   */
  static async sendWhatsAppWelcome(phoneNumber: string, userName?: string): Promise<boolean> {
    const name = userName ? userName : "there";
    const text = `✅ *WhatsApp Connected Successfully!* 🛡️

Hey ${name}, your WhatsApp is now linked to *Inbox Sentinel*!

Here is what you can do directly from this chat:

🚨 *Real-Time Email Alerts*
When an urgent or action-required email arrives, Sentinel alerts you right here with an AI summary, action items, and deadline detection.

🔎 *Autonomous Deep Research & Cross-Check*
• *Swipe-to-Reply:* Simply reply to any email alert with *"Research this company"*, *"verify this"*, or *"deep research"*. Sentinel autonomously cross-checks company registration, link legitimacy, and claims against Google Search.
• *On-Demand Research:* Type *"research"* anytime to pick from your recent emails or specify a topic.

📊 *Check Quota & Plan Status*
• Type */status* or *"status"* to view your current plan, monthly Deep Research inquiries used, and remaining quota.

💬 *Natural AI Assistant*
• Ask anything about your emails: *"Do I have any urgent emails?"* or ask follow-ups about previous investigations.

❓ *Need Help?*
• Type */help* anytime to display this command guide.`;

    // 1. Try Baileys SYSTEM_SENDER if available
    try {
      const { BaileysAdapter } = await import("@/services/whatsapp/baileys.adapter");
      const adapter = new BaileysAdapter("SYSTEM_SENDER");
      await adapter.sendMessage(phoneNumber, text);
      return true;
    } catch {
      // Fall through to Meta Cloud API
    }

    // 2. Try Meta Cloud API
    try {
      const res = await this.sendWhatsAppText(phoneNumber, text);
      return !!res;
    } catch (e: any) {
      logger.error(`[CHANNEL_DISPATCHER] Failed to send WhatsApp welcome: ${e.message}`);
      return false;
    }
  }
}

