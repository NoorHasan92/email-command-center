import { INotificationProvider, NotificationPayload } from "../../core/interfaces/INotificationProvider";
import { whatsappManager } from "./manager";
import { logger } from "@/lib/logger";

export class BaileysAdapter implements INotificationProvider {
    constructor(private userId: string) {}

    async dispatch(payload: NotificationPayload): Promise<string> {
        const sock = await whatsappManager.ensureConnected(this.userId, 15000);
        const to = payload.destination.replace(/\D/g, "") + "@s.whatsapp.net";

        let text = `📬 *Inbox Sentinel*
━━━━━━━━━━━━━━
🚨 *${payload.actionRequired ? 'Action Required' : 'High Priority Email'}*

*Subject:*
${payload.subject}

━━━━━━━━━━━━━━
*Summary*
${payload.explanation}`;

        if (payload.actionItems && payload.actionItems.length > 0) {
            text += `\n\n🎯 *Action Required*`;
            payload.actionItems.forEach(item => {
                text += `\n• ${item}`;
            });
        }

        if (payload.deadline) {
            text += `\n\n⏳ *Due:* ${payload.deadline}`;
        }

        if (payload.smartDraftGenerated) {
            text += `\n\n📝 *A Smart Draft reply has been automatically saved to your Gmail Drafts folder.*`;
        }

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
        const sock = await whatsappManager.ensureConnected(this.userId, 15000);
        const to = payload.destination.replace(/\D/g, "") + "@s.whatsapp.net";

        let text = `📬 *Your Inbox Sentinel Summary*
━━━━━━━━━━━━━━
*Today's Activity:*
• ${payload.importantCount} important emails
• ${payload.actionItemsCount} action items
• ${payload.deadlinesCount} deadlines`;

        if (payload.deadlinesList && payload.deadlinesList.length > 0) {
            text += `\n\n⏳ *Upcoming Deadlines:*`;
            payload.deadlinesList.forEach(d => {
                text += `\n• ${d.task} (Due: ${d.due})`;
            });
        }

        if (payload.actionItemsList && payload.actionItemsList.length > 0) {
            text += `\n\n🎯 *Pending Actions:*`;
            const items = payload.actionItemsList.slice(0, 5);
            items.forEach(a => {
                text += `\n• ${a}`;
            });
            if (payload.actionItemsList.length > 5) {
                text += `\n• ...and ${payload.actionItemsList.length - 5} more.`;
            }
        }

        text += `\n\nOpen Inbox Sentinel to review.\nmail.tars.homes`;

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
        const sock = await whatsappManager.ensureConnected(this.userId, 15000);
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
        const sock = await whatsappManager.ensureConnected(this.userId, 20000);
        const to = phoneNumber.replace(/\D/g, "") + "@s.whatsapp.net";

        const text = `🔐 *Inbox Sentinel Verification*
━━━━━━━━━━━━━━
Your verification code is: *${code}*

_This code expires in 5 minutes._
_If you didn't request this, please ignore this message._`;

        let lastError: any = null;
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const activeSock = (attempt === 0) ? sock : await whatsappManager.ensureConnected(this.userId, 20000);
                const result = await activeSock.sendMessage(to, { text });
                if (!result?.key?.id) throw new Error("Message failed to send");
                logger.info(`[BaileysAdapter] Sent OTP to ${to}`);
                return result.key.id;
            } catch (error: any) {
                lastError = error;
                logger.warn(`[BaileysAdapter] OTP send attempt ${attempt + 1} failed: ${error?.message}`);
                if (attempt === 0) {
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
        }
        throw lastError;
    }

    async sendMessage(phoneNumber: string, text: string): Promise<string> {
        const sock = await whatsappManager.ensureConnected(this.userId, 20000);
        const to = phoneNumber.replace(/\D/g, "") + "@s.whatsapp.net";

        let lastError: any = null;
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const activeSock = (attempt === 0) ? sock : await whatsappManager.ensureConnected(this.userId, 20000);
                const result = await activeSock.sendMessage(to, { text });
                if (!result?.key?.id) throw new Error("Message failed to send");
                logger.info(`[BaileysAdapter] Sent message to ${to}`);
                return result.key.id;
            } catch (error: any) {
                lastError = error;
                logger.warn(`[BaileysAdapter] Send message attempt ${attempt + 1} failed: ${error?.message}`);
                if (attempt === 0) {
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
        }
        throw lastError;
    }
}

