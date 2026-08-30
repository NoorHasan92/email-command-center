"use client";

import { useState, useTransition, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, Sparkles } from "lucide-react";
import { UserAIUsage } from "@prisma/client";
import { PLAN_AI_LIMITS } from "@/config/plans";
import { createRazorpayOrderAction, verifyRazorpaySignatureAction } from "@/server/actions/billing.actions";
import { loadRazorpayScript } from "@/lib/razorpay";
import { toast } from "sonner";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function BillingClient({
  plan,
  usage,
  bonusAvailable
}: {
  plan: "FREE" | "PRO" | "ULTRA" | "ADMIN",
  usage: UserAIUsage | null,
  bonusAvailable: number
}) {
  const [isPending, startTransition] = useTransition();
  const [upgradingTo, setUpgradingTo] = useState<"PRO" | "ULTRA" | null>(null);
  const router = useRouter();

  const handleUpgrade = async (newPlan: "PRO" | "ULTRA") => {
    setUpgradingTo(newPlan);

    // 1. Create Order
    const orderRes = await createRazorpayOrderAction(newPlan);
    if (!orderRes.success || !orderRes.orderId) {
      toast.error(orderRes.error || "Failed to initiate payment");
      setUpgradingTo(null);
      return;
    }

    // 1.5 Load Razorpay Script
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      toast.error("Failed to load Razorpay SDK. Please disable any adblockers and try again.");
      setUpgradingTo(null);
      return;
    }

    // 2. Open Razorpay Checkout
    const options = {
      key: orderRes.keyId,
      amount: orderRes.amount,
      currency: orderRes.currency,
      name: "Inbox Sentinel",
      description: `Upgrade to ${newPlan} Plan`,
      order_id: orderRes.orderId,
      handler: async function (response: any) {
        // 3. Verify Signature
        startTransition(async () => {
          const verifyRes = await verifyRazorpaySignatureAction(
            response.razorpay_payment_id,
            response.razorpay_order_id,
            response.razorpay_signature,
            newPlan
          );

          if (verifyRes.success) {
            toast.success(`Successfully upgraded to ${newPlan}!`);
            router.refresh();
          } else {
            toast.error(verifyRes.error || "Payment verification failed");
          }
          setUpgradingTo(null);
        });
      },
      theme: {
        color: "#6366f1"
      },
      modal: {
        ondismiss: function () {
          setUpgradingTo(null);
        }
      }
    };

    const rzp = new window.Razorpay(options);

    rzp.on("payment.failed", function (response: any) {
      toast.error("Payment failed or cancelled.");
      setUpgradingTo(null);
    });

    rzp.open();
  };

  const limit = PLAN_AI_LIMITS[plan] || 50;
  const used = usage?.platformAiUsed || 0;
  const percentage = Math.min((used / limit) * 100, 100);

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 lg:p-10 space-y-12">

          {/* Header section */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Billing & Plans
              {plan === "PRO" && <Badge className="bg-blue-500/10 text-blue-500 border border-blue-500/20">PRO</Badge>}
              {plan === "ULTRA" && <Badge className="bg-purple-500/10 text-purple-500 border border-purple-500/20">ULTRA</Badge>}
              {plan === "ADMIN" && <Badge className="bg-orange-500/10 text-orange-500 border border-orange-500/20">ADMIN</Badge>}
            </h1>
            <p className="text-muted-foreground mt-2">Manage your subscription and view your AI usage.</p>
          </div>

          {/* Usage Overview */}
          <Card className="bg-card/50 backdrop-blur border-border overflow-hidden">
            <CardHeader className="bg-secondary/20 pb-4 border-b border-border/50">
              <CardTitle className="text-lg">Current Billing Cycle</CardTitle>
              {usage?.billingPeriodEnd && (
                <CardDescription>Resets on {format(new Date(usage.billingPeriodEnd), 'MMMM do, yyyy')}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-muted-foreground">Platform AI Capacity</span>
                <span className="text-sm font-bold">{used} / {limit} <span className="text-muted-foreground font-normal">analyses</span></span>
              </div>
              <Progress value={percentage} className="h-3" />

              {bonusAvailable > 0 && (
                <div className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-green-500 flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> Bonus Quota Active</p>
                    <p className="text-xs text-green-500/70 font-medium">You have additional granted capacity.</p>
                  </div>
                  <span className="text-lg font-bold text-green-500">{bonusAvailable} remaining</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing Tiers */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">Subscription Plans</h2>
            <div className="grid md:grid-cols-3 gap-6">

              {/* FREE Plan */}
              <PricingCard
                title="Free"
                price="$0"
                description="Perfect for casual users."
                features={[
                  `${PLAN_AI_LIMITS.FREE} AI Analyses / month`,
                  "Basic Email Summarization",
                  "Community Support"
                ]}
                isActive={plan === "FREE"}
                isCurrent={plan === "FREE"}
                buttonText="Current Plan"
                onAction={() => { }}
                isLoading={false}
                disabled={true}
              />

              {/* PRO Plan */}
              <PricingCard
                title="Pro"
                price="$11.99"
                description="For professionals who need more power. (Billed as ₹1,145)"
                features={[
                  `${PLAN_AI_LIMITS.PRO} AI Analyses / month`,
                  "Smart AI Email Drafts",
                  "Calendar & Other Few Apps Integration",
                  "Bring Your Own Key (BYOK) Feature",
                  "Priority Support"
                ]}
                isActive={plan === "PRO"}
                isCurrent={plan === "PRO"}
                buttonText={plan === "PRO" ? "Current Plan" : "Upgrade to Pro"}
                onAction={() => handleUpgrade("PRO")}
                isLoading={upgradingTo === "PRO"}
                highlight
                disabled={plan === "PRO" || plan === "ADMIN" || plan === "ULTRA"}
              />

              {/* ULTRA Plan */}
              <PricingCard
                title="Ultra"
                price="$24.99"
                description="Maximum capacity for power users. (Billed as ₹2,385)"
                features={[
                  `${PLAN_AI_LIMITS.ULTRA} AI Analyses / month`,
                  "Everything in Pro",
                  "More Apps Integrations",
                  "Multiple Gmail Setup",
                  "24/7 Dedicated Support"
                ]}
                isActive={plan === "ULTRA"}
                isCurrent={plan === "ULTRA"}
                buttonText={plan === "ULTRA" ? "Current Plan" : "Upgrade to Ultra"}
                onAction={() => handleUpgrade("ULTRA")}
                isLoading={upgradingTo === "ULTRA"}
                disabled={plan === "ULTRA" || plan === "ADMIN"}
              />

            </div>
          </div>

        </div>
      </div>
    </>
  );
}

function PricingCard({
  title, price, description, features, isActive, isCurrent, highlight, buttonText, onAction, isLoading, disabled
}: {
  title: string, price: string, description: string, features: string[], isActive: boolean, isCurrent: boolean, highlight?: boolean, buttonText: string, onAction: () => void, isLoading: boolean, disabled: boolean
}) {
  return (
    <Card className={`relative flex flex-col overflow-hidden transition-all ${highlight
      ? "border-primary/50 shadow-lg shadow-primary/5 bg-primary/5"
      : "bg-card/50 border-border hover:border-border/80 hover:bg-card/80"
      } ${isActive ? "ring-2 ring-primary border-transparent" : ""}`}>
      {highlight && (
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
      )}
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span className="text-xl">{title}</span>
          {isCurrent && <Badge variant="secondary">Active</Badge>}
        </CardTitle>
        <div className="mt-4 flex items-baseline text-4xl font-extrabold">
          {price}
          <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>
        </div>
        <CardDescription className="pt-2">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-3 text-sm text-muted-foreground mt-4">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start">
              <Check className="h-4 w-4 text-primary shrink-0 mr-2 mt-0.5" />
              <span className="font-medium text-foreground/80">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <button
          onClick={onAction}
          disabled={disabled || isLoading}
          className={`w-full flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${isCurrent
            ? "bg-secondary text-secondary-foreground cursor-default"
            : highlight
              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
              : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
            } ${disabled && !isCurrent ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isLoading ? "Processing..." : buttonText}
        </button>
      </CardFooter>
    </Card>
  );
}
