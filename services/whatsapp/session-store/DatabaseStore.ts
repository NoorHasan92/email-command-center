import {
    AuthenticationCreds,
    AuthenticationState,
    SignalDataTypeMap,
    initAuthCreds,
    BufferJSON
} from '@whiskeysockets/baileys';
import { db } from '@/server/repositories/db';
import { logger } from '@/lib/logger';

export class DatabaseStore {
    private creds: AuthenticationCreds | null = null;
    private writeTimer: NodeJS.Timeout | null = null;
    private keys: { [type: string]: { [id: string]: any } } = {};
    private dirtyKeys: { [type: string]: Set<string> } = {};

    constructor(private userId: string, private sessionId: string = "default") {}

    private flushKeys() {
        if (this.writeTimer) {
            clearTimeout(this.writeTimer);
        }
        this.writeTimer = setTimeout(async () => {
            try {
                const upserts = [];
                const deletes = [];
                
                for (const type of Object.keys(this.dirtyKeys)) {
                    for (const id of this.dirtyKeys[type]) {
                        const val = this.keys[type]?.[id];
                        if (val) {
                            upserts.push(
                                db.whatsAppSession.upsert({
                                    where: {
                                        userId_sessionId_category_key: {
                                            userId: this.userId,
                                            sessionId: this.sessionId,
                                            category: type,
                                            key: id
                                        }
                                    },
                                    create: {
                                        userId: this.userId,
                                        sessionId: this.sessionId,
                                        category: type,
                                        key: id,
                                        data: JSON.stringify(val, BufferJSON.replacer)
                                    },
                                    update: {
                                        data: JSON.stringify(val, BufferJSON.replacer)
                                    }
                                })
                            );
                        } else {
                            deletes.push(
                                db.whatsAppSession.deleteMany({
                                    where: {
                                        userId: this.userId,
                                        sessionId: this.sessionId,
                                        category: type,
                                        key: id
                                    }
                                })
                            );
                        }
                    }
                    this.dirtyKeys[type].clear();
                }

                if (upserts.length > 0 || deletes.length > 0) {
                    await db.$transaction([...upserts, ...deletes]);
                }
            } catch (error) {
                logger.error(error, `[DatabaseStore] Error flushing keys for ${this.userId}:`);
            }
        }, 2000);
    }

    async getAuthState(): Promise<{ state: AuthenticationState, saveCreds: () => Promise<void> }> {
        // Load creds
        try {
            const credsRow = await db.whatsAppSession.findUnique({
                where: {
                    userId_sessionId_category_key: {
                        userId: this.userId,
                        sessionId: this.sessionId,
                        category: "creds",
                        key: "creds"
                    }
                }
            });
            
            if (credsRow) {
                this.creds = JSON.parse(credsRow.data, BufferJSON.reviver);
            } else {
                this.creds = initAuthCreds();
            }
        } catch (e) {
            this.creds = initAuthCreds();
        }

        const saveCreds = async () => {
            if (!this.creds) return;
            try {
                await db.whatsAppSession.upsert({
                    where: {
                        userId_sessionId_category_key: {
                            userId: this.userId,
                            sessionId: this.sessionId,
                            category: "creds",
                            key: "creds"
                        }
                    },
                    create: {
                        userId: this.userId,
                        sessionId: this.sessionId,
                        category: "creds",
                        key: "creds",
                        data: JSON.stringify(this.creds, BufferJSON.replacer)
                    },
                    update: {
                        data: JSON.stringify(this.creds, BufferJSON.replacer)
                    }
                });
            } catch (e) {
                logger.error(e, `[DatabaseStore] Failed to save creds for ${this.userId}`);
            }
        };

        const state: AuthenticationState = {
            creds: this.creds!,
            keys: {
                get: async (type, ids) => {
                    const data: { [id: string]: any } = {};
                    
                    // Fetch all requested keys from DB
                    const rows = await db.whatsAppSession.findMany({
                        where: {
                            userId: this.userId,
                            sessionId: this.sessionId,
                            category: type,
                            key: { in: ids }
                        }
                    });

                    // Cache them in memory to prevent duplicate reads and simplify updates
                    this.keys[type] = this.keys[type] || {};
                    for (const row of rows) {
                        this.keys[type][row.key] = JSON.parse(row.data, BufferJSON.reviver);
                    }

                    for (const id of ids) {
                        let val = this.keys[type]?.[id];
                        if (val) {
                            if (type === 'app-state-sync-key') {
                                val = { ...val, keyData: val.keyData };
                            }
                            data[id] = val;
                        }
                    }
                    return data;
                },
                set: async (data) => {
                    let changed = false;
                    for (const category in data) {
                        this.keys[category] = this.keys[category] || {};
                        this.dirtyKeys[category] = this.dirtyKeys[category] || new Set();

                        for (const id in data[category as keyof SignalDataTypeMap]) {
                            const val = data[category as keyof SignalDataTypeMap]?.[id];
                            
                            if (val) {
                                this.keys[category][id] = val;
                                this.dirtyKeys[category].add(id);
                                changed = true;
                            } else {
                                if (this.keys[category][id]) {
                                    delete this.keys[category][id];
                                    this.dirtyKeys[category].add(id);
                                    changed = true;
                                }
                            }
                        }
                    }
                    if (changed) {
                        this.flushKeys();
                    }
                }
            }
        };

        return { state, saveCreds };
    }

    async getMetadata(): Promise<{
        phoneNumber?: string;
        deviceName?: string;
        platform?: string;
        lastConnected?: string;
        connectedAt?: string;
    } | null> {
        try {
            const metaRow = await db.whatsAppSession.findUnique({
                where: {
                    userId_sessionId_category_key: {
                        userId: this.userId,
                        sessionId: this.sessionId,
                        category: "meta",
                        key: "meta"
                    }
                }
            });
            if (metaRow) {
                return JSON.parse(metaRow.data);
            }
            return null;
        } catch {
            return null;
        }
    }

    async saveMetadata(data: any) {
        try {
            await db.whatsAppSession.upsert({
                where: {
                    userId_sessionId_category_key: {
                        userId: this.userId,
                        sessionId: this.sessionId,
                        category: "meta",
                        key: "meta"
                    }
                },
                create: {
                    userId: this.userId,
                    sessionId: this.sessionId,
                    category: "meta",
                    key: "meta",
                    data: JSON.stringify(data)
                },
                update: {
                    data: JSON.stringify(data)
                }
            });
        } catch (e) {
            logger.error(e, `[DatabaseStore] Failed to save metadata for ${this.userId}`);
        }
    }

    async clear() {
        try {
            if (this.writeTimer) clearTimeout(this.writeTimer);
            await db.whatsAppSession.deleteMany({
                where: {
                    userId: this.userId,
                    sessionId: this.sessionId
                }
            });
            this.keys = {};
            this.dirtyKeys = {};
            this.creds = null;
        } catch (e) {
            logger.warn(`[DatabaseStore] Could not clear sessions for ${this.userId}`);
        }
    }
}
