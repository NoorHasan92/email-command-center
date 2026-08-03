import {
    AuthenticationCreds,
    AuthenticationState,
    SignalDataTypeMap,
    initAuthCreds,
    BufferJSON
} from '@whiskeysockets/baileys';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '@/lib/logger';

export class FilesystemStore {
    private folder: string;
    private credsFile: string;
    private keysFile: string;
    private metaFile: string;
    private keys: { [type: string]: { [id: string]: any } } = {};
    private creds: AuthenticationCreds | null = null;
    private writeTimer: NodeJS.Timeout | null = null;

    constructor(private userId: string, baseDir: string = './data/whatsapp-sessions') {
        this.folder = path.join(process.cwd(), baseDir, userId);
        this.credsFile = path.join(this.folder, 'creds.json');
        this.keysFile = path.join(this.folder, 'keys.json');
        this.metaFile = path.join(this.folder, 'meta.json');
    }

    private flushKeys() {
        if (this.writeTimer) {
            clearTimeout(this.writeTimer);
        }
        this.writeTimer = setTimeout(async () => {
            try {
                await fs.mkdir(this.folder, { recursive: true });
                await fs.writeFile(this.keysFile, JSON.stringify(this.keys, BufferJSON.replacer));
            } catch (error) {
                logger.error(error, `[FilesystemStore] Error flushing keys for ${this.userId}:`);
            }
        }, 1000);
    }

    async getAuthState(): Promise<{ state: AuthenticationState, saveCreds: () => Promise<void> }> {
        await fs.mkdir(this.folder, { recursive: true });
        
        try {
            const credsData = await fs.readFile(this.credsFile, 'utf-8');
            this.creds = JSON.parse(credsData, BufferJSON.reviver);
        } catch {
            this.creds = initAuthCreds();
        }

        try {
            const keysData = await fs.readFile(this.keysFile, 'utf-8');
            this.keys = JSON.parse(keysData, BufferJSON.reviver);
        } catch {
            this.keys = {};
        }

        const saveCreds = async () => {
            if (!this.creds) return;
            await fs.mkdir(this.folder, { recursive: true });
            await fs.writeFile(this.credsFile, JSON.stringify(this.creds, BufferJSON.replacer));
        };

        const state: AuthenticationState = {
            creds: this.creds!,
            keys: {
                get: async (type, ids) => {
                    const data: { [id: string]: any } = {};
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
                        for (const id in data[category as keyof SignalDataTypeMap]) {
                            const val = data[category as keyof SignalDataTypeMap]?.[id];
                            this.keys[category] = this.keys[category] || {};
                            if (val) {
                                this.keys[category][id] = val;
                                changed = true;
                            } else {
                                if (this.keys[category][id]) {
                                    delete this.keys[category][id];
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
            const data = await fs.readFile(this.metaFile, 'utf-8');
            return JSON.parse(data);
        } catch {
            return null;
        }
    }

    async saveMetadata(data: any) {
        await fs.mkdir(this.folder, { recursive: true });
        await fs.writeFile(this.metaFile, JSON.stringify(data, null, 2));
    }

    async clear() {
        try {
            await fs.rm(this.folder, { recursive: true, force: true });
        } catch (e) {
            logger.warn(`[FilesystemStore] Could not clear folder for ${this.userId}`);
        }
    }
}
