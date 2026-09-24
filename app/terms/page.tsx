import { Metadata } from "next";
import Link from "next/link";
import {
  Mail,
  Shield,
  Brain,
  Bell,
  Database,
  ArrowLeft,
  Clock,
  CheckCircle2,
  Info,
  UserCheck,
  AlertTriangle,
  Copyright,
  Scale,
  RefreshCw,
  Power,
  CreditCard,
  Zap,
  HelpCircle,
  FileCheck,
} from "lucide-react";
import { APP_CONFIG } from "@/config/app";

export const metadata: Metadata = {
  title: "Terms of Service | Inbox Sentinel",
  description: "Institutional terms governing use of Inbox Sentinel, subscription billing, AI consequence disclaimers, intellectual property, and arbitration.",
};

const SECTIONS = [
  { id: "acceptance", title: "1. Acceptance & Eligibility", icon: <CheckCircle2 className="w-4 h-4" /> },
  { id: "description", title: "2. Scope of Services", icon: <Info className="w-4 h-4" /> },
  { id: "accounts-oauth", title: "3. Account Security & OAuth", icon: <UserCheck className="w-4 h-4" /> },
  { id: "billing-subscriptions", title: "4. Subscription & Billing Terms", icon: <CreditCard className="w-4 h-4" /> },
  { id: "digital-delivery", title: "5. Instant Digital Delivery", icon: <Zap className="w-4 h-4" /> },
  { id: "refund-reference", title: "6. Cancellations & Refunds", icon: <RefreshCw className="w-4 h-4" /> },
  { id: "acceptable-use", title: "7. Acceptable Use Policy", icon: <Shield className="w-4 h-4" /> },
  { id: "ai-disclaimer", title: "8. AI Outputs & Non-Reliance", icon: <AlertTriangle className="w-4 h-4" /> },
  { id: "third-party", title: "9. Third-Party Integrations & Uptime", icon: <Database className="w-4 h-4" /> },
  { id: "intellectual-property", title: "10. IP & Data Ownership", icon: <Copyright className="w-4 h-4" /> },
  { id: "limitation-of-liability", title: "11. Limitation of Liability", icon: <Scale className="w-4 h-4" /> },
  { id: "indemnification", title: "12. Indemnification", icon: <FileCheck className="w-4 h-4" /> },
  { id: "termination", title: "13. Suspension & Termination", icon: <Power className="w-4 h-4" /> },
  { id: "governing-law", title: "14. Dispute Resolution & Arbitration", icon: <Scale className="w-4 h-4" /> },
  { id: "contact-notice", title: "15. Notices & Contact", icon: <Mail className="w-4 h-4" /> },
];

export default function TermsOfServicePage() {
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
          <Link href="/terms" className="px-3 py-1.5 rounded-lg bg-background text-foreground shadow-sm">
            Terms of Service
          </Link>
          <Link href="/refund" className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 mb-4">
            <Scale className="w-3.5 h-3.5" />
            Binding Master Services Agreement
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4">
            Terms of Service
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-6">
            These Terms of Service constitute a legally binding agreement between you and Inbox Sentinel. Please read them thoroughly prior to accessing our software platform.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-muted-foreground font-medium">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>Last updated: September 2026</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
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
          
          <SectionCard id="acceptance" title="1. Acceptance of Terms & Eligibility" icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              By accessing, registering for, or using <strong>Inbox Sentinel</strong> ("the Service", "the Platform"), operated by Md Noor Hasan Ansari, India, you agree to be bound by these Terms of Service ("Terms") and our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong>Age and Authority:</strong> You represent and warrant that you are at least 18 years of age (or the age of majority in your jurisdiction) and possess full legal capacity to enter into these Terms. If you are accessing the Service on behalf of a company, organization, or other legal entity, you represent and warrant that you have authority to bind that entity to these Terms.
            </p>
          </SectionCard>

          <SectionCard id="description" title="2. Scope of Services & Technical Architecture" icon={<Info className="w-5 h-5 text-blue-500" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Inbox Sentinel is an autonomous productivity platform functioning as an AI Chief of Staff for professional email management:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground ml-1">
              <li>• <strong>Inbox Triage & Consequence Scoring:</strong> Algorithmic evaluation of incoming emails to determine risk, business urgency, deadlines, and required actions.</li>
              <li>• <strong>Personal Intelligence Engine (Ultra):</strong> User-configurable identity attributes, professional focus domains, and continuous pattern learning to personalize relevance scores.</li>
              <li>• <strong>Deep Research Synthesis (Ultra):</strong> Multi-stage background research on high-stakes communications to formulate actionable context briefs.</li>
              <li>• <strong>Notification Routing:</strong> Optional real-time alert dispatch to external messaging webhooks (WhatsApp via Meta, Telegram Bot API).</li>
              <li>• <strong>Read-Only Operational Guarantee:</strong> Unless specifically commanded by you, our systems operate on a read-only basis and will never modify, delete, or send emails on your behalf.</li>
            </ul>
          </SectionCard>

          <SectionCard id="accounts-oauth" title="3. Account Security & OAuth Authorization" icon={<UserCheck className="w-5 h-5 text-indigo-500" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              You connect to the Service using secure Google OAuth 2.0 authentication:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>• You are responsible for safeguarding your Google account credentials and sessions. You must immediately notify us of any unauthorized use or security breach of your account.</li>
              <li>• If you utilize the <strong>Bring Your Own Key (BYOK)</strong> feature, you maintain sole responsibility for the custody, permissions, quota limits, and billing liabilities of your external API keys (Google Gemini or OpenAI).</li>
            </ul>
          </SectionCard>

          <SectionCard id="billing-subscriptions" title="4. Subscription, Pricing & Billing Terms" icon={<CreditCard className="w-5 h-5 text-amber-500" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Inbox Sentinel offers tiered access (Free, Pro, and Ultra):
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground mb-4">
              <li>• <strong>Payment Processor:</strong> Subscriptions and recurring payments are securely billed and processed via <strong>Razorpay</strong> in Indian Rupees (INR) with foreign currency conversion facilitated transparently where supported.</li>
              <li>• <strong>Billing Cycle & Auto-Renewal:</strong> Paid subscriptions are billed on a recurring monthly cycle in advance. Your subscription renews automatically at the end of each monthly billing period unless explicitly cancelled by you through the Billing dashboard prior to the renewal date.</li>
              <li>• <strong>Price Adjustments:</strong> We reserve the right to revise subscription fees upon providing at least 30 calendar days' advance written notice. Continued use following the effective date of a price revision constitutes acceptance.</li>
              <li>• <strong>Failed Payments:</strong> If Razorpay is unable to process a renewal charge, access to premium features will be suspended after a grace period until payment is reconciled.</li>
            </ul>
          </SectionCard>

          <SectionCard id="digital-delivery" title="5. Instant Electronic Digital Delivery Policy" icon={<Zap className="w-5 h-5 text-emerald-400" />}>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 mb-3">
              <strong className="block text-foreground text-xs sm:text-sm font-semibold mb-1">Instant Digital SaaS Provisioning</strong>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Inbox Sentinel is a pure Software-as-a-Service (SaaS) digital product. Upon successful payment verification by Razorpay, your account is upgraded immediately and electronically. Your upgraded plan tier, enhanced quota limits, and exclusive features activate instantaneously. <strong>No physical shipment of goods is involved.</strong>
              </p>
            </div>
          </SectionCard>

          <SectionCard id="refund-reference" title="6. Cancellation & Refund Policy" icon={<RefreshCw className="w-5 h-5 text-purple-400" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              We maintain a transparent, fair refund policy:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>• <strong>Cancel Anytime:</strong> You may cancel your subscription at any time directly through the Billing dashboard. Cancellation halts future charges; you retain full access through the conclusion of your current paid billing period.</li>
              <li>• <strong>7-Day Money-Back Guarantee:</strong> First-time paid subscribers who are unsatisfied may request a full refund within 7 calendar days of their initial purchase.</li>
              <li>• For comprehensive terms on turnaround times, bank reversals, and dispute procedures, please review our full <Link href="/refund" className="text-primary font-semibold hover:underline">Cancellation, Refund & Payment Policy</Link>.</li>
            </ul>
          </SectionCard>

          <SectionCard id="acceptable-use" title="7. Acceptable Use Policy" icon={<Shield className="w-5 h-5 text-pink-500" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              You agree not to misuse or abuse the Service. Specifically, you agree that you will not:
            </p>
            <ul className="space-y-1.5 text-xs sm:text-sm text-muted-foreground">
              <li>• Reverse engineer, decompile, disassemble, or copy any software or algorithms comprising the Service.</li>
              <li>• Scrape, crawl, or harvest data through unauthorized automated scripts or bots.</li>
              <li>• Circumvent subscription quotas, access controls, or rate limits.</li>
              <li>• Transmit malicious code, viruses, or automated exploits through email payloads.</li>
              <li>• Utilize the Service to transmit unsolicited commercial communications (SPAM) or violate telecommunication laws.</li>
            </ul>
          </SectionCard>

          <SectionCard id="ai-disclaimer" title="8. Artificial Intelligence Disclaimers & Non-Reliance" icon={<AlertTriangle className="w-5 h-5 text-yellow-500" />}>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 mb-4">
              <strong className="block text-foreground text-xs sm:text-sm font-semibold mb-1">Assistive & Advisory Intelligence</strong>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Inbox Sentinel uses advanced probabilistic machine learning models (including Google Gemini and OpenAI). Outputs generated by the platform—including email summaries, urgency scores, consequence analyses, draft responses, and research briefs—are provided strictly for informational and organizational assistance.
              </p>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>• <strong>User Verification Required:</strong> AI models may occasionally misinterpret nuance, miss context, or generate inaccurate observations. You retain sole responsibility for independently reviewing critical emails and verifying deadlines before taking commercial, legal, or financial actions.</li>
              <li>• <strong>Not Professional Advice:</strong> The Service does not provide legal, financial, medical, or life-safety guidance. Under no circumstances should Inbox Sentinel be relied upon as an emergency alert dispatch system.</li>
            </ul>
          </SectionCard>

          <SectionCard id="third-party" title="9. Third-Party Integrations & Uptime Service Levels" icon={<Database className="w-5 h-5 text-cyan-400" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              The operation of Inbox Sentinel depends on third-party cloud platforms (including Google Cloud, Google APIs, Meta WhatsApp API, Telegram, Razorpay, and Oracle Cloud). We target 99.9% uptime, but we shall not be held liable for temporary interruptions, latency, rate limits, or service outages caused by third-party infrastructure beyond our reasonable control.
            </p>
          </SectionCard>

          <SectionCard id="intellectual-property" title="10. Intellectual Property & Customer Data Ownership" icon={<Copyright className="w-5 h-5 text-purple-400" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              <strong>Your Data:</strong> You retain 100% full legal ownership of your email communications, headers, and personal profile attributes. You grant Inbox Sentinel a strictly limited, non-exclusive license solely to process and analyze this data to provide the Service to you. We reaffirm that <strong>your private data is never used to train generalized foundation models</strong>.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong>Our Property:</strong> All software, designs, algorithms, logos, user interfaces, documentation, and intellectual property rights related to Inbox Sentinel remain the exclusive property of Md Noor Hasan Ansari.
            </p>
          </SectionCard>

          <SectionCard id="limitation-of-liability" title="11. Limitation of Liability & Consequential Damages Waiver" icon={<Scale className="w-5 h-5 text-red-500" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, INBOX SENTINEL AND ITS OPERATOR, AFFILIATES, AND SUPPLIERS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION:
            </p>
            <ul className="space-y-1.5 text-xs sm:text-sm text-muted-foreground mb-3 ml-2 list-disc list-inside">
              <li>Loss of profits, revenue, business contracts, or goodwill;</li>
              <li>Missed deadlines, lost business opportunities, or overlooked communications;</li>
              <li>Damages resulting from AI categorization errors or delayed notifications;</li>
              <li>Unauthorized access to or alteration of your transmissions or data resulting from compromised user credentials.</li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed">
              IN NO EVENT SHALL OUR TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THESE TERMS EXCEED THE GREATER OF: (A) THE TOTAL AMOUNT ACTUALLY PAID BY YOU TO INBOX SENTINEL IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO LIABILITY, OR (B) ONE THOUSAND INDIAN RUPEES (INR ₹1,000 / APPROX $50 USD).
            </p>
          </SectionCard>

          <SectionCard id="indemnification" title="12. Indemnification" icon={<FileCheck className="w-5 h-5 text-blue-400" />}>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You agree to defend, indemnify, and hold harmless Inbox Sentinel, its operator, contractors, and agents from and against any claims, liabilities, damages, losses, and reasonable legal fees arising out of or in any way connected with: (a) your breach of these Terms, (b) your violation of applicable laws or third-party rights, or (c) your use or misuse of the Service.
            </p>
          </SectionCard>

          <SectionCard id="termination" title="13. Suspension & Termination" icon={<Power className="w-5 h-5 text-red-400" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              <strong>By You:</strong> You may terminate these Terms at any time by disconnecting your Google account and ceasing all usage of the Service.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong>By Us:</strong> We reserve the right to suspend or terminate your access immediately, without prior notice or liability, in the event of your material breach of these Terms, fraudulent activity, security abuse, or non-payment of subscription fees.
            </p>
          </SectionCard>

          <SectionCard id="governing-law" title="14. Dispute Resolution, Binding Arbitration & Governing Law" icon={<Scale className="w-5 h-5 text-indigo-400" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              <strong>Governing Law:</strong> These Terms shall be governed by and construed in accordance with the substantive laws of the Republic of India, without regard to its conflict of law principles.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              <strong>Mandatory Arbitration:</strong> Any dispute, controversy, or claim arising out of or relating to these Terms, or the breach, termination, or invalidity thereof, shall be referred to and finally resolved by binding arbitration conducted in accordance with the Arbitration and Conciliation Act, 1996 of India. The seat and place of arbitration shall be Patna, Bihar, India. The language of arbitration shall be English.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong>Class Action Waiver:</strong> YOU AGREE THAT DISPUTES BETWEEN US SHALL BE RESOLVED ON AN INDIVIDUAL BASIS, AND YOU EXPRESSLY WAIVE ANY RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR CLASS-WIDE ARBITRATION.
            </p>
          </SectionCard>

          <SectionCard id="contact-notice" title="15. Official Notices & Contact Information" icon={<Mail className="w-5 h-5 text-indigo-400" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              For any questions, legal notices, or formal communications regarding these Terms of Service, please contact:
            </p>
            <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 text-xs sm:text-sm space-y-1.5">
              <p><strong className="text-foreground">Operating Entity:</strong> Inbox Sentinel (Proprietor: Md Noor Hasan Ansari)</p>
              <p><strong className="text-foreground">Official Support Email:</strong> <a href="mailto:mdnoorhasan1720@gmail.com" className="text-primary hover:underline">mdnoorhasan1720@gmail.com</a></p>
              <p><strong className="text-foreground">Platform URL:</strong> <a href="https://mail.tars.homes" className="text-primary hover:underline">https://mail.tars.homes</a></p>
              <p><strong className="text-foreground">Country of Origin:</strong> India</p>
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
            <Link href="/terms" className="text-foreground font-semibold">Terms of Service</Link>
            <Link href="/refund" className="hover:text-foreground transition-colors">Refund & Payments</Link>
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
