import { Metadata } from "next";
import Link from "next/link";
import {
  Mail,
  Shield,
  User,
  Brain,
  Bell,
  Settings,
  Database,
  Link as LinkIcon,
  ArrowLeft,
  Clock,
  History,
  FileText,
  Baby,
  CreditCard,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Server,
  HelpCircle,
} from "lucide-react";
import { APP_CONFIG } from "@/config/app";

export const metadata: Metadata = {
  title: "Privacy Policy | Inbox Sentinel",
  description: "Enterprise-grade privacy disclosures, Google API Services Limited Use compliance, AI processing boundaries, and data protection policies.",
};

const SECTIONS = [
  { id: "introduction", title: "1. Introduction & Entity", icon: <Mail className="w-4 h-4" /> },
  { id: "information-we-collect", title: "2. Information We Collect", icon: <User className="w-4 h-4" /> },
  { id: "gmail-access", title: "3. Gmail Access & Scope", icon: <Database className="w-4 h-4" /> },
  { id: "google-api-services", title: "4. Google Limited Use Disclosure", icon: <Shield className="w-4 h-4" /> },
  { id: "ai-processing", title: "5. AI Processing & Zero Training", icon: <Brain className="w-4 h-4" /> },
  { id: "personal-intelligence", title: "6. Personal Intelligence Engine", icon: <Brain className="w-4 h-4" /> },
  { id: "payment-processing", title: "7. Payment & Billing Data", icon: <CreditCard className="w-4 h-4" /> },
  { id: "security-encryption", title: "8. Security & Encryption", icon: <Lock className="w-4 h-4" /> },
  { id: "data-retention", title: "9. Data Retention & Deletion", icon: <History className="w-4 h-4" /> },
  { id: "notifications", title: "10. Urgent Notification Channels", icon: <Bell className="w-4 h-4" /> },
  { id: "third-party", title: "11. Sub-processors & Infrastructure", icon: <Server className="w-4 h-4" /> },
  { id: "user-controls", title: "12. User Rights & Data Control", icon: <Settings className="w-4 h-4" /> },
  { id: "children", title: "13. Children's Privacy", icon: <Baby className="w-4 h-4" /> },
  { id: "changes", title: "14. Policy Amendments", icon: <FileText className="w-4 h-4" /> },
  { id: "contact-grievance", title: "15. Grievance Officer & Contact", icon: <HelpCircle className="w-4 h-4" /> },
];

export default function PrivacyPolicyPage() {
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
          <Link href="/privacy" className="px-3 py-1.5 rounded-lg bg-background text-foreground shadow-sm">
            Privacy Policy
          </Link>
          <Link href="/terms" className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 mb-4">
            <Shield className="w-3.5 h-3.5" />
            Lawyer & Auditor Compliant • Enterprise Grade
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-6">
            We hold your privacy to institutional standards. This document details how Inbox Sentinel collects, processes, and protects your communications, adhering strictly to Google API Services User Data Policy and global security best practices.
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
          
          <SectionCard id="introduction" title="1. Introduction & Operating Entity" icon={<Mail className="w-5 h-5 text-blue-500" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              This Privacy Policy governs your use of <strong>Inbox Sentinel</strong> ("the Service", "the Platform", "we", "us", or "our"), operated by Md Noor Hasan Ansari, located in India. We provide AI-assisted inbox triage, consequence scoring, executive context extraction, and automated workflow notifications.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              By accessing or using Inbox Sentinel, you acknowledge that you have read, understood, and consented to the data practices described herein. If you do not agree, you must immediately disconnect your accounts and discontinue using the Service.
            </p>
          </SectionCard>

          <SectionCard id="information-we-collect" title="2. Information We Collect" icon={<User className="w-5 h-5 text-green-500" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              We practice strict data minimization. We only collect information strictly necessary to provide intelligent triage and secure account administration:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground ml-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Account & Profile Information:</strong> Full name, primary email address, Google account ID, and avatar image obtained during Google OAuth 2.0 authentication.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Communication Metadata:</strong> In-flight email subject lines, sender names, recipient headers, dates, message snippets, and priority signals required to compute consequence and urgency metrics.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Personal Intelligence Attributes:</strong> Professional titles, core focus domains, key project names, and custom guidance attributes configured manually by you or confirmed via the Observation Review Gate.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>BYOK API Keys (Optional):</strong> If you activate Bring-Your-Own-Key processing, your personal Google Gemini or OpenAI API keys are encrypted immediately with AES-256-GCM and never stored in plaintext.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Operational Telemetry:</strong> Anonymized audit logs, timestamped error logs, rate-limit indicators, and security logs used to prevent fraud and maintain platform integrity.</span>
              </li>
            </ul>
          </SectionCard>

          <SectionCard id="gmail-access" title="3. Gmail Access & Scope" icon={<Database className="w-5 h-5 text-red-500" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              To evaluate incoming communications, Inbox Sentinel requests explicit, restricted OAuth scopes from Google. Our technical architecture enforces strict operational boundaries:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="flex items-start gap-2.5 bg-secondary/30 p-3 rounded-xl border border-border/50">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="block text-foreground font-semibold">Strict Read-Only Access</strong>
                  <span className="text-muted-foreground">We request read-only permissions to analyze incoming email contents and headers.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 bg-secondary/30 p-3 rounded-xl border border-border/50">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="block text-foreground font-semibold">Never Deletes Emails</strong>
                  <span className="text-muted-foreground">Our systems have zero technical capability to delete, trash, or erase your emails.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 bg-secondary/30 p-3 rounded-xl border border-border/50">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="block text-foreground font-semibold">Never Sends Unauthorized Emails</strong>
                  <span className="text-muted-foreground">Inbox Sentinel does not send unsolicited emails from your account or create background drafts without your manual command.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 bg-secondary/30 p-3 rounded-xl border border-border/50">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="block text-foreground font-semibold">No Human Mail Snooping</strong>
                  <span className="text-muted-foreground">No human employee or contractor reads your private email bodies. All triage is automated via machine algorithms.</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Email payloads fetched for consequence analysis are parsed transiently in ephemeral memory and discarded upon completion of the analysis pass.
            </p>
          </SectionCard>

          <SectionCard id="google-api-services" title="4. Google API Services User Data Policy Disclosure" icon={<Shield className="w-5 h-5 text-blue-400" />}>
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/25 mb-4">
              <p className="text-xs sm:text-sm text-foreground font-medium leading-relaxed">
                Inbox Sentinel's use and transfer to any other app of information received from Google APIs will adhere to the{" "}
                <a 
                  href="https://developers.google.com/terms/api-services-user-data-policy" 
                  className="text-primary font-semibold underline underline-offset-2" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Google API Services User Data Policy
                </a>
                , including the Limited Use requirements.
              </p>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>We do not transfer or disclose Google user data to third parties, except as strictly necessary to provide the service (such as calling AI inference endpoints via TLS), comply with applicable laws, or as part of a corporate merger.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>We never use Google user data for serving advertisements, personalized marketing, retargeting, or credit evaluation.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>We do not permit humans to read Google user data unless you provide affirmative agreement for specific troubleshooting or when required by court subpoena.</span>
              </li>
            </ul>
          </SectionCard>

          <SectionCard id="ai-processing" title="5. AI Processing & Zero Base-Model Training Guarantee" icon={<Brain className="w-5 h-5 text-purple-500" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              We process email text through state-of-the-art Large Language Models (primarily Google Gemini API and OpenAI enterprise endpoints). We provide the following institutional legal commitments:
            </p>
            <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50">
                <strong className="block text-foreground mb-1">Zero Training on Private Communications</strong>
                Your email messages, personal drafts, sender identities, and attachments are <strong>NEVER used to train, retrain, fine-tune, or improve generalized foundation AI models</strong> by us or our AI sub-processors. Data is processed exclusively under zero-data-retention or commercial API privacy terms.
              </div>
              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50">
                <strong className="block text-foreground mb-1">Pre-Filtering & Data Minimization</strong>
                Our ingestion engine removes tracking pixels, raw binary attachments, and boilerplate signatures prior to passing the relevant context window to the AI inference engine.
              </div>
            </div>
          </SectionCard>

          <SectionCard id="personal-intelligence" title="6. Personal Intelligence Engine & Memory Attributes" icon={<Brain className="w-5 h-5 text-indigo-400" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              For users on the <strong>Ultra Plan</strong>, the Platform maintains an autonomous Personal Intelligence Profile to deliver executive triage calibration:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>• <strong>User-Authored Profile Items:</strong> Professional context, strategic priorities, and VIP designations entered manually by you.</li>
              <li>• <strong>Observation Review Gate:</strong> Inferences derived automatically from communication patterns are staged in a pending state until explicitly approved by you.</li>
              <li>• <strong>Full Portability & Purge:</strong> You maintain the unconditional right to inspect, edit, or permanently purge any or all stored intelligence attributes instantly from Settings &gt; Intelligence.</li>
            </ul>
          </SectionCard>

          <SectionCard id="payment-processing" title="7. Payment & Billing Data Security" icon={<CreditCard className="w-5 h-5 text-amber-400" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Payments for Pro and Ultra subscriptions are processed exclusively via <strong>Razorpay</strong> (Razorpay Software Private Limited), an RBI-authorized payment aggregator certified under PCI-DSS Level 1.
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>• <strong>No Card Storage:</strong> Inbox Sentinel servers never receive, process, or store credit card numbers, debit card PINs, CVVs, or bank net banking credentials.</li>
              <li>• <strong>Stored Billing Records:</strong> We store only non-sensitive transactional identifiers (Razorpay Order ID, Payment ID, payment timestamp, currency, amount billed, and subscription plan status) to maintain your license and issue tax invoices.</li>
              <li>• For complete payment terms, visit our dedicated <Link href="/refund" className="text-primary hover:underline font-semibold">Cancellation, Refund & Payment Policy</Link>.</li>
            </ul>
          </SectionCard>

          <SectionCard id="security-encryption" title="8. Security & Encryption Standards" icon={<Lock className="w-5 h-5 text-emerald-400" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              We employ defense-in-depth infrastructure safeguards to protect your personal data:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-secondary/30 rounded-xl border border-border/50">
                <strong className="block text-foreground font-semibold mb-1">AES-256-GCM Encryption</strong>
                Sensitive tokens (OAuth refresh credentials, API keys) are encrypted at rest using industry-standard authenticated encryption algorithms.
              </div>
              <div className="p-3 bg-secondary/30 rounded-xl border border-border/50">
                <strong className="block text-foreground font-semibold mb-1">TLS 1.3 In Transit</strong>
                All inbound and outbound communications across client, edge servers, and databases require modern TLS 1.3 with cryptographic forward secrecy.
              </div>
              <div className="p-3 bg-secondary/30 rounded-xl border border-border/50">
                <strong className="block text-foreground font-semibold mb-1">Automated Rate Limiting</strong>
                API endpoints and authentication routes are guarded by distributed rate limiters to deflect brute-force attacks and abuse.
              </div>
              <div className="p-3 bg-secondary/30 rounded-xl border border-border/50">
                <strong className="block text-foreground font-semibold mb-1">Isolation & Row Security</strong>
                Database access enforces strict user ownership checks; cross-tenant data access is architecturally prohibited.
              </div>
            </div>
          </SectionCard>

          <SectionCard id="data-retention" title="9. Data Retention & Account Deletion" icon={<History className="w-5 h-5 text-yellow-500" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              We retain personal information only for the minimum duration necessary:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>• <strong>Transient Email Data:</strong> Raw email bodies are processed in-memory and discarded upon completion of AI consequence scoring.</li>
              <li>• <strong>Triage Summaries:</strong> Urgency ratings and bullet summaries are retained to display your dashboard feeds and analytics until you clear them.</li>
              <li>• <strong>Account Purge Guarantee:</strong> If you request account closure or delete your profile, all corresponding database records (tokens, personal profile items, cached metrics, order references) are permanently eradicated within 30 calendar days, except where retention is legally mandated by tax regulations.</li>
            </ul>
          </SectionCard>

          <SectionCard id="notifications" title="10. Urgent Notification Channels (WhatsApp & Telegram)" icon={<Bell className="w-5 h-5 text-orange-400" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Notifications to mobile devices are strictly opt-in:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>• <strong>No Raw Body Transmission:</strong> Only the distilled AI summary, urgency score, and required action item are transmitted over WhatsApp (Meta Cloud API) or Telegram Bot API. Full email bodies are never broadcast across third-party messengers.</li>
              <li>• <strong>Revocation:</strong> You can disconnect your Telegram or WhatsApp routing anytime from Settings &gt; Integrations.</li>
            </ul>
          </SectionCard>

          <SectionCard id="third-party" title="11. Sub-processors & Infrastructure Partners" icon={<Server className="w-5 h-5 text-cyan-400" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              We partner with trusted enterprise cloud vendors to deliver Inbox Sentinel:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                { name: "Google Cloud", role: "OAuth & Pub/Sub" },
                { name: "Google Gemini", role: "AI Inference" },
                { name: "OpenAI", role: "AI Processing (BYOK)" },
                { name: "Razorpay", role: "Payment Gateway" },
                { name: "Oracle Cloud", role: "Encrypted Database" },
                { name: "Vercel", role: "Edge Application Hosting" },
                { name: "Resend", role: "Transactional Email" },
                { name: "Meta Cloud API", role: "WhatsApp Alerts (Opt-in)" },
                { name: "Telegram API", role: "Telegram Alerts (Opt-in)" },
              ].map((sp) => (
                <div key={sp.name} className="p-2.5 rounded-xl bg-secondary/30 border border-border/40">
                  <span className="font-semibold text-foreground block">{sp.name}</span>
                  <span className="text-muted-foreground text-[11px]">{sp.role}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard id="user-controls" title="12. Your Data Rights & User Controls" icon={<Settings className="w-5 h-5 text-pink-400" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Under applicable data protection laws (including the Digital Personal Data Protection Act, 2023 and GDPR where applicable), you enjoy full autonomy:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>• <strong>Access & Portability:</strong> Request an export of your stored personal intelligence attributes and profile data.</li>
              <li>• <strong>Revocation of Google Access:</strong> You can unilaterally revoke Inbox Sentinel's access to your Google account at any moment via <a href="https://myaccount.google.com/permissions" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google Account Security Permissions</a>.</li>
              <li>• <strong>Right to Erasure:</strong> Delete your account and request complete eradication of data by emailing support.</li>
            </ul>
          </SectionCard>

          <SectionCard id="children" title="13. Children's Privacy" icon={<Baby className="w-5 h-5 text-emerald-400" />}>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Inbox Sentinel is strictly intended for individuals who are at least 18 years of age (or the legal age of majority in their jurisdiction). We do not knowingly collect or solicit personal data from children under 18.
            </p>
          </SectionCard>

          <SectionCard id="changes" title="14. Policy Amendments" icon={<FileText className="w-5 h-5 text-gray-400" />}>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We may revise this Privacy Policy periodically to reflect technological, operational, or legal developments. When changes are made, we will update the "Last Updated" date at the top of this document. Continued use of the platform after notice of modifications constitutes your acceptance of the revised terms.
            </p>
          </SectionCard>

          <SectionCard id="contact-grievance" title="15. Grievance Officer & Statutory Contact" icon={<HelpCircle className="w-5 h-5 text-indigo-400" />}>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              In accordance with the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023, the details of the designated Grievance Officer for Inbox Sentinel are:
            </p>
            <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 text-xs sm:text-sm space-y-1.5">
              <p><strong className="text-foreground">Name:</strong> Md Noor Hasan Ansari</p>
              <p><strong className="text-foreground">Title:</strong> Grievance Officer & Data Controller, Inbox Sentinel</p>
              <p><strong className="text-foreground">Official Email:</strong> <a href="mailto:mdnoorhasan1720@gmail.com" className="text-primary hover:underline">mdnoorhasan1720@gmail.com</a></p>
              <p><strong className="text-foreground">Official Website:</strong> <a href="https://mail.tars.homes" className="text-primary hover:underline">https://mail.tars.homes</a></p>
              <p><strong className="text-foreground">Jurisdiction:</strong> Bihar / New Delhi, India</p>
              <p className="text-muted-foreground pt-1">
                Grievances are formally acknowledged within 24 hours and addressed within 15 working days.
              </p>
            </div>
          </SectionCard>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border py-8 px-6 bg-background">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground font-medium">
          <p>&copy; {new Date().getFullYear()} Inbox Sentinel. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-foreground font-semibold">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
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
