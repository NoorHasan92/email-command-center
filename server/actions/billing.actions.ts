"use server";

import { db } from "@/server/repositories/db";
import { auth } from "@/config/auth";
import { revalidatePath } from "next/cache";
import { Plan } from "@prisma/client";
import Razorpay from "razorpay";
import crypto from "crypto";

const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "",
  });
};

const PLAN_PRICES = {
  PRO: 120000, // 1200 INR in paise
  ULTRA: 290000, // 2900 INR in paise
};

export async function createRazorpayOrderAction(planType: "PRO" | "ULTRA") {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const amount = PLAN_PRICES[planType];
    
    if (!amount) {
      return { error: "Invalid plan" };
    }

    const rzp = getRazorpayInstance();
    const order = await rzp.orders.create({
      amount,
      currency: "INR",
      receipt: `receipt_${session.user.id}_${Date.now()}`,
    });

    return { 
      success: true, 
      orderId: order.id, 
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    };
  } catch (error: any) {
    console.error("Razorpay create order failed:", error);
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

  try {
    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (generatedSignature !== signature) {
      return { error: "Invalid payment signature" };
    }

    // Determine billing dates
    const now = new Date();
    const billingPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    // Update User plan
    await db.user.update({
      where: { id: session.user.id },
      data: { plan: planType as Plan }
    });

    // Reset UserAIUsage for the new billing cycle
    const currentUsage = await db.userAIUsage.findUnique({
      where: { userId: session.user.id }
    });

    if (currentUsage) {
      await db.userAIUsage.update({
        where: { userId: session.user.id },
        data: {
          billingPeriodStart: now,
          billingPeriodEnd,
          platformAiUsed: 0,
        }
      });
    } else {
      await db.userAIUsage.create({
        data: {
          userId: session.user.id,
          billingPeriodStart: now,
          billingPeriodEnd,
          platformAiUsed: 0,
          lifetimeGranted: 0
        }
      });
    }

    revalidatePath("/settings/billing");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Failed to verify payment:", error);
    return { error: "Failed to verify payment" };
  }
}

export async function createRazorpayByokOrderAction() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const amount = 50000; // 500 INR for BYOK Add-on
    const rzp = getRazorpayInstance();
    const order = await rzp.orders.create({
      amount,
      currency: "INR",
      receipt: `byok_${session.user.id}_${Date.now()}`,
    });

    return { 
      success: true, 
      orderId: order.id, 
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    };
  } catch (error: any) {
    console.error("Razorpay create BYOK order failed:", error);
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

  try {
    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (generatedSignature !== signature) {
      return { error: "Invalid payment signature" };
    }

    // Update User byokEnabled
    await db.user.update({
      where: { id: session.user.id },
      data: { byokEnabled: true }
    });

    revalidatePath("/settings");

    return { success: true };
  } catch (error) {
    console.error("Failed to verify BYOK payment:", error);
    return { error: "Failed to verify payment" };
  }
}
