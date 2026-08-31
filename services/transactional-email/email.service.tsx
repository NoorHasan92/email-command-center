import { Resend } from "resend";
import { env } from "@/config/env";
import { db } from "@/server/repositories/db";
import { TransactionalEmailType, TransactionalEmailStatus } from "@prisma/client";
import { logger } from "@/lib/logger";
import "server-only";
import * as React from "react";

// Components
import { WelcomeEmail } from "@/components/emails/WelcomeEmail";
import { PurchaseConfirmationEmail } from "@/components/emails/PurchaseConfirmationEmail";
import { PaymentReceiptEmail } from "@/components/emails/PaymentReceiptEmail";
import { PasswordChangedEmail } from "@/components/emails/PasswordChangedEmail";
import { AccountDeletionConfirmationEmail } from "@/components/emails/AccountDeletionConfirmationEmail";
import { AccountDeletionScheduledEmail } from "@/components/emails/AccountDeletionScheduledEmail";
import { AccountDeletionCancelledEmail } from "@/components/emails/AccountDeletionCancelledEmail";
import { AccountDeletionCompletedEmail } from "@/components/emails/AccountDeletionCompletedEmail";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
const FROM_EMAIL = env.EMAIL_FROM || "Inbox Sentinel <noreply@tars.homes>";

/**
 * Core dispatch function. Handles idempotency, logging, and provider dispatch.
 */
async function dispatchEmail(
  type: TransactionalEmailType,
  recipient: string,
  subject: string,
  idempotencyKey: string,
  reactComponent: React.ReactElement,
  userId?: string,
  metadata?: Record<string, any>
) {
  // 1. Idempotency Check
  const existingLog = await db.transactionalEmailLog.findUnique({
    where: { idempotencyKey },
  });

  if (existingLog && existingLog.status !== "FAILED") {
    logger.info({ idempotencyKey, recipient }, `[EMAIL] Skipping duplicate email dispatch`);
    return { success: true, messageId: existingLog.providerMessageId };
  }

  // 2. Create/Update Log as PENDING
  const log = await db.transactionalEmailLog.upsert({
    where: { idempotencyKey },
    update: { attemptCount: { increment: 1 }, status: "PENDING" },
    create: {
      idempotencyKey,
      type,
      recipient,
      subject,
      userId,
      metadata: metadata || {},
      attemptCount: 1,
    },
  });

  try {
    if (!resend) {
      logger.info(`[MOCK EMAIL] To: ${recipient} | Subject: ${subject}`);
      await db.transactionalEmailLog.update({
        where: { id: log.id },
        data: { status: "SENT", sentAt: new Date(), providerMessageId: `mock-${Date.now()}` },
      });
      return { success: true, messageId: `mock-${Date.now()}` };
    }

    // 3. Dispatch to Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipient,
      subject,
      react: reactComponent,
    });

    if (error) {
      throw new Error(error.message);
    }

    // 4. Mark SENT
    await db.transactionalEmailLog.update({
      where: { id: log.id },
      data: { status: "SENT", sentAt: new Date(), providerMessageId: data?.id },
    });

    return { success: true, messageId: data?.id };
  } catch (error: any) {
    logger.error({ err: error, recipient, type }, "[EMAIL] Dispatch failed");
    
    // Mark FAILED
    await db.transactionalEmailLog.update({
      where: { id: log.id },
      data: { status: "FAILED", failedAt: new Date(), lastError: error.message },
    });

    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------------------------
// Specific Email Event Dispatchers
// ----------------------------------------------------------------------

export async function sendWelcomeEmail(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { success: false, error: "User not found" };

  return dispatchEmail(
    "WELCOME",
    user.email,
    "Welcome to Inbox Sentinel",
    `welcome:${userId}`,
    <WelcomeEmail name={user.name} />,
    userId
  );
}

export async function sendPurchaseConfirmationEmail(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { user: true, payment: true },
  });

  if (!order || !order.user || !order.payment) {
    return { success: false, error: "Order/Payment not found" };
  }

  // Import PRODUCTS dynamically to avoid circular dependencies if any
  const { PRODUCTS } = await import("@/config/products");
  const product = PRODUCTS[order.productType];
  
  if (!product) return { success: false, error: "Product not found" };

  return dispatchEmail(
    "PURCHASE_CONFIRMATION",
    order.user.email,
    "Purchase Successful - Inbox Sentinel",
    `purchase:${order.payment.id}`,
    <PurchaseConfirmationEmail
      productName={product.name}
      amount={order.amount}
      currency={order.currency}
      purchaseDate={order.payment.paidAt || order.payment.createdAt}
      referenceNumber={order.referenceNumber}
      features={product.features}
    />,
    order.user.id,
    { orderId, paymentId: order.payment.id }
  );
}

export async function sendPaymentReceiptEmail(paymentId: string) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { user: true, order: true },
  });

  if (!payment || !payment.user || !payment.order || !payment.receiptNumber || !payment.receiptToken) {
    return { success: false, error: "Payment/Receipt not found" };
  }

  const { PRODUCTS } = await import("@/config/products");
  const product = PRODUCTS[payment.order.productType];
  const baseUrl = env.NEXT_PUBLIC_APP_URL || "https://tars.homes";

  return dispatchEmail(
    "PAYMENT_RECEIPT",
    payment.user.email,
    `Payment Receipt - ${payment.receiptNumber}`,
    `receipt:${payment.id}`,
    <PaymentReceiptEmail
      receiptNumber={payment.receiptNumber}
      customerName={payment.user.name}
      customerEmail={payment.user.email}
      productName={product?.name || "Inbox Sentinel Subscription"}
      amount={payment.amount}
      currency={payment.currency}
      paymentStatus="Verified"
      orderReference={payment.order.referenceNumber}
      razorpayPaymentId={payment.providerPaymentId}
      razorpayOrderId={payment.providerOrderId}
      paymentDate={payment.paidAt || payment.createdAt}
      receiptUrl={`${baseUrl}/api/receipts/${payment.receiptToken}`}
    />,
    payment.user.id,
    { paymentId, orderId: payment.order.id }
  );
}

export async function sendPasswordChangedEmail(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { success: false, error: "User not found" };

  // Note: we can't strongly tie this to a specific audit log easily without fetching the latest,
  // but we can use timestamp for idempotency within a 1-minute window to avoid bursts.
  const timeWindow = Math.floor(Date.now() / 60000); 

  return dispatchEmail(
    "PASSWORD_CHANGED",
    user.email,
    "Security Alert: Your password was changed",
    `pwd_changed:${userId}:${timeWindow}`,
    <PasswordChangedEmail changeTime={new Date()} />,
    userId
  );
}

export async function sendAccountDeletionConfirmationEmail(userId: string, confirmationToken: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { success: false, error: "User not found" };

  const baseUrl = env.NEXT_PUBLIC_APP_URL || "https://tars.homes";
  const confirmationUrl = `${baseUrl}/api/deletion/confirm?token=${confirmationToken}`;

  return dispatchEmail(
    "ACCOUNT_DELETION_CONFIRMATION",
    user.email,
    "Confirm Account Deletion Request",
    `del_confirm:${userId}:${Date.now()}`,
    <AccountDeletionConfirmationEmail name={user.name} confirmationUrl={confirmationUrl} />,
    userId
  );
}

export async function sendAccountDeletionScheduledEmail(userId: string, scheduledDate: Date) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { success: false, error: "User not found" };

  return dispatchEmail(
    "ACCOUNT_DELETION_SCHEDULED",
    user.email,
    "Account Deletion Scheduled",
    `del_scheduled:${userId}`,
    <AccountDeletionScheduledEmail name={user.name} scheduledDate={scheduledDate} />,
    userId
  );
}

export async function sendAccountDeletionCancelledEmail(userId: string, email: string, name: string | null) {
  return dispatchEmail(
    "ACCOUNT_DELETION_CANCELLED",
    email,
    "Account Deletion Cancelled",
    `del_cancelled:${userId}:${Date.now()}`,
    <AccountDeletionCancelledEmail name={name} />,
    userId
  );
}

export async function sendAccountDeletionCompletedEmail(email: string, name: string | null) {
  return dispatchEmail(
    "ACCOUNT_DELETION_COMPLETED",
    email,
    "Account Deleted",
    `del_completed:${email}:${Date.now()}`,
    <AccountDeletionCompletedEmail name={name} />
  );
}
