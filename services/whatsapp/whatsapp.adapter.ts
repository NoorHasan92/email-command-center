import { INotificationProvider, NotificationPayload } from "../../core/interfaces/INotificationProvider";
import { logger } from "@/lib/logger";


const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

// Utility for Exponential Backoff on rate limits
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      const err = error as any;
      // Catch standard fetch errors or explicit rate limit flags
      if (err.status === 429 || err.status === 503 || err.message.includes("429")) {
        attempt++;
        const delayMs = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        logger.warn(`[WHATSAPP_ADAPTER] Rate limit hit. Retrying in ${Math.round(delayMs)}ms... (Attempt ${attempt}/${maxRetries})`);
        await new Promise(r => setTimeout(r, delayMs));
      } else {
        throw error;
      }
    }
  }
  throw new Error(`[WHATSAPP_ADAPTER] Operation failed after ${maxRetries} retries.`);
}

export class WhatsAppAdapter implements INotificationProvider {
  /**
   * Dispatches a notification to the target channel.
   * Resolves with the `wamid` (providerMessageId) string if successful.
   */
  async dispatch(payload: NotificationPayload): Promise<string> {
    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      throw new Error("[WHATSAPP_ADAPTER] Missing WhatsApp Cloud API credentials in environment.");
    }

    // Clean destination to numbers only
    const to = payload.destination.replace(/\D/g, "");

    const url = `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

    // Strict Utility Template requirement for initiating conversation
    const messageBody = {
      messaging_product: "whatsapp",
      to: to,
      type: "template",
      template: {
        name: "inbox_alert_v1",
        language: {
          code: "en_US",
        },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: payload.subject.substring(0, 60) }, // Limit to prevent rejection
              { type: "text", text: payload.actionRequired ? "Action Required" : "High Priority" },
              { type: "text", text: payload.explanation.substring(0, 500) }
            ]
          }
        ]
      }
    };

    const sendRequest = async () => {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageBody),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errorMsg = errData.error?.message || response.statusText;
        const err = new Error(`WhatsApp API Error: ${errorMsg}`);
        (err as any).status = response.status;
        throw err;
      }

      return response.json();
    };

    try {
      const data = await withRetry(sendRequest);
      
      if (data.messages && data.messages.length > 0) {
        return data.messages[0].id; // The wamid (providerMessageId)
      }
      
      throw new Error("No message ID returned from Meta");
    } catch (error) {
      logger.error({ err: error }, "[WHATSAPP_ADAPTER] Dispatch Failed");
      throw error;
    }
  }
}
