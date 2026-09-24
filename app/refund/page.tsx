import { Metadata } from "next";
import Link from "next/link";
import {
  CreditCard,
  RefreshCw,
  Zap,
  ShieldCheck,
  Clock,
  ArrowLeft,
  Mail,
  HelpCircle,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Banknote,
  Calendar,
  Lock,
} from "lucide-react";
import { APP_CONFIG } from "@/config/app";

export const metadata: Metadata = {
  title: "Cancellation, Refund & Payment Policy | Inbox Sentinel",
  description: "Comprehensive Razorpay-compliant payment, subscription cancellation, 7-day refund guarantee, and instantaneous digital delivery terms.",
};

const SECTIONS = [
  { id: "overview", title: "1. Overview & Service Model", icon: <CreditCard className="w-4 h-4" /> },
  { id: "digital-delivery", title: "2. Instant Digital Delivery Policy", icon: <Zap className="w-4 h-4" /> },
  { id: "subscription-billing", title: "3. Subscription Billing & Renewals", icon: <Calendar className="w-4 h-4" /> },
  { id: "cancellation", title: "4. Subscription Cancellation Policy", icon: <RefreshCw className="w-4 h-4" /> },
  { id: "refund-guarantee", title: "5. 7-Day Refund Guarantee & Conditions", icon: <ShieldCheck className="w-4 h-4" /> },
  { id: "refund-procedure", title: "6. How to Request a Refund", icon: <FileCheck className="w-4 h-4" /> },
  { id: "turnaround-timeline", title: "7. Processing Timelines & Methods", icon: <Clock className="w-4 h-4" /> },
  { id: "failed-transactions", title: "8. Failed Transactions & Auto-Reversals", icon: <AlertCircle className="w-4 h-4" /> },
  { id: "chargebacks", title: "9. Chargebacks & Dispute Resolution", icon: <Lock className="w-4 h-4" /> },
  { id: "taxes-pricing", title: "10. Currencies, Pricing & Taxes", icon: <Banknote className="w-4 h-4" /> },
  { id: "support-contact", title: "11. Billing Inquiries & Contact", icon: <HelpCircle className="w-4 h-4" /> },
];

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      
      {/* Navigation Header */}
      <header className="sticky top-0 w-full flex items-center justify-between px-6 py-4 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Mail className="w-4 h-4 text-primary-foreground" />
          </div>
          {APP_CONFIG.name}
        </div>

        {/* Navigation Tabs */}
        <div className="hidden sm:flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border/50 text-xs font-semibold">
          <Link href="/privacy" className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
            Terms of Service
          </Link>
          <Link href="/refund" className="px-3 py-1.5 rounded-lg bg-background text-foreground shadow-sm">
            Refund & Payments
          </Link>
        </div>

        <Link 
          href="/" 
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-12 px-6 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 blur-[100px] rounded-full opacity-50 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/25 mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            Razorpay Merchant Compliant • Transparent Billing
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4">
            Cancellation, Refund & Payment Policy
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-6">
            We are dedicated to delivering exceptional value with zero billing ambiguity. Learn how subscription payments, digital delivery, cancellations, and refunds are managed.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-muted-foreground font-medium">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>Last updated: September 2026</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Effective Date: September 2026</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 pb-24 flex flex-col md:flex-row gap-10 relative">
        
        {/* Sticky Sidebar (Desktop) */}
        <aside className="hidden md:block w-72 shrink-0">
          <div className="sticky top-24 flex flex-col gap-1 p-3.5 rounded-2xl bg-card/50 backdrop-blur-sm border border-border max-h-[calc(100vh-120px)] overflow-y-auto">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 px-2.5">
              Table of Contents
            </h4>
            {SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              >
                {section.icon}
                <span className="truncate">{section.title}</span>
              </a>
            ))}
          </div>
        </aside>

        {/* Content Cards */}
        <div className="flex-1 flex flex-col gap-6">
          
          <SectionCard id="overview" title="1. Overview & Service Model" icon={<CreditCard className="w-5 h-5 text-indigo-400" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              This Cancellation, Refund & Payment Policy governs all financial transactions for <strong>Inbox Sentinel</strong>, operated by Md Noor Hasan Ansari in India.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Inbox Sentinel is delivered as a pure, cloud-hosted Software-as-a-Service (SaaS). We offer a <strong>Free Tier</strong> for essential email management, and paid monthly subscriptions (<strong>Pro Plan</strong> at ₹1,145/month [approx. $11.99] and <strong>Ultra Plan</strong> at ₹2,385/month [approx. $24.99]) that unlock elevated AI analysis quotas, executive personal intelligence, and deep research capabilities.
            </p>
          </SectionCard>

          <SectionCard id="digital-delivery" title="2. Instant Electronic Digital Delivery Policy (Shipping & Delivery)" icon={<Zap className="w-5 h-5 text-emerald-400" />}>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 mb-4">
              <strong className="block text-foreground text-xs sm:text-sm font-semibold mb-1">Instantaneous Online Provisioning</strong>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                As a pure cloud software provider, <strong>no physical goods or physical shipments are involved</strong> in any transaction with Inbox Sentinel.
              </p>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Delivery Mechanism:</strong> Upon successful authorization and confirmation of payment by our payment gateway (Razorpay), your account license and entitlements are provisioned electronically in real-time.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Confirmation Notice:</strong> An electronic payment receipt and purchase confirmation email containing your order reference (format: INS-ORD-XXXX) and transaction ID is transmitted immediately to your registered email address via Resend.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Access URL:</strong> You can verify active subscription status and quota balances at any time by logging into your account dashboard at <Link href="/billing" className="text-primary hover:underline font-semibold">https://mail.tars.homes/billing</Link>.</span>
              </li>
            </ul>
          </SectionCard>

          <SectionCard id="subscription-billing" title="3. Subscription Billing & Automatic Renewals" icon={<Calendar className="w-5 h-5 text-blue-400" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              To guarantee uninterrupted triage and priority inbox processing:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>• <strong>Billing Frequency:</strong> Paid plans operate on a monthly recurring basis, charged in advance on the calendar day corresponding to the commencement of your paid subscription.</li>
              <li>• <strong>Payment Gateways:</strong> All transactions are securely processed via Razorpay (supporting UPI, Credit Cards, Debit Cards, Net Banking, and authorized mobile wallets). Your financial card details are processed solely on PCI-DSS certified servers.</li>
              <li>• <strong>Quota Renewal:</strong> Your platform AI capacity (200 analyses for Pro, 500 analyses for Ultra) resets at the start of each monthly billing cycle. Unused monthly platform quotas do not roll over to subsequent months.</li>
            </ul>
          </SectionCard>

          <SectionCard id="cancellation" title="4. Subscription Cancellation Policy" icon={<RefreshCw className="w-5 h-5 text-purple-400" />}>
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/25 mb-4">
              <strong className="block text-foreground text-xs sm:text-sm font-semibold mb-1">Cancel Anytime with Zero Friction</strong>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                You may cancel your subscription at any time without penalty or cancellation fees directly from your account dashboard.
              </p>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>• <strong>How to Cancel:</strong> Navigate to <Link href="/billing" className="text-primary hover:underline font-semibold">Billing &amp; Plans</Link> and select "Cancel Subscription", or email our billing desk at <a href="mailto:mdnoorhasan1720@gmail.com" className="text-primary hover:underline">mdnoorhasan1720@gmail.com</a> with your registered email address.</li>
              <li>• <strong>Effective Date of Cancellation:</strong> Cancellation takes effect at the conclusion of your current paid monthly cycle. You will not be charged again.</li>
              <li>• <strong>Retained Access:</strong> You will retain full access to your paid tier features and remaining monthly quota until the final second of your active billing period, after which your account will gracefully downgrade to the Free Tier.</li>
            </ul>
          </SectionCard>

          <SectionCard id="refund-guarantee" title="5. 7-Day Money-Back Guarantee & Refund Conditions" icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              We stand behind the quality and reliability of Inbox Sentinel:
            </p>
            <div className="space-y-3 text-xs sm:text-sm text-muted-foreground">
              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50">
                <strong className="block text-foreground font-semibold mb-1">First-Time Subscriber 7-Day Guarantee</strong>
                If you are a first-time subscriber to a paid plan (Pro or Ultra) and find that the Service does not meet your expectations, you are entitled to request a <strong>100% full refund within seven (7) calendar days</strong> of your initial upgrade date.
              </div>
              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50">
                <strong className="block text-foreground font-semibold mb-1">Technical Incompatibility & Downtime</strong>
                If a verifiable platform outage or technical defect attributable directly to Inbox Sentinel prevents you from utilizing the Service for more than 48 consecutive hours, we will issue a prorated refund or credit for the affected period upon review.
              </div>
              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50">
                <strong className="block text-foreground font-semibold mb-1">Duplicate Charges</strong>
                In the rare event that network latency or technical errors cause a duplicate charge for a single billing cycle, the duplicate amount will be refunded in full immediately upon verification.
              </div>
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
                <strong className="block text-foreground font-semibold mb-1">Ineligible Circumstances</strong>
                Refunds are not granted in cases where: (a) the request is submitted after the 7-day initial guarantee window for renewals; (b) an account is suspended or terminated for violating our Acceptable Use Policy (such as abusive automation or spamming); or (c) the user has fully exhausted their monthly quota before requesting cancellation.
              </div>
            </div>
          </SectionCard>

          <SectionCard id="refund-procedure" title="6. How to Request a Refund" icon={<FileCheck className="w-5 h-5 text-blue-400" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              To initiate a refund request, submit an email to our dedicated billing team with the following details:
            </p>
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-2 text-xs sm:text-sm">
              <p><strong>To:</strong> <a href="mailto:mdnoorhasan1720@gmail.com" className="text-primary hover:underline">mdnoorhasan1720@gmail.com</a></p>
              <p><strong>Subject Line:</strong> Refund Request - [Your Registered Email Address]</p>
              <p><strong>Required Information:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                <li>Your registered Inbox Sentinel account email address.</li>
                <li>Your Razorpay Payment ID (format: <code className="text-primary font-mono">pay_...</code>) found on your email receipt.</li>
                <li>Your Order Reference Number (e.g., <code className="text-primary font-mono">INS-ORD-XXXX</code>).</li>
                <li>A brief description of the reason for the refund request (helps us improve our service).</li>
              </ul>
            </div>
          </SectionCard>

          <SectionCard id="turnaround-timeline" title="7. Processing Timelines & Reimbursement Methods" icon={<Clock className="w-5 h-5 text-purple-400" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              We process refunds systematically through the Razorpay payment infrastructure:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="p-3.5 bg-secondary/30 rounded-xl border border-border/50">
                <strong className="block text-foreground font-semibold mb-1">1. Review & Authorization</strong>
                Our billing team reviews and authorizes valid refund requests within <strong>24 to 48 business hours</strong> of receipt.
              </div>
              <div className="p-3.5 bg-secondary/30 rounded-xl border border-border/50">
                <strong className="block text-foreground font-semibold mb-1">2. Credit to Source Method</strong>
                Once initiated, funds are returned directly to the <strong>original payment source</strong> (your original UPI account, bank account, credit card, or debit card) within <strong>5 to 7 business days</strong>, depending on your bank's clearance cycle.
              </div>
            </div>
          </SectionCard>

          <SectionCard id="failed-transactions" title="8. Failed Transactions & Auto-Reversals" icon={<AlertCircle className="w-5 h-5 text-amber-400" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              If money has been debited from your bank account or card but your subscription tier was not updated due to a network interruption or browser closure:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>• <strong>Automated Gateway Reconciliation:</strong> Razorpay's automated reconciliation systems detect unverified transactions and either complete the order or trigger an automatic reversal back to your bank within <strong>24 to 48 hours</strong>.</li>
              <li>• <strong>Manual Intervention:</strong> If your account has not updated after 24 hours, forward your payment receipt screenshot and Payment ID to <a href="mailto:mdnoorhasan1720@gmail.com" className="text-primary hover:underline">mdnoorhasan1720@gmail.com</a> and we will immediately activate your plan manually or verify the refund.</li>
            </ul>
          </SectionCard>

          <SectionCard id="chargebacks" title="9. Chargebacks & Friendly Dispute Resolution" icon={<Lock className="w-5 h-5 text-indigo-400" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              We encourage you to contact us directly prior to initiating a bank chargeback or dispute. Our team is committed to resolving billing inquiries swiftly and amicably. Initiating fraudulent chargebacks without contacting support may lead to immediate suspension of your Inbox Sentinel profile and termination of linked API tokens.
            </p>
          </SectionCard>

          <SectionCard id="taxes-pricing" title="10. Currencies, Pricing & Tax Invoicing" icon={<Banknote className="w-5 h-5 text-emerald-400" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              All subscription rates are defined in Indian Rupees (INR) and billed in INR at checkout. USD prices displayed on our website are approximations provided for international convenience based on prevailing exchange rates.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tax invoices detailing your subscription fees are generated electronically and delivered to your registered email immediately upon payment settlement.
            </p>
          </SectionCard>

          <SectionCard id="support-contact" title="11. Billing Inquiries & Merchant Contact" icon={<HelpCircle className="w-5 h-5 text-purple-400" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              For any payment inquiries, billing discrepancies, or refund escalations, please contact the merchant desk:
            </p>
            <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 text-xs sm:text-sm space-y-1.5">
              <p><strong className="text-foreground">Merchant / Operating Entity:</strong> Inbox Sentinel (Proprietor: Md Noor Hasan Ansari)</p>
              <p><strong className="text-foreground">Billing Support Email:</strong> <a href="mailto:mdnoorhasan1720@gmail.com" className="text-primary hover:underline">mdnoorhasan1720@gmail.com</a></p>
              <p><strong className="text-foreground">Official Platform URL:</strong> <a href="https://mail.tars.homes" className="text-primary hover:underline">https://mail.tars.homes</a></p>
              <p><strong className="text-foreground">Payment Partner:</strong> Razorpay Software Private Limited</p>
              <p><strong className="text-foreground">Support Hours:</strong> Monday – Saturday, 09:00 AM – 06:00 PM IST (Tickets reviewed 24/7)</p>
            </div>
          </SectionCard>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border py-8 px-6 bg-background">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground font-medium">
          <p>&copy; {new Date().getFullYear()} Inbox Sentinel. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/refund" className="text-foreground font-semibold">Refund & Payments</Link>
            <a href="mailto:mdnoorhasan1720@gmail.com" className="hover:text-foreground transition-colors">Support</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

function SectionCard({ id, title, icon, children }: { id: string; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div 
      id={id} 
      className="scroll-mt-28 bg-card/60 backdrop-blur-md border border-border/60 rounded-2xl p-5 sm:p-7 shadow-sm hover:border-border transition-colors"
    >
      <div className="flex items-center gap-3.5 mb-4 pb-3 border-b border-border/40">
        <div className="w-10 h-10 rounded-xl bg-secondary/80 flex items-center justify-center border border-border/50 shrink-0">
          {icon}
        </div>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}
