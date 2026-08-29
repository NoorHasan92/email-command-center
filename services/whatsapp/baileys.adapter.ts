import { INotificationProvider, NotificationPayload } from "../../core/interfaces/INotificationProvider";
import { whatsappManager } from "./manager";
import { logger } from "@/lib/logger";

export class BaileysAdapter implements INotificationProvider {
    constructor(private userId: string) {}

    async dispatch(payload: NotificationPayload): Promise<string> {
        let sock = whatsappManager.getSocket(this.userId);
        
        if (!sock || !sock.user) {
            logger.info(`[BaileysAdapter] Socket missing or not fully connected for user ${this.userId}. Attempting to connect...`);
            await whatsappManager.connect(this.userId);
            
            // Wait up to 10 seconds for the connection to establish
            let connected = false;
            for (let i = 0; i < 20; i++) {
                await new Promise(r => setTimeout(r, 500));
                sock = whatsappManager.getSocket(this.userId);
                if (sock && sock.user) {
                    connected = true;
                    break;
                }
            }

            if (!connected) {
                throw new Error("[BaileysAdapter] Socket not found or failed to connect within timeout.");
            }
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
            if (!sock) throw new Error("[BaileysAdapter] Socket is still undefined");
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

    async dispatchDigest(payload: import("../../core/interfaces/INotificationProvider").DigestPayload): Promise<string> {
        let sock = whatsappManager.getSocket(this.userId);
        if (!sock || !sock.user) {
            throw new Error("[BaileysAdapter] Socket missing or not fully connected for user");
        }

        const to = payload.destination.replace(/\D/g, "") + "@s.whatsapp.net";

        const text = `📬 *Your Inbox Sentinel Summary*
━━━━━━━━━━━━━━
*Today:*
• ${payload.importantCount} important emails
• ${payload.actionItemsCount} action items
• ${payload.deadlinesCount} deadlines

Open Inbox Sentinel to review.
mail.tars.homes`;

        try {
            const result = await sock.sendMessage(to, { text });
            if (!result?.key?.id) throw new Error("Message failed to send");
            logger.info(`[BaileysAdapter] Sent digest to ${to}`);
            return result.key.id;
        } catch (error) {
            logger.error(error, `[BaileysAdapter] Digest Dispatch Failed:`);
            throw error;
        }
    }

    async dispatchDeadlineReminder(payload: import("../../core/interfaces/INotificationProvider").DeadlineReminderPayload): Promise<string> {
        let sock = whatsappManager.getSocket(this.userId);
        if (!sock || !sock.user) {
            throw new Error("[BaileysAdapter] Socket missing or not fully connected for user");
        }

        const to = payload.destination.replace(/\D/g, "") + "@s.whatsapp.net";

        const text = `🚨 *Reminder*
━━━━━━━━━━━━━━
${payload.actionItem}

*Due:* ${payload.dueDate}

Don't forget to complete this task.
mail.tars.homes`;

        try {
            const result = await sock.sendMessage(to, { text });
            if (!result?.key?.id) throw new Error("Message failed to send");
            logger.info(`[BaileysAdapter] Sent deadline reminder to ${to}`);
            return result.key.id;
        } catch (error) {
            logger.error(error, `[BaileysAdapter] Deadline Reminder Dispatch Failed:`);
            throw error;
        }
    }

    async sendOTP(phoneNumber: string, code: string): Promise<string> {
        let sock = whatsappManager.getSocket(this.userId);
        
        if (!sock || !sock.user) {
            if (this.userId === 'SYSTEM_SENDER') {
                logger.info("[BaileysAdapter] SYSTEM_SENDER socket missing. Attempting auto-reconnect...");
                await whatsappManager.connect(this.userId);
                
                // Wait up to 8 seconds for the connection to fully establish
                await new Promise<void>((resolve) => {
                    const timeout = setTimeout(() => {
                        whatsappManager.off(`status-${this.userId}`, onStatus);
                        resolve();
                    }, 8000);
                    
                    const onStatus = (data: any) => {
                        if (data.status === 'connected') {
                            clearTimeout(timeout);
                            whatsappManager.off(`status-${this.userId}`, onStatus);
                            resolve();
                        }
                    };
                    
                    whatsappManager.on(`status-${this.userId}`, onStatus);
                });
                
                sock = whatsappManager.getSocket(this.userId);
            }
            
            if (!sock || !sock.user) {
                throw new Error("The system WhatsApp sender is currently reconnecting. Please try again in a few seconds.");
            }
        }

        const to = phoneNumber.replace(/\D/g, "") + "@s.whatsapp.net";

        const text = `🔐 *Inbox Sentinel Verification*
━━━━━━━━━━━━━━
Your verification code is: *${code}*

_This code expires in 5 minutes._
_If you didn't request this, please ignore this message._`;

        try {
            const result = await sock.sendMessage(to, { text });
            if (!result?.key?.id) throw new Error("Message failed to send");
            logger.info(`[BaileysAdapter] Sent OTP to ${to}`);
            return result.key.id;
        } catch (error) {
            logger.error(error, `[BaileysAdapter] OTP Dispatch Failed:`);
            throw error;
        }
    }
}
