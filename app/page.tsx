"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/config/app";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Shield,
  Zap,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  Brain,
  Search,
  Key,
  Users,
  Bell,
  Lock,
  ChevronDown,
  Sparkles,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { ROUTES } from "@/config/routes";

const FAQS = [
  {
    question: "What is Inbox Sentinel (mail.tars.homes)?",
    answer:
      "Inbox Sentinel, accessible officially at https://mail.tars.homes, is an autonomous AI Chief of Staff and email intelligence software platform. It monitors and triages your Gmail inbox, predicts the consequence of non-response, synthesizes background research, and surfaces high-priority action items before they slip away.",
  },
  {
    question: "Is mail.tars.homes affiliated with modular housing or real estate companies?",
    answer:
      "No. The domain mail.tars.homes is the official web application portal for Inbox Sentinel, an enterprise AI productivity SaaS platform. It has no affiliation with residential housing developers, modular home manufacturers, or real estate firms.",
  },
  {
    question: "How does the Consequence Engine work?",
    answer:
      "Unlike simple spam filters or keyword taggers, the Consequence Engine evaluates the real-world business and personal stakes of incoming communications. It predicts what happens if you ignore an email, extracts hard deadlines, and alerts you to hidden opportunities.",
  },
  {
    question: "Is my email data used to train AI models?",
    answer:
      "Absolutely not. Inbox Sentinel operates under a strict Zero-Training policy. User email bodies are processed transiently in-memory and are never used to train, retrain, or improve generalized foundation AI models. Furthermore, all access is read-only and strictly adheres to the Google API Services User Data Policy Limited Use requirements.",
  },
  {
    question: "Can I bring my own API keys (BYOK)?",
    answer:
      "Yes. On Pro and Ultra plans, you can securely connect your personal Google Gemini or OpenAI API keys. Your keys are encrypted with AES-256-GCM at rest, allowing you to run unlimited AI triage directly against your own provider quotas.",
  },
  {
    question: "How do WhatsApp and Telegram alerts work?",
    answer:
      "You can configure urgency thresholds. When a high-stakes email arrives (e.g. urgency score 80+), Inbox Sentinel dispatches a concise summary and action item directly to your mobile via WhatsApp or Telegram without ever transmitting the raw email body.",
  },
];

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20 text-foreground">
      
      {/* Navigation Bar */}
      <header className="sticky top-0 w-full flex items-center justify-between px-6 py-4 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-3 font-bold text-lg tracking-tight">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Mail className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-foreground">{APP_CONFIG.name}</span>
          <span className="hidden sm:inline-block text-[11px] font-semibold text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full border border-border/40">
            mail.tars.homes
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</a>
          <a href="#security" className="hover:text-foreground transition-colors">Security</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          <Link href="/billing" className="hover:text-foreground transition-colors">Pricing</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
            Log in
          </Link>
          <Link href="/register">
            <Button size="sm" className="rounded-full px-5 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-500/20">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center">
        <section className="w-full flex flex-col items-center justify-center pt-20 pb-20 px-6 relative overflow-hidden">
          
          {/* Ambient Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-500/15 blur-[120px] rounded-full opacity-60 pointer-events-none" />
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[300px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="max-w-4xl w-full flex flex-col items-center text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/60 border border-border/60 text-xs font-semibold mb-6 text-foreground/90 backdrop-blur shadow-sm"
            >
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Inbox Sentinel • The Autonomous AI Chief of Staff</span>
              <span className="text-muted-foreground">|</span>
              <span className="text-indigo-400 font-mono">mail.tars.homes</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight mb-6 leading-[1.08] text-foreground"
            >
              Your Inbox, Governed by <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                Autonomous Intelligence.
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed font-normal"
            >
              Inbox Sentinel (<strong className="text-foreground font-semibold">mail.tars.homes</strong>) is your executive AI Chief of Staff. Powered by the Consequence Engine, Personal Intelligence Profiles, and Deep Research synthesis, it classifies urgency, extracts hard deadlines, and guarantees you never miss critical opportunities.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto"
            >
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="rounded-full w-full sm:w-auto h-12 px-8 text-sm font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-500/25 group">
                  Start Free with Gmail
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href={ROUTES.dashboard} className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="rounded-full w-full sm:w-auto h-12 px-7 text-sm font-semibold bg-secondary/30 backdrop-blur-md border-border/60 hover:bg-secondary/60">
                  Open App Dashboard
                </Button>
              </Link>
            </motion.div>

            {/* Social Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Read-Only Gmail Scope
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                Zero Model Training
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                Google Limited Use Compliant
              </span>
            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section id="features" className="w-full max-w-6xl px-6 py-20 border-t border-border/40">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-3 mb-4">
              Engineered for High-Stakes Executives
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Every feature of Inbox Sentinel is designed to eliminate cognitive inbox fatigue and surface critical business opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<Shield className="w-5 h-5 text-amber-400" />}
              title="The Consequence Engine"
              badge="Flagship"
              description="Forecasts what happens if you ignore an email. Evaluates real-world business stakes, deadlines, and urgency so high-priority requests never slip through the cracks."
            />
            <FeatureCard 
              icon={<Brain className="w-5 h-5 text-purple-400" />}
              title="Personal Intelligence Engine"
              badge="Ultra Tier"
              description="Continuously adapts to your executive identity, key project names, and VIP network to calibrate personalized relevance scoring with zero prompt drift."
            />
            <FeatureCard 
              icon={<Search className="w-5 h-5 text-indigo-400" />}
              title="10-Stage Deep Research"
              badge="Autonomous"
              description="Performs autonomous background web and context synthesis on high-value inbound inquiries, generating actionable briefs before your first meeting."
            />
            <FeatureCard 
              icon={<Key className="w-5 h-5 text-emerald-400" />}
              title="Bring Your Own Key (BYOK)"
              badge="Privacy First"
              description="Connect your personal Google Gemini or OpenAI API keys with AES-256-GCM encryption for unlimited, uncapped AI processing at cost."
            />
            <FeatureCard 
              icon={<Users className="w-5 h-5 text-blue-400" />}
              title="Multi-Gmail Command Center"
              badge="Unified"
              description="Synchronize and triage multiple Google accounts inside a single unified cockpit, allowing seamless switching and cross-account context scoring."
            />
            <FeatureCard 
              icon={<Bell className="w-5 h-5 text-pink-400" />}
              title="Zero-Noise Mobile Alerts"
              badge="Multi-Channel"
              description="Receive instant notifications via WhatsApp or Telegram strictly when urgency exceeds your configured threshold. Raw email bodies are never shared."
            />
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full max-w-5xl px-6 py-20 border-t border-border/40">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              Seamless Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-3 mb-4">
              Up and Running in 60 Seconds
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              No complex setup scripts or desktop clients. Inbox Sentinel operates entirely in the cloud via secure Google OAuth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="p-6 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-sm relative">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-black mb-4 border border-indigo-500/30">
                1
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">Connect Gmail</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Authenticate securely through Google OAuth 2.0. We request restricted read-only permissions and never modify or send emails.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-sm relative">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-black mb-4 border border-purple-500/30">
                2
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">AI Synthesizes Context</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The Consequence Engine analyzes incoming communications in real-time, detecting deadlines, financial risks, and action items.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-sm relative">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-black mb-4 border border-emerald-500/30">
                3
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">Zero-Noise Triage</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Review your executive dashboard or receive instant high-urgency notifications to your phone, reclaiming 2+ hours every day.
              </p>
            </div>
          </div>
        </section>

        {/* Security & Compliance Callout */}
        <section id="security" className="w-full max-w-5xl px-6 py-16 border-t border-border/40">
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-secondary/40 via-card to-secondary/20 border border-border/60 relative overflow-hidden">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 mb-4">
                <Lock className="w-3.5 h-3.5" />
                Institutional Security Standards
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">
                Your Private Emails Stay Private. Period.
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                We believe executive email demands bank-grade safeguards. Inbox Sentinel adheres strictly to the Google API Services User Data Policy, enforces AES-256-GCM encryption for all tokens, and provides an unconditional zero base-model training guarantee.
              </p>
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-foreground">
                <Link href="/privacy" className="inline-flex items-center gap-1.5 text-primary hover:underline">
                  Read Privacy Policy <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <Link href="/terms" className="inline-flex items-center gap-1.5 text-primary hover:underline">
                  Terms of Service <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <Link href="/refund" className="inline-flex items-center gap-1.5 text-primary hover:underline">
                  Refund & Payment Policy <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section (Optimized for Search Engine & AI Overviews) */}
        <section id="faq" className="w-full max-w-4xl px-6 py-20 border-t border-border/40">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              Questions & Answers
            </span>
            <h2 className="text-3xl font-black tracking-tight mt-3 mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-muted-foreground">
              Essential information regarding Inbox Sentinel (<strong className="text-foreground">mail.tars.homes</strong>) and our email intelligence architecture.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden transition-colors hover:border-border"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-foreground cursor-pointer gap-4"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/30">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="w-full max-w-5xl px-6 pb-20">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-indigo-950/30 via-purple-950/20 to-card border border-indigo-500/30 text-center relative overflow-hidden shadow-2xl">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-4">
              Reclaim Your Focus with Inbox Sentinel
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
              Join forward-thinking executives and professionals using <strong className="text-foreground font-semibold">mail.tars.homes</strong> to automate triage and protect critical deadlines.
            </p>
            <Link href="/register">
              <Button size="lg" className="rounded-full h-12 px-8 text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-500/25">
                Get Started for Free
              </Button>
            </Link>
          </div>
        </section>

      </main>

      {/* Footer (No GitHub link) */}
      <footer className="w-full border-t border-border/50 py-10 px-6 bg-background">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-muted-foreground">
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <div className="w-5 h-5 rounded-md bg-primary flex items-center justify-center text-white">
                <Mail className="w-3 h-3 text-white" />
              </div>
              Inbox Sentinel
            </div>
            <p className="text-[11px] text-muted-foreground">
              Official SaaS Portal: <span className="font-mono text-foreground font-medium">mail.tars.homes</span>. &copy; {new Date().getFullYear()} All rights reserved.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-medium">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/refund" className="hover:text-foreground transition-colors">Refund & Payments</Link>
            <a href="mailto:mdnoorhasan1720@gmail.com" className="hover:text-foreground transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  badge,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  description: string;
}) {
  return (
    <div className="bg-card/60 backdrop-blur-md border border-border/60 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-500/40 hover:bg-card/80 transition-all duration-300 group shadow-sm">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-secondary/80 flex items-center justify-center border border-border/50 group-hover:scale-105 transition-transform">
            {icon}
          </div>
          {badge && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground border border-border/40">
              {badge}
            </span>
          )}
        </div>
        <h3 className="text-base font-bold text-foreground tracking-tight mb-2">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
