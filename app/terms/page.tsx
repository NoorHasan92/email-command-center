import { Metadata } from "next";
import Link from "next/link";
import { Mail, Shield, Brain, Bell, Database, ArrowLeft, Clock, CheckCircle2, Info, UserCheck, AlertTriangle, Copyright, Scale, RefreshCw, Power } from "lucide-react";
import { APP_CONFIG } from "@/config/app";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read the Terms of Service for using Inbox Sentinel.",
};

const SECTIONS = [
  { id: "acceptance", title: "1. Acceptance of Terms", icon: <CheckCircle2 className="w-4 h-4" /> },
  { id: "description", title: "2. Description of the Service", icon: <Info className="w-4 h-4" /> },
  { id: "responsibilities", title: "3. User Responsibilities", icon: <UserCheck className="w-4 h-4" /> },
  { id: "ai-disclaimer", title: "4. AI Disclaimer", icon: <AlertTriangle className="w-4 h-4" /> },
  { id: "notifications", title: "5. Notifications", icon: <Bell className="w-4 h-4" /> },
  { id: "gmail-access", title: "6. Gmail Access", icon: <Database className="w-4 h-4" /> },
  { id: "intellectual-property", title: "7. Intellectual Property", icon: <Copyright className="w-4 h-4" /> },
  { id: "limitation-of-liability", title: "8. Limitation of Liability", icon: <Scale className="w-4 h-4" /> },
  { id: "changes", title: "9. Changes to the Service", icon: <RefreshCw className="w-4 h-4" /> },
  { id: "termination", title: "10. Termination", icon: <Power className="w-4 h-4" /> },
  { id: "contact", title: "11. Contact", icon: <Mail className="w-4 h-4" /> },
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
        <Link 
          href="/" 
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-6 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 blur-[100px] rounded-full opacity-50 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
            Terms of Service
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
            Please read these terms carefully before using Inbox Sentinel. They govern your use of the platform and outline your rights and responsibilities.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground font-medium">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Last updated: August 3, 2026</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Effective Date: August 3, 2026</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 pb-24 flex flex-col md:flex-row gap-12 relative">
        
        {/* Sticky Sidebar (Desktop) */}
        <aside className="hidden md:block w-72 shrink-0">
          <div className="sticky top-24 flex flex-col gap-1 p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 px-3">
              Contents
            </h4>
            {SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                {section.icon}
                {section.title}
              </a>
            ))}
          </div>
        </aside>

        {/* Content Cards */}
        <div className="flex-1 flex flex-col gap-8">
          
          <SectionCard id="acceptance" title="1. Acceptance of Terms" icon={<CheckCircle2 className="w-6 h-6 text-green-500" />}>
            <p className="text-muted-foreground leading-relaxed">
              By accessing, registering for, or using Inbox Sentinel ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use the Service.
            </p>
          </SectionCard>

          <SectionCard id="description" title="2. Description of the Service" icon={<Info className="w-6 h-6 text-blue-500" />}>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Inbox Sentinel is an AI-powered productivity tool. It functions by:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
              <li>Reading incoming emails from your linked Gmail account (with your explicit permission).</li>
              <li>Analyzing these emails using artificial intelligence (Google Gemini).</li>
              <li>Generating summaries, detecting urgency, and extracting deadlines.</li>
              <li>Dispatching optional notifications based on your configured urgency thresholds.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              The service operates strictly on a read-only basis for your Gmail account.
            </p>
          </SectionCard>

          <SectionCard id="responsibilities" title="3. User Responsibilities" icon={<UserCheck className="w-6 h-6 text-indigo-500" />}>
            <p className="text-muted-foreground leading-relaxed mb-4">
              As a user of the Service, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
              <li>Provide accurate and complete account information during registration.</li>
              <li>Keep your authentication credentials (such as Google OAuth sessions) secure.</li>
              <li>Use the Service responsibly and not for any fraudulent, abusive, or malicious activity.</li>
              <li>Comply with all applicable local, state, national, and international laws and regulations.</li>
            </ul>
          </SectionCard>

          <SectionCard id="ai-disclaimer" title="4. AI Disclaimer" icon={<AlertTriangle className="w-6 h-6 text-yellow-500" />}>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Inbox Sentinel heavily relies on Artificial Intelligence (LLMs) to process and summarize data. By using the Service, you acknowledge and agree that:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="flex items-start gap-2 bg-secondary/30 p-3 rounded-lg border border-border/50">
                <Brain className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <span className="text-sm font-medium">AI summaries are strictly informational.</span>
              </div>
              <div className="flex items-start gap-2 bg-secondary/30 p-3 rounded-lg border border-border/50">
                <Brain className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <span className="text-sm font-medium">AI may generate inaccurate or incomplete outputs.</span>
              </div>
              <div className="flex items-start gap-2 bg-secondary/30 p-3 rounded-lg border border-border/50">
                <Brain className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <span className="text-sm font-medium">AI should not replace professional judgment.</span>
              </div>
              <div className="flex items-start gap-2 bg-secondary/30 p-3 rounded-lg border border-border/50">
                <Brain className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <span className="text-sm font-medium">You must verify important emails yourself.</span>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              We assume no liability for missed deadlines, misinterpreted emails, or failure to detect spam/phishing accurately.
            </p>
          </SectionCard>

          <SectionCard id="notifications" title="5. Notifications" icon={<Bell className="w-6 h-6 text-orange-500" />}>
            <p className="text-muted-foreground leading-relaxed">
              If you opt-in to WhatsApp or Telegram notifications, you understand that message delivery depends entirely on third-party services (such as Google Cloud, Vercel, Meta, and Telegram). Consequently, delivery timing, uptime, and reliability cannot be guaranteed. We are not responsible for missed or delayed notifications.
            </p>
          </SectionCard>

          <SectionCard id="gmail-access" title="6. Gmail Access" icon={<Database className="w-6 h-6 text-red-500" />}>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Inbox Sentinel requests minimal access to operate securely. We explicitly guarantee that the Service:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
              <li><strong>Never</strong> modifies your Gmail account.</li>
              <li><strong>Never</strong> deletes your emails.</li>
              <li><strong>Never</strong> sends emails on your behalf.</li>
              <li><strong>Never</strong> creates drafts.</li>
              <li><strong>Only</strong> reads emails after you provide explicit authorization.</li>
            </ul>
          </SectionCard>

          <SectionCard id="intellectual-property" title="7. Intellectual Property" icon={<Copyright className="w-6 h-6 text-purple-500" />}>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong>Your Data:</strong> You retain full ownership of all your email content and metadata processed by the Service.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Our Property:</strong> The Inbox Sentinel software, branding, design, logos, and source code remain the exclusive intellectual property of the developer. You may not copy, reverse engineer, or distribute our intellectual property without explicit consent.
            </p>
          </SectionCard>

          <SectionCard id="limitation-of-liability" title="8. Limitation of Liability" icon={<Scale className="w-6 h-6 text-pink-500" />}>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The Service is provided on an <strong>"AS IS"</strong> and "AS AVAILABLE" basis, without any warranties of any kind, either express or implied.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, Inbox Sentinel and its developer shall not be liable for any:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2 mt-4">
              <li>Mistakes, hallucinations, or errors made by the AI.</li>
              <li>Missed deadlines, lost opportunities, or missed notifications.</li>
              <li>Financial or business losses resulting from the use of the Service.</li>
              <li>Indirect, incidental, special, consequential, or punitive damages.</li>
            </ul>
          </SectionCard>

          <SectionCard id="changes" title="9. Changes to the Service" icon={<RefreshCw className="w-6 h-6 text-cyan-500" />}>
            <p className="text-muted-foreground leading-relaxed">
              We are constantly updating and improving Inbox Sentinel. We reserve the right to change, improve, suspend, or remove features of the Service at any time, with or without prior notice.
            </p>
          </SectionCard>

          <SectionCard id="termination" title="10. Termination" icon={<Power className="w-6 h-6 text-red-500" />}>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong>By You:</strong> You may stop using the Service at any time by disconnecting your Gmail account and requesting deletion of your Inbox Sentinel account.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>By Us:</strong> We reserve the right to suspend or terminate your access to the Service immediately, without prior notice or liability, if you breach these Terms or engage in abuse, fraud, or malicious activity.
            </p>
          </SectionCard>

          <SectionCard id="contact" title="11. Contact" icon={<Mail className="w-6 h-6 text-indigo-500" />}>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you have any questions about these Terms of Service, please contact us.
            </p>
            <div className="flex flex-col gap-2">
              <p className="text-muted-foreground">
                <strong className="text-foreground">Support Email:</strong> <a href="mailto:mdnoorhasan1720@gmail.com" className="text-primary hover:underline">mdnoorhasan1720@gmail.com</a>
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Website:</strong> <a href="https://mail.tars.homes" className="text-primary hover:underline">https://mail.tars.homes</a>
              </p>
            </div>
          </SectionCard>

        </div>
      </main>
    </div>
  );
}

function SectionCard({ id, title, icon, children }: { id: string, title: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <div 
      id={id} 
      className="scroll-mt-32 bg-card/50 backdrop-blur-md border border-border rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-secondary/80 flex items-center justify-center border border-border/50">
          {icon}
        </div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      </div>
      {children}
    </div>
  );
}
