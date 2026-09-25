import makeWASocket, { DisconnectReason, ConnectionState, Browsers } from '@whiskeysockets/baileys';
import { DatabaseStore } from './session-store/DatabaseStore';
import { logger } from '@/lib/logger';
import { EventEmitter } from 'events';
import { db } from '@/server/repositories/db';
import pino from 'pino';

export class WhatsAppManager extends EventEmitter {
    private sockets: Map<string, ReturnType<typeof makeWASocket>> = new Map();
    private connectingPromises: Map<string, Promise<void>> = new Map();
    private connectionTimeouts: Map<string, NodeJS.Timeout> = new Map();
    private reconnectTimeouts: Map<string, NodeJS.Timeout> = new Map();
    private retryCounts: Map<string, number> = new Map();
    private readonly MAX_RETRIES = 5;

    async connect(userId: string): Promise<void> {
        // If an active, authenticated socket already exists, do not recreate
        const existingSock = this.sockets.get(userId);
        if (existingSock && existingSock.user) {
            return;
        }

        // If a connection attempt is currently in-flight for this user, await the existing promise
        if (this.connectingPromises.has(userId)) {
            return this.connectingPromises.get(userId)!;
        }

        const connectPromise = this.initSocket(userId);
        this.connectingPromises.set(userId, connectPromise);

        try {
            await connectPromise;
        } finally {
            this.connectingPromises.delete(userId);
        }
    }

    private async initSocket(userId: string): Promise<void> {
        // Clean up any stale socket before creating a new one
        const oldSock = this.sockets.get(userId);
        if (oldSock) {
            try {
                oldSock.ev.removeAllListeners('connection.update');
                oldSock.ev.removeAllListeners('creds.update');
                oldSock.end(undefined);
            } catch (e) {}
            this.sockets.delete(userId);
        }

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
                    this.connect(userId).catch(e => logger.error(e, `[WhatsAppManager] Error on QR timeout reconnect`));
                }, 60000));
            }

            if (connection === 'close') {
                const boomError = lastDisconnect?.error as any;
                const statusCode = boomError?.output?.statusCode;
                const errorPayload = boomError?.output?.payload;
                const isLoggedOut = statusCode === DisconnectReason.loggedOut;
                const isReplaced = statusCode === DisconnectReason.connectionReplaced;
                const isRestartRequired = statusCode === DisconnectReason.restartRequired;
                
                logger.warn(`[WhatsAppManager] Connection closed for ${userId}. StatusCode: ${statusCode} (${errorPayload?.error || 'Unknown'}), Message: ${boomError?.message || 'No message'}`);
                
                if (this.connectionTimeouts.has(userId)) {
                    clearTimeout(this.connectionTimeouts.get(userId)!);
                    this.connectionTimeouts.delete(userId);
                }

                this.sockets.delete(userId);

                // Case 1: Explicit logout - remove credentials and notify
                if (isLoggedOut) {
                    logger.warn(`[WhatsAppManager] User ${userId} logged out from WhatsApp. Purging session.`);
                    this.retryCounts.delete(userId);
                    await store.clear();
                    this.emit(`status-${userId}`, { status: 'logged_out' });
                    if (userId !== 'SYSTEM_SENDER') {
                        try {
                            await db.user.update({ where: { id: userId }, data: { whatsappOptIn: false } });
                        } catch (e) {
                            logger.warn(`[WhatsAppManager] Failed to update user opt-out: ${e}`);
                        }
                    }
                    return;
                }

                // Case 2: Session replaced by another client/instance - STOP reconnecting to prevent infinite fight
                if (isReplaced) {
                    logger.warn(`[WhatsAppManager] Connection replaced by another session/instance for ${userId}. Halting auto-reconnect to prevent duplicate session collision.`);
                    this.retryCounts.delete(userId);
                    this.emit(`status-${userId}`, { status: 'conflict', message: 'Connection replaced by another active session' });
                    return;
                }

                // Case 3: Restart required by WhatsApp protocol (e.g. after sync or key rotation)
                if (isRestartRequired) {
                    logger.info(`[WhatsAppManager] Restart required for ${userId}. Reconnecting immediately.`);
                    setTimeout(() => this.connect(userId).catch(console.error), 1000);
                    return;
                }

                // Case 4: Temporary network / socket disconnect - exponential backoff with max retry cap
                const currentRetries = this.retryCounts.get(userId) || 0;
                if (currentRetries < this.MAX_RETRIES) {
                    const nextRetry = currentRetries + 1;
                    this.retryCounts.set(userId, nextRetry);
                    const delay = Math.min(30000, Math.round(3000 * Math.pow(1.5, currentRetries)));
                    logger.info(`[WhatsAppManager] Scheduling reconnect #${nextRetry}/${this.MAX_RETRIES} for ${userId} in ${delay}ms`);
                    
                    if (this.reconnectTimeouts.has(userId)) {
                        clearTimeout(this.reconnectTimeouts.get(userId)!);
                    }
                    const timer = setTimeout(() => {
                        this.reconnectTimeouts.delete(userId);
                        this.connect(userId).catch(err => {
                            logger.error(err, `[WhatsAppManager] Reconnection #${nextRetry} failed for ${userId}`);
                        });
                    }, delay);
                    this.reconnectTimeouts.set(userId, timer);
                } else {
                    logger.error(`[WhatsAppManager] Max reconnection attempts (${this.MAX_RETRIES}) reached for ${userId}. Halting auto-reconnect.`);
                    this.emit(`status-${userId}`, { status: 'disconnected', error: 'Max reconnection attempts reached' });
                }
            } else if (connection === 'open') {
                logger.info(`[WhatsAppManager] Connection opened for ${userId}`);
                
                // Reset retry counters and timers upon successful connection
                this.retryCounts.delete(userId);
                if (this.reconnectTimeouts.has(userId)) {
                    clearTimeout(this.reconnectTimeouts.get(userId)!);
                    this.reconnectTimeouts.delete(userId);
                }
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
        // Clear all timers and counters
        if (this.reconnectTimeouts.has(userId)) {
            clearTimeout(this.reconnectTimeouts.get(userId)!);
            this.reconnectTimeouts.delete(userId);
        }
        if (this.connectionTimeouts.has(userId)) {
            clearTimeout(this.connectionTimeouts.get(userId)!);
            this.connectionTimeouts.delete(userId);
        }
        this.retryCounts.delete(userId);

        const sock = this.sockets.get(userId);
        if (sock) {
            sock.ev.removeAllListeners('connection.update');
            sock.ev.removeAllListeners('creds.update');
            if (logout) {
                try { await sock.logout(); } catch (e) {}
            } else {
                try { sock.end(undefined); } catch (e) {}
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
