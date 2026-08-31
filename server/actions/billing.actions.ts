"use server";

import { db } from "@/server/repositories/db";
import { auth } from "@/config/auth";
import { revalidatePath } from "next/cache";
import { Plan, ProductType } from "@prisma/client";
import Razorpay from "razorpay";
import crypto from "crypto";
import { PRODUCTS } from "@/config/products";
import { generateReferenceNumber } from "@/services/transactional-email/reference.service";
import { sendPurchaseConfirmationEmail, sendPaymentReceiptEmail } from "@/services/transactional-email/email.service";
import { generateSecureToken } from "@/services/security/tokens";
import { logger } from "@/lib/logger";

const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "",
  });
};

export async function createRazorpayOrderAction(planType: "PRO" | "ULTRA") {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const productType = planType === "PRO" ? "PLAN_PRO" : "PLAN_ULTRA";
    const product = PRODUCTS[productType];
    
    if (!product) return { error: "Invalid plan" };

    // 1. Generate internal reference
    const referenceNumber = await generateReferenceNumber("INS-ORD");

    // 2. Create Razorpay order
    const rzp = getRazorpayInstance();
    const rzpOrder = await rzp.orders.create({
      amount: product.price,
      currency: product.currency,
      receipt: referenceNumber,
    });

    // 3. Create internal Order record
    await db.order.create({
      data: {
        userId: session.user.id,
        referenceNumber,
        productType,
        amount: product.price,
        currency: product.currency,
        status: "PAYMENT_PENDING",
        razorpayOrderId: rzpOrder.id,
      }
    });

    return { 
      success: true, 
      orderId: rzpOrder.id, 
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    };
  } catch (error: any) {
    logger.error({ err: error }, "Razorpay create order failed");
    return { error: error.message || "Failed to create order" };
  }
}

export async function verifyRazorpaySignatureAction(
  paymentId: string, 
  orderId: string, 
  signature: string, 
  planType: "PRO" | "ULTRA"
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = session.user.id;

  try {
    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (generatedSignature !== signature) {
      return { error: "Invalid payment signature" };
    }

    // Check for idempotency: if Payment exists, return early
    const existingPayment = await db.payment.findUnique({
      where: { providerPaymentId: paymentId }
    });
    if (existingPayment) {
      logger.info(`[BILLING] Duplicate verify call for payment: ${paymentId}`);
      return { success: true };
    }

    // Fetch the internal order
    const internalOrder = await db.order.findUnique({
      where: { razorpayOrderId: orderId }
    });

    if (!internalOrder) {
      return { error: "Order not found in system" };
    }

    const receiptNumber = await generateReferenceNumber("INS-RCP");
    const receiptToken = generateSecureToken();

    // Determine billing dates
    const now = new Date();
    const billingPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Transactionally update Order, create Payment, and activate Entitlement
    await db.$transaction(async (tx) => {
      // Create Payment Record
      await tx.payment.create({
        data: {
          orderId: internalOrder.id,
          userId: userId,
          provider: "RAZORPAY",
          providerPaymentId: paymentId,
          providerOrderId: orderId,
          amount: internalOrder.amount,
          currency: internalOrder.currency,
          status: "CAPTURED",
          signatureVerified: true,
          receiptNumber,
          receiptToken,
          paidAt: now,
        }
      });

      // Update Order Status
      await tx.order.update({
        where: { id: internalOrder.id },
        data: { status: "PAID" }
      });

      // Update User Plan
      await tx.user.update({
        where: { id: userId },
        data: { plan: planType as Plan }
      });

      // Reset/Create Usage for new billing cycle
      const currentUsage = await tx.userAIUsage.findUnique({
        where: { userId: userId }
      });

      if (currentUsage) {
        await tx.userAIUsage.update({
          where: { userId: userId },
          data: {
            billingPeriodStart: now,
            billingPeriodEnd,
            platformAiUsed: 0,
          }
        });
      } else {
        await tx.userAIUsage.create({
          data: {
            userId: userId,
            billingPeriodStart: now,
            billingPeriodEnd,
            platformAiUsed: 0,
            lifetimeGranted: 0
          }
        });
      }
    });

    revalidatePath("/settings/billing");
    revalidatePath("/dashboard");

    // Fire off transactional emails (non-blocking)
    sendPurchaseConfirmationEmail(internalOrder.id).catch(err => 
      logger.error({ err }, "Failed to send purchase confirmation email")
    );
    
    // Slight delay before receipt to ensure order state is available if fetch gets split
    setTimeout(() => {
      // Find the payment again to get its ID for the email
      db.payment.findUnique({ where: { providerPaymentId: paymentId } })
        .then(payment => {
          if (payment) sendPaymentReceiptEmail(payment.id);
        })
        .catch(err => logger.error({ err }, "Failed to fetch payment for receipt email"));
    }, 1000);

    return { success: true };
  } catch (error) {
    logger.error({ err: error }, "Failed to verify payment");
    return { error: "Failed to verify payment" };
  }
}

// BYOK Actions Follow Similar Pattern

export async function createRazorpayByokOrderAction() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const product = PRODUCTS["ADDON_BYOK"];
    const referenceNumber = await generateReferenceNumber("INS-ORD");

    const rzp = getRazorpayInstance();
    const rzpOrder = await rzp.orders.create({
      amount: product.price,
      currency: product.currency,
      receipt: referenceNumber,
    });

    await db.order.create({
      data: {
        userId: session.user.id,
        referenceNumber,
        productType: "ADDON_BYOK",
        amount: product.price,
        currency: product.currency,
        status: "PAYMENT_PENDING",
        razorpayOrderId: rzpOrder.id,
      }
    });

    return { 
      success: true, 
      orderId: rzpOrder.id, 
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    };
  } catch (error: any) {
    logger.error({ err: error }, "Razorpay create BYOK order failed");
    return { error: error.message || "Failed to create order" };
  }
}

export async function verifyRazorpayByokSignatureAction(
  paymentId: string, 
  orderId: string, 
  signature: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = session.user.id;

  try {
    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (generatedSignature !== signature) {
      return { error: "Invalid payment signature" };
    }

    const existingPayment = await db.payment.findUnique({
      where: { providerPaymentId: paymentId }
    });
    if (existingPayment) return { success: true };

    const internalOrder = await db.order.findUnique({
      where: { razorpayOrderId: orderId }
    });

    if (!internalOrder) return { error: "Order not found in system" };

    const receiptNumber = await generateReferenceNumber("INS-RCP");
    const receiptToken = generateSecureToken();
    const now = new Date();

    await db.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          orderId: internalOrder.id,
          userId: userId,
          provider: "RAZORPAY",
          providerPaymentId: paymentId,
          providerOrderId: orderId,
          amount: internalOrder.amount,
          currency: internalOrder.currency,
          status: "CAPTURED",
          signatureVerified: true,
          receiptNumber,
          receiptToken,
          paidAt: now,
        }
      });

      await tx.order.update({
        where: { id: internalOrder.id },
        data: { status: "PAID" }
      });

      await tx.user.update({
        where: { id: userId },
        data: { byokEnabled: true }
      });
    });

    revalidatePath("/settings");

    sendPurchaseConfirmationEmail(internalOrder.id).catch(err => 
      logger.error({ err }, "Failed to send BYOK purchase confirmation email")
    );
    
    setTimeout(() => {
      db.payment.findUnique({ where: { providerPaymentId: paymentId } })
        .then(payment => {
          if (payment) sendPaymentReceiptEmail(payment.id);
        })
        .catch(err => logger.error({ err }, "Failed to fetch BYOK payment for receipt email"));
    }, 1000);

    return { success: true };
  } catch (error) {
    logger.error({ err: error }, "Failed to verify BYOK payment");
    return { error: "Failed to verify payment" };
  }
}
