"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/config/app";
import { motion, AnimatePresence } from "framer-motion";
import {
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
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-white/20">
      
      {/* Navigation Bar */}
      <header className="sticky top-0 w-full flex items-center justify-between px-6 py-4 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <Image
            src="/app-logo.png"
            alt="Inbox Sentinel Logo"
            width={36}
            height={36}
            className="w-9 h-9 object-contain shrink-0"
            unoptimized
          />
          <span className="font-extrabold text-base tracking-tight text-white">{APP_CONFIG.name}</span>
          <span className="hidden sm:inline-block text-[11px] font-medium text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
            mail.tars.homes
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
          <a href="#security" className="hover:text-white transition-colors">Security</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          <Link href="/billing" className="hover:text-white transition-colors">Pricing</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="text-xs font-semibold text-zinc-300 hover:text-white transition-colors px-3 py-2">
            Log in
          </Link>
          <Link href="/register">
            <Button size="sm" className="rounded-full px-5 text-xs font-bold bg-white text-black hover:bg-zinc-200 transition-all shadow-sm">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center">
        <section className="w-full flex flex-col items-center justify-center pt-24 pb-20 px-6 relative overflow-hidden">
          
          {/* Subtle Monochrome Ambient Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-white/[0.04] blur-[140px] rounded-full pointer-events-none" />

          <div className="max-w-4xl w-full flex flex-col items-center text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium mb-6 text-zinc-300 backdrop-blur shadow-sm"
            >
              <span className="flex h-2 w-2 rounded-full bg-white animate-pulse" />
              <span>Inbox Sentinel • The Autonomous AI Chief of Staff</span>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-400 font-mono">mail.tars.homes</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.08] text-white"
            >
              Your Inbox, <br />
              <span className="text-zinc-400">Curated by AI.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-base sm:text-lg md:text-xl text-zinc-400 mb-8 max-w-2xl leading-relaxed font-normal"
            >
              Inbox Sentinel (<strong className="text-white font-semibold">mail.tars.homes</strong>) is your executive AI Chief of Staff. Powered by the Consequence Engine, Personal Intelligence Profiles, and Deep Research synthesis, it classifies urgency, extracts deadlines, and surfaces high-value opportunities.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto"
            >
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="rounded-full w-full sm:w-auto h-12 px-8 text-sm font-bold bg-white text-black hover:bg-zinc-200 transition-all shadow-lg group">
                  Start Free with Gmail
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href={ROUTES.dashboard} className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="rounded-full w-full sm:w-auto h-12 px-7 text-sm font-semibold bg-zinc-900/60 backdrop-blur-md border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800">
                  Open App Dashboard
                </Button>
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-xs font-medium text-zinc-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-zinc-300" />
                Read-Only Gmail Scope
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-zinc-300" />
                Zero Model Training
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-zinc-300" />
                Google Limited Use Compliant
              </span>
            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section id="features" className="w-full max-w-6xl px-6 py-20 border-t border-zinc-800/80">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-3 mb-4 text-white">
              Engineered for High-Stakes Professionals
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              Every feature of Inbox Sentinel is designed to eliminate cognitive inbox fatigue and surface critical business opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<Shield className="w-5 h-5 text-zinc-300" />}
              title="The Consequence Engine"
              badge="Flagship"
              description="Forecasts what happens if you ignore an email. Evaluates real-world business stakes, deadlines, and urgency so high-priority requests never slip through the cracks."
            />
            <FeatureCard 
              icon={<Brain className="w-5 h-5 text-zinc-300" />}
              title="Personal Intelligence Engine"
              badge="Ultra Tier"
              description="Continuously adapts to your executive identity, key project names, and VIP network to calibrate personalized relevance scoring with zero prompt drift."
            />
            <FeatureCard 
              icon={<Search className="w-5 h-5 text-zinc-300" />}
              title="10-Stage Deep Research"
              badge="Autonomous"
              description="Performs autonomous background web and context synthesis on high-value inbound inquiries, generating actionable briefs before your first meeting."
            />
            <FeatureCard 
              icon={<Key className="w-5 h-5 text-zinc-300" />}
              title="Bring Your Own Key (BYOK)"
              badge="Privacy First"
              description="Connect your personal Google Gemini or OpenAI API keys with AES-256-GCM encryption for unlimited, uncapped AI processing at cost."
            />
            <FeatureCard 
              icon={<Users className="w-5 h-5 text-zinc-300" />}
              title="Multi-Gmail Command Center"
              badge="Unified"
              description="Synchronize and triage multiple Google accounts inside a single unified cockpit, allowing seamless switching and cross-account context scoring."
            />
            <FeatureCard 
              icon={<Bell className="w-5 h-5 text-zinc-300" />}
              title="Zero-Noise Mobile Alerts"
              badge="Multi-Channel"
              description="Receive instant notifications via WhatsApp or Telegram strictly when urgency exceeds your configured threshold. Raw email bodies are never shared."
            />
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full max-w-5xl px-6 py-20 border-t border-zinc-800/80">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
              Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-3 mb-4 text-white">
              Up and Running in 60 Seconds
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              No complex setup scripts or desktop clients. Inbox Sentinel operates entirely in the cloud via secure Google OAuth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 relative">
              <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center text-sm font-bold mb-4 border border-zinc-800">
                1
              </div>
              <h3 className="text-base font-bold text-white mb-2">Connect Gmail</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Authenticate securely through Google OAuth 2.0. We request restricted read-only permissions and never modify or send emails.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 relative">
              <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center text-sm font-bold mb-4 border border-zinc-800">
                2
              </div>
              <h3 className="text-base font-bold text-white mb-2">AI Synthesizes Context</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                The Consequence Engine analyzes incoming communications in real-time, detecting deadlines, financial risks, and action items.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 relative">
              <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center text-sm font-bold mb-4 border border-zinc-800">
                3
              </div>
              <h3 className="text-base font-bold text-white mb-2">Zero-Noise Triage</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Review your executive dashboard or receive instant high-urgency notifications to your phone, reclaiming 2+ hours every day.
              </p>
            </div>
          </div>
        </section>

        {/* Security & Compliance Section */}
        <section id="security" className="w-full max-w-5xl px-6 py-16 border-t border-zinc-800/80">
          <div className="p-8 sm:p-10 rounded-3xl bg-zinc-950 border border-zinc-800 relative overflow-hidden">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-300 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 mb-4">
                <Lock className="w-3.5 h-3.5" />
                Institutional Security Standards
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4 text-white">
                Your Private Emails Stay Private. Period.
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                We believe executive email demands bank-grade safeguards. Inbox Sentinel adheres strictly to the Google API Services User Data Policy, enforces AES-256-GCM encryption for all tokens, and provides an unconditional zero base-model training guarantee.
              </p>
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-zinc-300">
                <Link href="/privacy" className="inline-flex items-center gap-1.5 text-white hover:underline">
                  Read Privacy Policy <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <Link href="/terms" className="inline-flex items-center gap-1.5 text-white hover:underline">
                  Terms of Service <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <Link href="/refund" className="inline-flex items-center gap-1.5 text-white hover:underline">
                  Refund & Payment Policy <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="w-full max-w-4xl px-6 py-20 border-t border-zinc-800/80">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
              Questions & Answers
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight mt-3 mb-3 text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-zinc-400">
              Essential information regarding Inbox Sentinel (<strong className="text-white">mail.tars.homes</strong>) and our email intelligence architecture.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-zinc-800/80 bg-zinc-950 overflow-hidden transition-colors hover:border-zinc-700"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-white cursor-pointer gap-4"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-white" : ""
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
                        <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-zinc-900">
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
          <div className="p-8 sm:p-12 rounded-3xl bg-zinc-950 border border-zinc-800 text-center relative overflow-hidden shadow-2xl">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-4 text-white">
              Reclaim Your Focus with Inbox Sentinel
            </h2>
            <p className="text-sm text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed">
              Join forward-thinking executives and professionals using <strong className="text-white font-semibold">mail.tars.homes</strong> to automate triage and protect critical deadlines.
            </p>
            <Link href="/register">
              <Button size="lg" className="rounded-full h-12 px-8 text-sm font-bold bg-white text-black hover:bg-zinc-200 transition-all shadow-xl">
                Get Started for Free
              </Button>
            </Link>
          </div>
        </section>

      </main>

      {/* Footer (No GitHub link, bird logo included) */}
      <footer className="w-full border-t border-zinc-800/80 py-10 px-6 bg-black">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-zinc-400">
          <div className="flex flex-col items-center md:items-start gap-1.5">
            <div className="flex items-center gap-2.5 font-bold text-white">
              <Image
                src="/app-logo.png"
                alt="Inbox Sentinel"
                width={24}
                height={24}
                className="w-6 h-6 object-contain shrink-0"
                unoptimized
              />
              Inbox Sentinel
            </div>
            <p className="text-[11px] text-zinc-500">
              Official SaaS Portal: <span className="font-mono text-zinc-400 font-medium">mail.tars.homes</span>. &copy; {new Date().getFullYear()} All rights reserved.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-medium">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/refund" className="hover:text-white transition-colors">Refund & Payments</Link>
            <a href="mailto:mdnoorhasan1720@gmail.com" className="hover:text-white transition-colors">Support</a>
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
    <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 flex flex-col justify-between hover:border-zinc-700 transition-all duration-300 group shadow-sm">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800 group-hover:scale-105 transition-transform text-white">
            {icon}
          </div>
          {badge && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">
              {badge}
            </span>
          )}
        </div>
        <h3 className="text-base font-bold text-white tracking-tight mb-2">{title}</h3>
        <p className="text-xs text-zinc-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
