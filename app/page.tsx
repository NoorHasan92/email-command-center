"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/config/app";
import { motion } from "framer-motion";
import { Mail, Shield, Zap, ArrowRight, ChevronRight, CheckCircle2 } from "lucide-react";
import { ROUTES } from "@/config/routes";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden selection:bg-primary/20">
      
      {/* Navigation */}
      <header className="absolute top-0 w-full flex items-center justify-between px-6 py-6 z-50">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Mail className="w-4 h-4 text-primary-foreground" />
          </div>
          {APP_CONFIG.name}
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Log in
          </Link>
          <Link href="/register">
            <Button size="sm" className="rounded-full px-5">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-20 px-6 relative">
        
        {/* Background Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/20 blur-[120px] rounded-full opacity-50 pointer-events-none" />

        <div className="max-w-4xl w-full flex flex-col items-center text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border text-sm font-medium mb-8 text-muted-foreground"
          >
            <span className="flex h-2 w-2 rounded-full bg-primary" />
            Introducing the Consequence Engine <ChevronRight className="w-4 h-4 ml-1" />
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]"
          >
            Your inbox, <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
              curated by AI.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed"
          >
            Inbox Sentinel uses advanced language models to read, classify, and extract deadlines from your emails. Never miss a critical action item again.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="rounded-full w-full sm:w-auto h-12 px-8 text-base group">
                Start for free
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href={ROUTES.dashboard} className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="rounded-full w-full sm:w-auto h-12 px-8 text-base bg-background/50 backdrop-blur-sm">
                Open App
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Feature Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 max-w-5xl w-full z-10"
        >
          <FeatureCard 
            icon={<Shield className="w-6 h-6 text-orange-500" />}
            title="Consequence Engine"
            description="AI predicts what happens if you ignore an email, so you know exactly what's at stake."
          />
          <FeatureCard 
            icon={<Zap className="w-6 h-6 text-yellow-500" />}
            title="Opportunity Detection"
            description="Automatically flags internships, jobs, and hackathons hidden in newsletters."
          />
          <FeatureCard 
            icon={<CheckCircle2 className="w-6 h-6 text-green-500" />}
            title="Auto-Extraction"
            description="Pulls out hard deadlines and action items, syncing them directly to your dashboard."
          />
        </motion.div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 flex flex-col gap-4 hover:bg-secondary/20 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center border border-border">
        {icon}
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}
