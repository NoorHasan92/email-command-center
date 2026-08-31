import { TransactionalEmailType, TransactionalEmailStatus } from "@prisma/client";

export interface TransactionalEmailPayload {
  to: string;
  subject: string;
  type: TransactionalEmailType;
  idempotencyKey: string;
  metadata?: Record<string, any>;
  userId?: string;
  html: string;
}

export interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
