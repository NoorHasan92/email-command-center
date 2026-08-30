"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { 
  ShieldAlert, CheckCircle, Clock, Activity, 
  Check, Clock3, EyeOff, MoreHorizontal, X, Inbox,
  Zap, Mail, ShieldCheck, Flame, BellRing, BellOff, Sparkles, AlertCircle, ArrowRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useSession } from "next-auth/react";

import { Email, EmailAnalysis } from "@prisma/client";

import { useRouter, useSearchParams } from "next/navigation";

export type EmailWithAnalysis = Email & {
  analysis: EmailAnalysis | null;
  emailAccount?: {
    provider: string;
    emailAddress: string;
  };
};

interface HealthData {
  criticalCount: number;
  actionRequiredCount: number;
  deadlinesToday: number;
  deadlinesWeek: number;
  lastSync: string | null;
}

export default function DashboardClient({ 
  initialEmails, 
  healthData,
  recentNotifications,
  emailAccounts,
  selectedAccountId
}: { 
  initialEmails: EmailWithAnalysis[];
  healthData: HealthData;
  recentNotifications?: any[];
  emailAccounts?: { id: string; emailAddress: string }[];
  selectedAccountId?: string | null;
}) {
  const [emails, setEmails] = useState(initialEmails);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    setEmails(initialEmails);
  }, [initialEmails]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const healthScore = Math.max(0, 100 - (healthData.criticalCount * 15) - (healthData.actionRequiredCount * 5));
  
  const opportunities = emails.filter(e => e.analysis?.category === 'Opportunity').slice(0, 4);
  const deadlines = emails.filter(e => e.analysis?.deadline).slice(0, 4);

  return (
    <div className="h-full w-full bg-transparent overflow-auto">
      <div className="p-6 pb-24 max-w-6xl mx-auto w-full space-y-8 z-10 relative">
        
        {/* Personalized Hero */}
        <section className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-6 border-b border-border/50">
          <div className="space-y-4 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
              <h1 className="text-4xl font-bold tracking-tight">
                {greeting()}, {session?.user?.name?.split(' ')[0] || "User"} <span className="inline-block hover:animate-wiggle cursor-default">👋</span>
              </h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span className="font-medium text-foreground">Inbox Protected</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>Monitoring: <span className="text-foreground font-medium">
                  {selectedAccountId && emailAccounts ? emailAccounts.find(a => a.id === selectedAccountId)?.emailAddress : (emailAccounts && emailAccounts.length > 1 ? "All Accounts" : session?.user?.email || "Connected Account")}
                </span></span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span>Last Sync: <span className="text-foreground font-medium">{healthData.lastSync ? formatDistanceToNow(new Date(healthData.lastSync), { addSuffix: true }) : "Just now"}</span></span>
              </div>
            </div>
          </div>
          <div className="bg-secondary/30 border border-border/50 px-4 py-3 rounded-xl flex items-start gap-3 max-w-sm w-full md:w-auto shrink-0">
            <Sparkles className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">AI analyzed {initialEmails.length || 13} emails today.</p>
              {healthData.actionRequiredCount > 0 ? (
                <p className="text-muted-foreground">{healthData.actionRequiredCount} emails need your attention.</p>
              ) : healthData.criticalCount > 0 ? (
                <p className="text-muted-foreground text-red-400">{healthData.criticalCount} critical threats detected.</p>
              ) : (
                <p className="text-muted-foreground">No critical threats detected.</p>
              )}
            </div>
          </div>
        </section>

        {/* Dashboard Hierarchy */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Large Card: AI Health */}
          <Card className="col-span-1 md:col-span-6 lg:col-span-4 bg-card/90 backdrop-blur border-border/50 shadow-sm flex flex-col justify-between overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 rounded-full blur-[80px] group-hover:bg-emerald-500/10 transition-colors" />
            <CardContent className="p-6 relative z-10 h-full flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-500" /> AI Health Score
                </h3>
              </div>
              <div className="mt-auto">
                <div className="text-6xl font-black tracking-tighter mb-2">{healthScore}<span className="text-3xl text-muted-foreground">%</span></div>
                <p className="text-muted-foreground">
                  {healthScore >= 90 ? "Everything looks safe today." : healthScore >= 70 ? "Some items require attention." : "Critical attention needed."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Medium Cards */}
          <div className="col-span-1 md:col-span-6 lg:col-span-5 grid grid-cols-2 lg:grid-cols-1 lg:grid-rows-2 gap-4 md:gap-6">
            <Card className="bg-card/90 backdrop-blur border-border/50 shadow-sm group hover:border-red-500/30 transition-colors">
              <CardContent className="p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between h-full gap-3 md:gap-0">
                <div>
                  <p className="text-xs md:text-sm font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Critical</p>
                  <div className="flex flex-col md:flex-row md:items-end gap-1 md:gap-3">
                    <span className="text-3xl md:text-4xl font-bold">{healthData.criticalCount}</span>
                    <span className="text-[10px] md:text-sm text-red-500 font-medium md:mb-1 flex items-center gap-1">
                      {healthData.criticalCount > 0 ? "Action needed" : "All clear"}
                    </span>
                  </div>
                </div>
                <div className="hidden md:flex h-12 w-12 rounded-full bg-red-500/10 items-center justify-center">
                  <ShieldAlert className={`h-6 w-6 ${healthData.criticalCount > 0 ? "text-red-500" : "text-red-500/50"}`} />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/90 backdrop-blur border-border/50 shadow-sm group hover:border-orange-500/30 transition-colors">
              <CardContent className="p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between h-full gap-3 md:gap-0">
                <div>
                  <p className="text-xs md:text-sm font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Action Required</p>
                  <div className="flex flex-col md:flex-row md:items-end gap-1 md:gap-3">
                    <span className="text-3xl md:text-4xl font-bold">{healthData.actionRequiredCount}</span>
                    <span className="text-[10px] md:text-sm text-orange-500 font-medium md:mb-1">
                      Pending
                    </span>
                  </div>
                </div>
                <div className="hidden md:flex h-12 w-12 rounded-full bg-orange-500/10 items-center justify-center">
                  <CheckCircle className={`h-6 w-6 ${healthData.actionRequiredCount > 0 ? "text-orange-500" : "text-orange-500/50"}`} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Small Stats */}
          <div className="col-span-1 md:col-span-12 lg:col-span-3 grid grid-cols-2 lg:grid-cols-1 gap-4 md:gap-6">
             <Card className="bg-card/90 backdrop-blur border-border/50 shadow-sm">
              <CardContent className="p-5 flex flex-col justify-center h-full">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Emails Today</p>
                </div>
                <span className="text-3xl font-bold">{initialEmails.length || 24}</span>
              </CardContent>
            </Card>
             <Card className="bg-card/90 backdrop-blur border-border/50 shadow-sm">
              <CardContent className="p-5 flex flex-col justify-center h-full">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time Saved</p>
                </div>
                <span className="text-3xl font-bold text-blue-500">42m</span>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Dynamic Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Opportunities Panel */}
          <section className="bg-card/90 backdrop-blur border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col h-[420px]">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <Flame className="w-4 h-4 text-purple-500" />
                </div>
                <h2 className="text-lg font-semibold tracking-tight">AI Suggestions</h2>
              </div>
              <Badge variant="secondary" className="bg-purple-500/10 text-purple-500 hover:bg-purple-500/20">
                {opportunities.length} found
              </Badge>
            </div>
            
            <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
              <div className="space-y-4">
                {opportunities.map((email) => (
                  <div key={email.id} className="group relative flex flex-col p-4 bg-secondary/20 hover:bg-secondary/50 rounded-xl border border-border/40 transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-[10px] font-semibold tracking-wider text-purple-500 border-purple-500/30 bg-purple-500/5">
                        {email.analysis?.urgencyScore && email.analysis.urgencyScore >= 80 ? "HIGH IMPACT" : "OPPORTUNITY"}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-medium">{formatDistanceToNow(new Date(email.date), { addSuffix: true })}</span>
                    </div>
                    <span className="font-semibold text-sm mb-1 leading-snug line-clamp-1">{email.subject}</span>
                    <span className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {email.analysis?.summary || "AI identified a potential opportunity."}
                    </span>
                  </div>
                ))}
                {opportunities.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 mt-10">
                    <Sparkles className="w-10 h-10 mb-4 opacity-20" />
                    <p className="text-sm font-medium">AI found 0 opportunities worth reviewing.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </section>

          {/* Upcoming Deadlines Panel */}
          <section className="bg-card/90 backdrop-blur border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col h-[420px]">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Clock3 className="w-4 h-4 text-blue-500" />
                </div>
                <h2 className="text-lg font-semibold tracking-tight">Upcoming Deadlines</h2>
              </div>
            </div>
            <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
              <div className="space-y-4">
                {deadlines.map((email) => (
                  <div key={email.id} className="group flex flex-col p-4 bg-secondary/20 hover:bg-secondary/50 rounded-xl border border-border/40 transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-[10px] font-semibold tracking-wider text-blue-500 border-blue-500/30 bg-blue-500/5">
                        DEADLINE
                      </Badge>
                      <span className="text-xs font-semibold text-foreground">
                        {email.analysis?.deadline ? format(new Date(email.analysis.deadline), "MMM d, yyyy") : "Unknown"}
                      </span>
                    </div>
                    <span className="font-semibold text-sm mb-1 line-clamp-1">{email.subject}</span>
                    <span className="text-xs text-muted-foreground line-clamp-1">{email.analysis?.summary || "Action required before this date."}</span>
                  </div>
                ))}
                {deadlines.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 mt-10">
                    <Check className="w-10 h-10 mb-4 opacity-20" />
                    <p className="text-sm font-medium">No pressing deadlines right now.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </section>

        </div>
      </div>
    </div>
  );
}
