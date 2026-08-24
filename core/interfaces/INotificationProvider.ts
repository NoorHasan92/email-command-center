// core/interfaces/INotificationProvider.ts
// This file defines the interface for notification providers.
// It is used by the pipeline to dispatch notifications to different channels.

export interface NotificationPayload {
  emailId: string;
  subject: string;
  score: number;
  explanation: string;
  actionRequired: boolean;
  destination: string; // Phone number or email address
}

export interface DigestPayload {
  importantCount: number;
  actionItemsCount: number;
  deadlinesCount: number;
  destination: string;
}

export interface DeadlineReminderPayload {
  actionItem: string;
  dueDate: string;
  destination: string;
}

export interface INotificationProvider {
  /**
   * Dispatches a notification to the target channel.
   * @param payload The notification payload
   * @returns A string containing the provider message ID (e.g. wamid for WhatsApp)
   */
  dispatch(payload: NotificationPayload): Promise<string>;
  
  dispatchDigest?(payload: DigestPayload): Promise<string>;
  dispatchDeadlineReminder?(payload: DeadlineReminderPayload): Promise<string>;
}
