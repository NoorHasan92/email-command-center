import { google, gmail_v1 } from "googleapis";
import { db } from "@/server/repositories/db";
import { IEmailProvider, StandardizedEmail } from "../../core/interfaces/IEmailProvider";
import { logger } from "@/lib/logger";
import { encrypt, decrypt } from "@/services/security/encryption";


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

  private getOAuth2Client() {
    return new google.auth.OAuth2(
      process.env.AUTH_GOOGLE_ID,
      process.env.AUTH_GOOGLE_SECRET,
      process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google` : "http://localhost:3000/api/auth/callback/google"
    );
  }

  private async getCredentials(emailAccountId: string) {
    const account = await db.emailAccount.findUnique({
      where: { id: emailAccountId }
    });

    if (!account) {
      throw new Error(`EmailAccount not found: ${emailAccountId}`);
    }

    const decryptedAccess = account.accessToken ? decrypt(account.accessToken) : null;
    const decryptedRefresh = account.refreshToken ? decrypt(account.refreshToken) : null;

    // Temporary debug logging per requirements
    if (process.env.NODE_ENV === "development") {
      const now = Date.now();
      const expiresMs = account.expiresAt ? account.expiresAt * 1000 : 0;
      logger.info(`[GMAIL_DEBUG] Has access token: ${!!account.accessToken}`);
      logger.info(`[GMAIL_DEBUG] Has refresh token: ${!!account.refreshToken}`);
      logger.info(`[GMAIL_DEBUG] Access token decrypted: ${!!decryptedAccess}`);
      logger.info(`[GMAIL_DEBUG] Refresh token decrypted: ${!!decryptedRefresh}`);
      logger.info(`[GMAIL_DEBUG] Token expiry: ${new Date(expiresMs).toISOString()}`);
      logger.info(`[GMAIL_DEBUG] Token expired?: ${expiresMs < now}`);
    }

    return {
      account,
      credentials: {
        access_token: decryptedAccess as string,
        refresh_token: decryptedRefresh as string | undefined,
        expiry_date: account.expiresAt ? account.expiresAt * 1000 : undefined,
      }
    };
  }

  private async persistTokens(emailAccountId: string, tokens: any, existingAccount: any) {
    const newAccessToken = tokens.access_token ? encrypt(tokens.access_token) : existingAccount.accessToken;
    // CRITICAL: Preserve existing refresh token if Google didn't send a new one
    const newRefreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : existingAccount.refreshToken;
    const newExpiresAt = tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : existingAccount.expiresAt;

    await db.emailAccount.update({
      where: { id: emailAccountId },
      data: {
        accessToken: newAccessToken as string,
        refreshToken: newRefreshToken as string | null,
        expiresAt: newExpiresAt,
      }
    });

    if (process.env.NODE_ENV === "development") {
      logger.info(`[GMAIL_DEBUG] Refresh succeeded? YES`);
    }
  }

  private async getGmailClient(emailAccountId: string) {
    const { account, credentials } = await this.getCredentials(emailAccountId);
    
    // Instantiate a NEW client per request to prevent listener accumulation (memory leak)
    const oauth2Client = this.getOAuth2Client();
    oauth2Client.setCredentials(credentials);

    oauth2Client.on("tokens", async (tokens) => {
      if (process.env.NODE_ENV === "development") {
        logger.info(`[GMAIL_DEBUG] Automatic refresh triggered? YES`);
      }
      if (tokens.refresh_token || tokens.access_token) {
        logger.info(`[GMAIL_ADAPTER] Updating refreshed tokens securely for account: ${emailAccountId}`);
        await this.persistTokens(emailAccountId, tokens, account);
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
      logger.error({ err: error }, `[GMAIL_ADAPTER] Failed to register webhook for ${emailAccountId}`);
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
      logger.error({ err: error }, `[GMAIL_ADAPTER] Failed to stop watch for ${emailAccountId}`);
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
      logger.error({ err: error }, `[GMAIL_ADAPTER] Sync failed for ${emailAccountId}`);
      
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

      // 1. Message Fetch Log
      logger.info(`Fetched Gmail message: ${messageId}`);

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
      
      const extractParts = (part: any) => {
        if (part.mimeType === "text/plain" && part.body?.data) {
          plainText += Buffer.from(part.body.data, "base64url").toString("utf8") + "\n";
        } else if (part.mimeType === "text/html" && part.body?.data) {
          htmlBody += Buffer.from(part.body.data, "base64url").toString("utf8") + "\n";
        }
        if (part.parts) {
          part.parts.forEach(extractParts);
        }
      };

      if (payload) {
        extractParts(payload);
      }
      
      // Fallback for extremely simple emails without parts
      if (!plainText && !htmlBody && payload?.body?.data) {
        const decoded = Buffer.from(payload.body.data, "base64url").toString("utf8");
        if (payload.mimeType === "text/html") htmlBody = decoded;
        else plainText = decoded;
      }

      const standardizedEmail = {
        providerMessageId: messageId,
        threadId: res.data.threadId || undefined,
        subject,
        from,
        to,
        date,
        plainText,
        htmlBody,
      };

      // 2. Normalization Log
      logger.info(`Normalized email\nsubject: ${standardizedEmail.subject}\nfrom: ${standardizedEmail.from}\nthreadId: ${standardizedEmail.threadId}\nmessageId: ${standardizedEmail.providerMessageId}`);

      return standardizedEmail;
    } catch (error) {
      logger.error({ err: error }, `[GMAIL_ADAPTER] Failed to fetch message ${messageId}`);
      return null;
    }
  }
}
