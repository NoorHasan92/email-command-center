import { google, gmail_v1 } from "googleapis";
import { db } from "@/server/repositories/db";
import { IEmailProvider, StandardizedEmail } from "../../core/interfaces/IEmailProvider";
import { logger } from "@/lib/logger";


const oauth2Client = new google.auth.OAuth2(
  process.env.AUTH_GOOGLE_ID,
  process.env.AUTH_GOOGLE_SECRET,
  process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google` : "http://localhost:3000/api/auth/callback/google"
);

// Utility for Exponential Backoff on rate limits
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      if (error.code === 429 || error.code === 503) {
        attempt++;
        const delayMs = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        logger.warn(`[GMAIL_ADAPTER] Rate limit hit (code ${error.code}). Retrying in ${Math.round(delayMs)}ms... (Attempt ${attempt}/${maxRetries})`);
        await new Promise(r => setTimeout(r, delayMs));
      } else {
        throw error;
      }
    }
  }
  throw new Error(`[GMAIL_ADAPTER] Operation failed after ${maxRetries} retries.`);
}

export class GmailAdapter implements IEmailProvider {
  private async getGmailClient(emailAccountId: string) {
    const account = await db.emailAccount.findUnique({
      where: { id: emailAccountId }
    });

    if (!account) {
      throw new Error(`EmailAccount not found: ${emailAccountId}`);
    }

    oauth2Client.setCredentials({
      access_token: account.accessToken,
      refresh_token: account.refreshToken,
      expiry_date: account.expiresAt ? account.expiresAt * 1000 : undefined,
    });

    oauth2Client.on("tokens", async (tokens) => {
      if (tokens.refresh_token || tokens.access_token) {
        logger.info(`[GMAIL_ADAPTER] Updating refreshed tokens for account: ${emailAccountId}`);
        await db.emailAccount.update({
          where: { id: emailAccountId },
          data: {
            accessToken: tokens.access_token || account.accessToken,
            refreshToken: tokens.refresh_token || account.refreshToken,
            expiresAt: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : undefined,
          }
        });
      }
    });

    return google.gmail({ version: "v1", auth: oauth2Client });
  }

  async registerWebhook(emailAccountId: string): Promise<boolean> {
    const gmail = await this.getGmailClient(emailAccountId);
    
    if (!process.env.GMAIL_PUBSUB_TOPIC) {
      logger.warn("[GMAIL_ADAPTER] GMAIL_PUBSUB_TOPIC not defined. Skipping watch registration.");
      return false;
    }

    try {
      const response = await withRetry(() => gmail.users.watch({
        userId: "me",
        requestBody: {
          labelIds: ["INBOX", "SPAM"], 
          labelFilterAction: "include",
          topicName: process.env.GMAIL_PUBSUB_TOPIC, 
        }
      }));

      const newHistoryId = response.data.historyId;
      const watchExpiration = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000); 

      await db.emailAccount.update({
        where: { id: emailAccountId },
        data: {
          lastHistoryId: newHistoryId,
          watchExpiration,
          syncStatus: "ACTIVE",
        }
      });

      logger.info(`[GMAIL_ADAPTER] Webhook registered for ${emailAccountId}. History ID: ${newHistoryId}`);
      return true;
    } catch (error) {
      logger.error(`[GMAIL_ADAPTER] Failed to register webhook for ${emailAccountId}:`, error);
      await db.emailAccount.update({
        where: { id: emailAccountId },
        data: { syncStatus: "ERROR" }
      });
      return false;
    }
  }

  async renewWebhook(emailAccountId: string): Promise<boolean> {
    return this.registerWebhook(emailAccountId);
  }

  async disconnect(emailAccountId: string): Promise<boolean> {
    const gmail = await this.getGmailClient(emailAccountId);
    try {
      await withRetry(() => gmail.users.stop({ userId: "me" }));
      await db.emailAccount.update({
        where: { id: emailAccountId },
        data: { syncStatus: "EXPIRED", watchExpiration: null }
      });
      return true;
    } catch (error) {
      logger.error(`[GMAIL_ADAPTER] Failed to stop watch for ${emailAccountId}:`, error);
      return false;
    }
  }

  async syncAccount(emailAccountId: string): Promise<StandardizedEmail[]> {
    const startTime = Date.now();
    await db.emailAccount.update({
      where: { id: emailAccountId },
      data: { lastSyncStartedAt: new Date(), lastSyncError: null }
    });

    try {
      const account = await db.emailAccount.findUnique({ where: { id: emailAccountId } });
      if (!account) return [];

      const gmail = await this.getGmailClient(emailAccountId);
      const messagesToFetch = new Set<string>();
      let newHistoryId = account.lastHistoryId;
      let newPageToken = account.nextPageToken;

      if (!account.lastHistoryId || newPageToken) {
        // Initial Sync (Resumable)
        logger.info(`[GMAIL_ADAPTER] Performing Initial Sync for ${emailAccountId}`);
        const res = await withRetry(() => gmail.users.messages.list({
          userId: "me",
          labelIds: ["INBOX", "SPAM"],
          maxResults: 50, // Resumable/incremental chunk
          pageToken: newPageToken || undefined,
        }));
        
        if (res.data.messages) {
          res.data.messages.forEach(m => {
            if (m.id) messagesToFetch.add(m.id);
          });
        }
        
        newPageToken = res.data.nextPageToken || null;
        
        // If this is the last page, we can finally mark a starting historyId
        if (!newPageToken) {
          const profile = await withRetry(() => gmail.users.getProfile({ userId: "me" }));
          newHistoryId = profile.data.historyId?.toString() || null;
        }
      } else {
        // Incremental Sync
        logger.info(`[GMAIL_ADAPTER] Performing Incremental Sync for ${emailAccountId} from History ID: ${account.lastHistoryId}`);
        const res = await withRetry(() => gmail.users.history.list({
          userId: "me",
          startHistoryId: account.lastHistoryId as string,
          historyTypes: ["messageAdded"],
        }));

        if (res.data.history) {
          res.data.history.forEach(historyItem => {
            if (historyItem.messagesAdded) {
              historyItem.messagesAdded.forEach(ma => {
                const skip = ma.message?.labelIds?.some(l => ["DRAFT", "TRASH", "SENT"].includes(l));
                if (!skip && ma.message?.id) {
                  messagesToFetch.add(ma.message.id);
                }
              });
            }
          });
        }
        newHistoryId = res.data.historyId || newHistoryId;
      }

      const newEmails: StandardizedEmail[] = [];
      for (const msgId of Array.from(messagesToFetch)) {
        const fullEmail = await this.fetchMessage(emailAccountId, msgId, gmail);
        if (fullEmail) newEmails.push(fullEmail);
      }

      const endTime = Date.now();

      await db.emailAccount.update({
        where: { id: emailAccountId },
        data: {
          lastHistoryId: newHistoryId,
          nextPageToken: newPageToken,
          lastSyncedAt: new Date(),
          lastSyncCompletedAt: new Date(),
          lastSyncDurationMs: endTime - startTime,
          syncStatus: "ACTIVE",
          totalEmailsSynced: { increment: newEmails.length }
        }
      });

      return newEmails;

    } catch (error: any) {
      logger.error(`[GMAIL_ADAPTER] Sync failed for ${emailAccountId}:`, error);
      
      const endTime = Date.now();
      let updateData: any = {
        lastSyncCompletedAt: new Date(),
        lastSyncDurationMs: endTime - startTime,
        lastSyncError: error.message,
      };

      if (error.code === 404 || error.message.includes("historyId")) {
        logger.warn(`[GMAIL_ADAPTER] History ID expired for ${emailAccountId}. Resetting for next run.`);
        updateData.lastHistoryId = null;
        updateData.nextPageToken = null;
      }

      await db.emailAccount.update({
        where: { id: emailAccountId },
        data: updateData
      });

      throw error;
    }
  }

  async fetchMessage(emailAccountId: string, messageId: string, client?: gmail_v1.Gmail): Promise<StandardizedEmail | null> {
    const gmail = client || await this.getGmailClient(emailAccountId);
    
    try {
      const res = await withRetry(() => gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "full"
      }));

      const payload = res.data.payload;
      const headers = payload?.headers;
      
      if (!headers) return null;

      const subject = headers.find(h => h.name?.toLowerCase() === "subject")?.value || "No Subject";
      const from = headers.find(h => h.name?.toLowerCase() === "from")?.value || "Unknown Sender";
      const to = headers.find(h => h.name?.toLowerCase() === "to")?.value || "Unknown Receiver";
      const dateHeader = headers.find(h => h.name?.toLowerCase() === "date")?.value;
      const date = dateHeader ? new Date(dateHeader) : new Date();

      let plainText = "";
      let htmlBody = "";
      
      if (payload?.parts) {
        const textPart = payload.parts.find(p => p.mimeType === "text/plain");
        const htmlPart = payload.parts.find(p => p.mimeType === "text/html");
        
        if (textPart?.body?.data) plainText = Buffer.from(textPart.body.data, "base64url").toString("utf8");
        if (htmlPart?.body?.data) htmlBody = Buffer.from(htmlPart.body.data, "base64url").toString("utf8");
      } else if (payload?.body?.data) {
        const decoded = Buffer.from(payload.body.data, "base64url").toString("utf8");
        if (payload.mimeType === "text/html") htmlBody = decoded;
        else plainText = decoded;
      }

      return {
        providerMessageId: messageId,
        threadId: res.data.threadId || undefined,
        subject,
        from,
        to,
        date,
        plainText,
        htmlBody,
      };
    } catch (error) {
      logger.error(`[GMAIL_ADAPTER] Failed to fetch message ${messageId}:`, error);
      return null;
    }
  }
}
