import { Metadata } from "next";
import Link from "next/link";
import { Mail, Shield, User, Brain, Bell, Settings, Database, Link as LinkIcon, ArrowLeft, Clock, History, FileText, Baby } from "lucide-react";
import { APP_CONFIG } from "@/config/app";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how Inbox Sentinel protects your data, secures your emails, and respects your privacy.",
};

const SECTIONS = [
  { id: "introduction", title: "1. Introduction", icon: <Mail className="w-4 h-4" /> },
  { id: "information-we-collect", title: "2. Information We Collect", icon: <User className="w-4 h-4" /> },
  { id: "gmail-access", title: "3. Gmail Access", icon: <Database className="w-4 h-4" /> },
  { id: "google-api-services", title: "4. Google API Services", icon: <Shield className="w-4 h-4" /> },
  { id: "ai-processing", title: "5. AI Processing", icon: <Brain className="w-4 h-4" /> },
  { id: "data-retention", title: "6. Data Retention", icon: <History className="w-4 h-4" /> },
  { id: "security", title: "7. Security", icon: <Shield className="w-4 h-4" /> },
  { id: "notifications", title: "8. Notifications", icon: <Bell className="w-4 h-4" /> },
  { id: "third-party", title: "9. Third-party Services", icon: <LinkIcon className="w-4 h-4" /> },
  { id: "user-controls", title: "10. User Controls", icon: <Settings className="w-4 h-4" /> },
  { id: "children", title: "11. Children", icon: <Baby className="w-4 h-4" /> },
  { id: "changes", title: "12. Changes to this Policy", icon: <FileText className="w-4 h-4" /> },
  { id: "contact", title: "13. Contact", icon: <Mail className="w-4 h-4" /> },
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
            Privacy Policy
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
            We believe in total transparency. Learn exactly how Inbox Sentinel protects your data, secures your emails, and respects your privacy.
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
          
          <SectionCard id="introduction" title="1. Introduction" icon={<Mail className="w-6 h-6 text-blue-500" />}>
            <p className="text-muted-foreground leading-relaxed">
              Inbox Sentinel is an AI-powered email intelligence platform. We provide automated categorization, urgency detection, and notification routing for your emails. This Privacy Policy explains our factual implementation details regarding how we collect, use, and protect your information to deliver these services.
            </p>
          </SectionCard>

          <SectionCard id="information-we-collect" title="2. Information We Collect" icon={<User className="w-6 h-6 text-green-500" />}>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We collect the minimum amount of information required to provide our services. This includes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
              <li><strong>Profile Information:</strong> Name, Email, and Google profile image (via Google OAuth).</li>
              <li><strong>Contact Information (Optional):</strong> Phone number and Telegram username/Chat ID, collected only if you explicitly opt-in to notifications on those platforms.</li>
              <li><strong>Preferences:</strong> Your notification thresholds and routing rules.</li>
              <li><strong>System Data:</strong> Security audit logs (login attempts, profile updates) to secure your account.</li>
            </ul>
          </SectionCard>

          <SectionCard id="gmail-access" title="3. Gmail Access" icon={<Database className="w-6 h-6 text-red-500" />}>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To provide email analysis, we request access to your Gmail account. Our access is strictly limited:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="flex items-start gap-2 bg-secondary/30 p-3 rounded-lg border border-border/50">
                <Shield className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm font-medium">Read-only scope requested</span>
              </div>
              <div className="flex items-start gap-2 bg-secondary/30 p-3 rounded-lg border border-border/50">
                <Shield className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm font-medium">Emails are never modified</span>
              </div>
              <div className="flex items-start gap-2 bg-secondary/30 p-3 rounded-lg border border-border/50">
                <Shield className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm font-medium">Emails are never deleted</span>
              </div>
              <div className="flex items-start gap-2 bg-secondary/30 p-3 rounded-lg border border-border/50">
                <Shield className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm font-medium">Emails are never sent</span>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Inbox Sentinel only reads your emails to fetch the payload required to generate AI analysis. We do not create drafts, organize folders, or alter your inbox state in any way.
            </p>
          </SectionCard>

          <SectionCard id="google-api-services" title="4. Google API Services" icon={<Shield className="w-6 h-6 text-blue-400" />}>
            <p className="text-muted-foreground leading-relaxed">
              Inbox Sentinel's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements.
            </p>
          </SectionCard>

          <SectionCard id="ai-processing" title="5. AI Processing" icon={<Brain className="w-6 h-6 text-purple-500" />}>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Your emails are analyzed using Google Gemini AI to generate intelligent insights.
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
              <li>Only the information required for analysis (Subject, Sender, Date, and body text) is processed.</li>
              <li>The AI generates summaries, urgency scores, action items, and extracts deadlines.</li>
              <li>We pre-filter and truncate emails locally when possible to minimize the amount of text sent to the AI provider.</li>
            </ul>
          </SectionCard>

          <SectionCard id="data-retention" title="6. Data Retention" icon={<History className="w-6 h-6 text-yellow-600" />}>
            <p className="text-muted-foreground leading-relaxed">
              We retain information only for as long as necessary to provide the service, maintain security, comply with legal obligations, or until you request deletion of your account where applicable.
            </p>
          </SectionCard>

          <SectionCard id="security" title="7. Security" icon={<Shield className="w-6 h-6 text-yellow-500" />}>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We employ strict security measures to protect your data at rest and in transit:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
              <li><strong>Encryption:</strong> Sensitive data, such as OAuth tokens, are encrypted at rest using AES-256-GCM.</li>
              <li><strong>Authentication:</strong> Secure, industry-standard OAuth is used for Google login and Gmail integration.</li>
              <li><strong>Transport:</strong> All data is transmitted securely over HTTPS.</li>
              <li><strong>Monitoring:</strong> Rate limiting and extensive audit logging are active to prevent brute-force attacks and track security events.</li>
            </ul>
          </SectionCard>

          <SectionCard id="notifications" title="8. Notifications" icon={<Bell className="w-6 h-6 text-orange-500" />}>
            <p className="text-muted-foreground leading-relaxed">
              Users must explicitly opt-in before any notifications are dispatched to WhatsApp or Telegram. 
              <br /><br />
              <strong>Privacy Guarantee:</strong> We only deliver the AI-generated summary, urgency score, and reasoning via notification providers. The raw, original email body is <strong>never</strong> sent through WhatsApp or Telegram.
              <br /><br />
              Notification providers receive only the minimum information required to deliver notifications.
            </p>
          </SectionCard>

          <SectionCard id="third-party" title="9. Third-party Services" icon={<LinkIcon className="w-6 h-6 text-cyan-500" />}>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We utilize the following external services to operate Inbox Sentinel:
            </p>
            <div className="flex flex-wrap gap-2">
              {["Google OAuth", "Gmail API", "Google Gemini", "Google Cloud Pub/Sub", "Neon", "Vercel", "Meta", "Telegram", "Resend"].map(service => (
                <span key={service} className="px-3 py-1 bg-secondary/50 border border-border rounded-full text-sm font-medium text-foreground">
                  {service}
                </span>
              ))}
            </div>
          </SectionCard>

          <SectionCard id="user-controls" title="10. User Controls" icon={<Settings className="w-6 h-6 text-pink-500" />}>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You maintain full control over your data. Through the application dashboard, you can:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
              <li>Disconnect your Gmail account and revoke access at any time.</li>
              <li>Disable or customize your notification routing preferences.</li>
              <li>You may request deletion of your account.</li>
            </ul>
          </SectionCard>

          <SectionCard id="children" title="11. Children" icon={<Baby className="w-6 h-6 text-green-400" />}>
            <p className="text-muted-foreground leading-relaxed">
              Inbox Sentinel is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
            </p>
          </SectionCard>

          <SectionCard id="changes" title="12. Changes to this Policy" icon={<FileText className="w-6 h-6 text-gray-400" />}>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. Material changes will be reflected by updating the "Last Updated" date at the top of this page.
            </p>
          </SectionCard>

          <SectionCard id="contact" title="13. Contact" icon={<Mail className="w-6 h-6 text-indigo-500" />}>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you have any questions about how your data is handled or wish to exercise your data rights, please contact us.
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
