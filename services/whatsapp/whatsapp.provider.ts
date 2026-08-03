import { INotificationProvider, NotificationPayload } from "../../core/interfaces/INotificationProvider";
import { WhatsAppAdapter as MetaAdapter } from "./whatsapp.adapter";
import { BaileysAdapter } from "./baileys.adapter";
import { DatabaseStore } from "./session-store/DatabaseStore";
import { logger } from "@/lib/logger";
import { NotificationConfig } from "@/config/notifications";

export class WhatsAppProvider implements INotificationProvider {
    constructor(private userId: string) {}

    async dispatch(payload: NotificationPayload): Promise<string> {
        const priorities = NotificationConfig.priorities.WHATSAPP;
        const errors: any[] = [];

        for (const provider of priorities) {
            try {
                if (provider === 'BAILEYS') {
                    const store = new DatabaseStore(this.userId);
                    const meta = await store.getMetadata();
                    if (meta?.phoneNumber) {
                        const adapter = new BaileysAdapter(this.userId);
                        return await adapter.dispatch(payload);
                    } else {
                        throw new Error("Baileys not configured for this user");
                    }
                }

                if (provider === 'META') {
                    const adapter = new MetaAdapter();
                    return await adapter.dispatch(payload);
                }
            } catch (error) {
                logger.warn(`[WhatsAppProvider] ${provider} dispatch failed for user ${this.userId}. Error: ${(error as any).message}`);
                errors.push(error);
                continue; // Try next provider
            }
        }

        throw new Error(`All WhatsApp providers failed. Errors: ${errors.map(e => e.message).join(', ')}`);
    }
}
