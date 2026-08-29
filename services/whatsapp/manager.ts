import makeWASocket, { DisconnectReason, ConnectionState, Browsers } from '@whiskeysockets/baileys';
import { DatabaseStore } from './session-store/DatabaseStore';
import { logger } from '@/lib/logger';
import { EventEmitter } from 'events';
import { db } from '@/server/repositories/db';
import pino from 'pino';

export class WhatsAppManager extends EventEmitter {
    private sockets: Map<string, ReturnType<typeof makeWASocket>> = new Map();
    private connectionTimeouts: Map<string, NodeJS.Timeout> = new Map();

    async connect(userId: string) {
        if (this.sockets.has(userId)) return;

        const store = new DatabaseStore(userId);
        const { state, saveCreds } = await store.getAuthState();

        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            browser: Browsers.macOS('Chrome'),
            logger: pino({ level: 'silent' }) as any
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                this.emit(`qr-${userId}`, qr);
                
                if (this.connectionTimeouts.has(userId)) clearTimeout(this.connectionTimeouts.get(userId)!);
                this.connectionTimeouts.set(userId, setTimeout(() => {
                    logger.info(`[WhatsAppManager] QR timeout for ${userId}, regenerating`);
                    this.disconnect(userId, false); // close socket but keep session to retry
                    this.connect(userId);
                }, 60000));
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
                logger.info(`[WhatsAppManager] Connection closed for ${userId}, reconnecting: ${shouldReconnect}`);
                
                if (this.connectionTimeouts.has(userId)) {
                    clearTimeout(this.connectionTimeouts.get(userId)!);
                    this.connectionTimeouts.delete(userId);
                }

                this.sockets.delete(userId);

                if (shouldReconnect) {
                    setTimeout(() => this.connect(userId), 5000);
                } else {
                    await store.clear();
                    this.emit(`status-${userId}`, { status: 'logged_out' });
                    if (userId !== 'SYSTEM_SENDER') {
                        try {
                            await db.user.update({ where: { id: userId }, data: { whatsappOptIn: false } });
                        } catch (e) {
                            logger.warn(`[WhatsAppManager] Failed to update user opt-out: ${e}`);
                        }
                    }
                }
            } else if (connection === 'open') {
                logger.info(`[WhatsAppManager] Connection opened for ${userId}`);
                if (this.connectionTimeouts.has(userId)) {
                    clearTimeout(this.connectionTimeouts.get(userId)!);
                    this.connectionTimeouts.delete(userId);
                }
                
                const me = sock.user;
                if (me) {
                    const jid = me.id || '';
                    const phoneNumber = jid.split(':')[0].split('@')[0];
                    const platform = jid.includes(':') ? 'Linked Device' : 'Primary Device';
                    
                    if (userId !== 'SYSTEM_SENDER') {
                        try {
                            await db.user.update({
                                where: { id: userId },
                                data: { phoneNumber: `+${phoneNumber}`, whatsappOptIn: true }
                            });
                        } catch (e) {
                            logger.warn(`[WhatsAppManager] Failed to update user opt-in: ${e}`);
                        }
                    }

                    await store.saveMetadata({
                        phoneNumber: `+${phoneNumber}`,
                        deviceName: me.name || 'WhatsApp Web',
                        platform: platform,
                        lastConnected: new Date().toISOString(),
                        connectedAt: new Date().toISOString()
                    });
                }
                
                this.emit(`status-${userId}`, { status: 'connected' });
            }
        });

        this.sockets.set(userId, sock);
    }

    getSocket(userId: string) {
        return this.sockets.get(userId);
    }
    
    async disconnect(userId: string, logout = true) {
        const sock = this.sockets.get(userId);
        if (sock) {
            if (logout) {
                try { await sock.logout(); } catch (e) {}
            } else {
                sock.end(undefined);
            }
            this.sockets.delete(userId);
        }
        if (logout) {
            const store = new DatabaseStore(userId);
            await store.clear();
        }
    }
}

const globalForManager = global as unknown as { whatsappManager: WhatsAppManager };
export const whatsappManager = globalForManager.whatsappManager || new WhatsAppManager();
if (process.env.NODE_ENV !== 'production') globalForManager.whatsappManager = whatsappManager;
