// core/interfaces/IEmailProvider.ts
// This file defines the interface for email providers.
// It is used by the pipeline to fetch emails from different providers.

export interface StandardizedEmail {
  providerMessageId: string;
  subject: string;
  from: string;
  to: string;
  date: Date;
  htmlBody: string;
  plainText: string;
  threadId?: string;
  attachments?: { filename: string; mimeType: string; size: number }[];
}

export interface IEmailProvider {
  /**
   * Register a push notification webhook with the provider.
   */
  registerWebhook(emailAccountId: string): Promise<boolean>;

  /**
   * Refresh/renew the webhook registration before it expires.
   */
  renewWebhook(emailAccountId: string): Promise<boolean>;

  /**
   * Remove the webhook and disconnect the account.
   */
  disconnect(emailAccountId: string): Promise<boolean>;

  /**
   * Synchronize the mailbox (initial or incremental).
   * Should return an array of standardized emails that were added/changed.
   */
  syncAccount(emailAccountId: string): Promise<StandardizedEmail[]>;

  /**
   * Fetches a specific message by its provider ID.
   */
  fetchMessage(emailAccountId: string, messageId: string): Promise<StandardizedEmail | null>;
}
