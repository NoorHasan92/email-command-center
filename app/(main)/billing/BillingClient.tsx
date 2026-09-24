"use client";

import { useState, useTransition, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, Sparkles, ShieldCheck, Zap, Lock, RefreshCw, Crown, Brain, ArrowRight } from "lucide-react";
import Link from "next/link";
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
        <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-10 space-y-8 md:space-y-12">

          {/* Header section */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex flex-wrap items-center gap-2">
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
                <div className="mt-6 p-3 md:p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
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
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight">Subscription Plans</h2>
                <p className="text-sm text-muted-foreground mt-1">Scale your autonomous email intelligence with zero setup friction.</p>
              </div>
              <span className="text-xs font-medium text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full border border-border/50 self-start sm:self-auto">
                Billed monthly via Razorpay • Cancel anytime
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-6 items-stretch">

              {/* FREE Plan */}
              <PricingCard
                title="Free"
                price="$0"
                description="Essential triage for individuals getting started."
                features={[
                  `${PLAN_AI_LIMITS.FREE} AI Analyses / month`,
                  "Basic Email Summarization & Priority",
                  "1 Connected Gmail Account",
                  "Standard Urgency & Deadline Detection",
                  "Web Dashboard Access",
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
                description="For professionals who need fast triage & automated drafts. (Billed as ₹1,145)"
                features={[
                  `${PLAN_AI_LIMITS.PRO} AI Analyses / month`,
                  "Smart AI Email Drafts & Fast Replies",
                  "Bring Your Own Key (BYOK) - Unlimited AI via personal keys",
                  "Calendar & Productivity Integrations",
                  "Real-Time Risk & Consequence Detection",
                  "WhatsApp & Telegram Instant Alerts (Optional)",
                  "Priority Email & Ticket Support"
                ]}
                isActive={plan === "PRO"}
                isCurrent={plan === "PRO"}
                buttonText={plan === "PRO" ? "Current Plan" : "Upgrade to Pro"}
                onAction={() => handleUpgrade("PRO")}
                isLoading={upgradingTo === "PRO"}
                highlight
                badge="POPULAR"
                disabled={plan === "PRO" || plan === "ADMIN" || plan === "ULTRA"}
              />

              {/* ULTRA Plan */}
              <PricingCard
                title="Ultra"
                price="$24.99"
                description="Complete executive command with autonomous memory & deep research. (Billed as ₹2,385)"
                features={[
                  `${PLAN_AI_LIMITS.ULTRA} AI Analyses / month (Platform Quota)`,
                  "Everything in Pro, plus:",
                  "Ultra Personal Intelligence & Autonomous Executive Profile",
                  "Active Intelligence Attributes & Adaptive Relevance Scoring",
                  "Deep Research Engine (10-Stage autonomous background synthesis)",
                  "Multi-Gmail Setup (Connect & triage multiple Gmail accounts)",
                  "Observation Review Gate & Continuous Profile Learning",
                  "VIP Triage Escalation & Fast Queue Priority",
                  "24/7 Dedicated Priority Support"
                ]}
                isActive={plan === "ULTRA"}
                isCurrent={plan === "ULTRA"}
                buttonText={plan === "ULTRA" ? "Current Plan" : "Upgrade to Ultra"}
                onAction={() => handleUpgrade("ULTRA")}
                isLoading={upgradingTo === "ULTRA"}
                isUltra
                badge="EXECUTIVE TIER"
                disabled={plan === "ULTRA" || plan === "ADMIN"}
              />

            </div>
          </div>

          {/* MNC SaaS Enterprise Trust & Legal Assurance */}
          <div className="pt-6 border-t border-border/50">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card/40 border border-border/40">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-foreground">PCI-DSS Compliant</h4>
                  <p className="text-[11px] text-muted-foreground">Transactions encrypted via Razorpay 256-bit SSL.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card/40 border border-border/40">
                <Zap className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Instant Digital Delivery</h4>
                  <p className="text-[11px] text-muted-foreground">Tier quota and features activate immediately on payment.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card/40 border border-border/40">
                <RefreshCw className="w-5 h-5 text-purple-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Flexible Cancellation</h4>
                  <p className="text-[11px] text-muted-foreground">Cancel anytime from dashboard; no lock-in contracts.</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Subscriptions renew automatically each month unless cancelled prior to renewal. By subscribing, you agree to our{" "}
              <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>,{" "}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, and{" "}
              <Link href="/refund" className="text-primary hover:underline">Cancellation & Refund Policy</Link>.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}

function PricingCard({
  title, price, description, features, isActive, isCurrent, highlight, isUltra, badge, buttonText, onAction, isLoading, disabled
}: {
  title: string;
  price: string;
  description: string;
  features: string[];
  isActive: boolean;
  isCurrent: boolean;
  highlight?: boolean;
  isUltra?: boolean;
  badge?: string;
  buttonText: string;
  onAction: () => void;
  isLoading: boolean;
  disabled: boolean;
}) {
  return (
    <Card className={`relative flex flex-col overflow-hidden transition-all duration-300 ${
      isUltra
        ? "border-purple-500/40 bg-gradient-to-b from-purple-950/20 via-card/90 to-card shadow-xl shadow-purple-500/5 hover:border-purple-500/60 ring-1 ring-purple-500/30"
        : highlight
          ? "border-indigo-500/40 shadow-lg shadow-indigo-500/5 bg-gradient-to-b from-indigo-950/20 via-card/90 to-card hover:border-indigo-500/60"
          : "bg-card/50 border-border hover:border-border/80 hover:bg-card/80"
      } ${isActive ? "ring-2 ring-primary border-transparent" : ""}`}>
      
      {/* Top accent line */}
      {isUltra && (
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500" />
      )}
      {highlight && !isUltra && (
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-indigo-500/50 via-indigo-500 to-indigo-500/50" />
      )}

      <CardHeader className="pb-4">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">{title}</span>
            {isUltra && <Crown className="w-4 h-4 text-purple-400" />}
          </div>
          {isCurrent ? (
            <Badge variant="secondary" className="font-semibold">Active</Badge>
          ) : badge ? (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isUltra 
                ? "bg-purple-500/20 text-purple-300 border-purple-500/30" 
                : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
            }`}>
              {badge}
            </span>
          ) : null}
        </div>
        <div className="mt-3 flex items-baseline text-3xl md:text-4xl font-black tracking-tight">
          {price}
          <span className="ml-1 text-sm font-semibold text-muted-foreground">/month</span>
        </div>
        <CardDescription className="pt-2 text-xs leading-relaxed min-h-[36px]">{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-6">
        <div className="h-px w-full bg-border/40 mb-4" />
        <ul className="space-y-2.5 text-xs text-muted-foreground">
          {features.map((feature, i) => {
            const isHeader = feature.startsWith("Everything in");
            return (
              <li key={i} className={`flex items-start gap-2 ${isHeader ? "font-semibold text-foreground pt-1 pb-0.5" : ""}`}>
                {!isHeader ? (
                  <Check className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${isUltra ? "text-purple-400" : highlight ? "text-indigo-400" : "text-primary"}`} />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5 text-purple-400" />
                )}
                <span className={`leading-relaxed ${isHeader ? "text-purple-300 font-semibold" : "text-foreground/90 font-medium"}`}>{feature}</span>
              </li>
            );
          })}
        </ul>
      </CardContent>

      <CardFooter className="pt-2">
        <button
          onClick={onAction}
          disabled={disabled || isLoading}
          className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
            isCurrent
              ? "bg-secondary text-secondary-foreground cursor-default opacity-80"
              : isUltra
                ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/25 active:scale-95"
                : highlight
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-500/20 active:scale-95"
                  : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
            } ${disabled && !isCurrent ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            buttonText
          )}
        </button>
      </CardFooter>
    </Card>
  );
}
