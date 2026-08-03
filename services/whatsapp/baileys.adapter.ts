import { INotificationProvider, NotificationPayload } from "../../core/interfaces/INotificationProvider";
import { whatsappManager } from "./manager";
import { logger } from "@/lib/logger";

export class BaileysAdapter implements INotificationProvider {
    constructor(private userId: string) {}

    async dispatch(payload: NotificationPayload): Promise<string> {
        const sock = whatsappManager.getSocket(this.userId);
        
        if (!sock || !sock.user) {
            throw new Error("[BaileysAdapter] Socket not found or not fully connected.");
        }

        const to = payload.destination.replace(/\D/g, "") + "@s.whatsapp.net";

        const text = `📬 *Inbox Sentinel*
━━━━━━━━━━━━━━
🚨 *${payload.actionRequired ? 'Action Required' : 'High Priority Email'}*

*Subject:*
${payload.subject}

━━━━━━━━━━━━━━
*Summary*
${payload.explanation}`;

        try {
            const result = await sock.sendMessage(to, { text });
            if (!result?.key?.id) {
                throw new Error("Message failed to send (no key id returned)");
            }
            logger.info(`[BaileysAdapter] Sent message to ${to}`);
            return result.key.id;
        } catch (error) {
            logger.error(error, `[BaileysAdapter] Dispatch Failed:`);
            throw error;
        }
    }
}
