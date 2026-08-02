"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { 
  Search, ShieldAlert, CheckCircle, Clock, Activity, 
  Check, Clock3, EyeOff, MoreHorizontal, X, Inbox
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { Email, EmailAnalysis } from "@prisma/client";
import { Lightbulb, Calendar, ThumbsUp, ThumbsDown, BellRing, BellOff, Sparkles, AlertCircle } from "lucide-react";

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
  recentNotifications
}: { 
  initialEmails: EmailWithAnalysis[];
  healthData: HealthData;
  recentNotifications?: any[];
}) {
  const [emails, setEmails] = useState(initialEmails);

  return (
    <div className="flex h-full w-full bg-transparent overflow-auto">
      <div className="p-6 max-w-6xl mx-auto w-full space-y-8 z-10 relative">
        
        {/* Inbox Health Dashboard */}
        <section>
          <h2 className="text-xl font-bold tracking-tight mb-4">Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <HealthCard 
              title="Critical" 
              value={healthData.criticalCount} 
              icon={<ShieldAlert className="w-5 h-5 text-destructive" />} 
              trend="Requires immediate attention"
            />
            <HealthCard 
              title="Action Required" 
              value={healthData.actionRequiredCount} 
              icon={<CheckCircle className="w-5 h-5 text-orange-500" />} 
              trend="Pending tasks"
            />
            <HealthCard 
              title="Deadlines Today" 
              value={healthData.deadlinesToday} 
              icon={<Clock className="w-5 h-5 text-blue-500" />} 
              trend="Due within 24h"
            />
            <HealthCard 
              title="Last Sync" 
              value={healthData.lastSync ? formatDistanceToNow(new Date(healthData.lastSync), { addSuffix: true }) : "Never"} 
              icon={<Activity className="w-5 h-5 text-muted-foreground" />} 
              trend="Gmail & WhatsApp active"
            />
          </div>
        </section>

        {/* Dashboard Additions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Opportunities Panel */}
          <section className="bg-card/90 backdrop-blur border border-border rounded-xl p-6 shadow-sm flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-md bg-yellow-500/10">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                </div>
                <h2 className="text-lg font-semibold tracking-tight">Opportunities</h2>
              </div>
            </div>
            <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
              <div className="space-y-4">
                {emails.filter(e => e.analysis?.priority === "HIGH" || e.analysis?.priority === "CRITICAL").map(email => (
                  <div key={email.id} className="flex flex-col gap-2 p-4 bg-secondary/30 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/20">{email.analysis?.priority}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(email.date), { addSuffix: true })}</span>
                    </div>
                    <span className="font-semibold text-sm truncate">{email.subject || "No Subject"}</span>
                    <span className="text-sm text-muted-foreground">{email.analysis?.summary}</span>
                  </div>
                ))}
                {emails.filter(e => e.analysis?.priority === "HIGH" || e.analysis?.priority === "CRITICAL").length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
                    <Lightbulb className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm">No high priority emails.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </section>

          {/* Upcoming Deadlines */}
          <section className="bg-card/90 backdrop-blur border border-border rounded-xl p-6 shadow-sm flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-md bg-blue-500/10">
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <h2 className="text-lg font-semibold tracking-tight">Upcoming Deadlines</h2>
              </div>
            </div>
            <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
              <div className="space-y-4">
                {emails.filter(e => e.analysis?.deadline != null).map((email, idx) => (
                    <div key={idx} className="flex flex-col gap-2 p-4 bg-secondary/30 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={`text-xs bg-blue-500/10 text-blue-500 border-blue-500/20`}>
                          Deadline
                        </Badge>
                        <span className="text-xs font-semibold text-foreground">{format(new Date(email.analysis!.deadline as Date), "MMM d, yyyy")}</span>
                      </div>
                      <span className="font-semibold text-sm truncate">{email.subject || "No Subject"}</span>
                      <span className="text-sm text-muted-foreground">Action required before this date.</span>
                    </div>
                  ))}
                  {emails.filter(e => e.analysis?.deadline != null).length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
                      <Calendar className="w-12 h-12 mb-4 opacity-20" />
                      <p className="text-sm">No upcoming deadlines detected.</p>
                    </div>
                  )}
              </div>
            </ScrollArea>
          </section>

          {/* Recent Notifications */}
          <section className="bg-card/90 backdrop-blur border border-border rounded-xl p-6 shadow-sm flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-md bg-green-500/10">
                  <BellRing className="w-5 h-5 text-green-500" />
                </div>
                <h2 className="text-lg font-semibold tracking-tight">Recent Notifications</h2>
              </div>
            </div>
            <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
              <div className="space-y-4">
                {recentNotifications?.map((log) => (
                  <div key={log.id} className="flex flex-col gap-2 p-4 bg-secondary/30 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={`text-xs ${log.status === 'FAILED' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                        {log.channel}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</span>
                    </div>
                    <span className="font-semibold text-sm truncate">{log.email?.subject || "No Subject"}</span>
                    <span className="text-xs text-muted-foreground">Status: {log.status}</span>
                  </div>
                ))}
                {(!recentNotifications || recentNotifications.length === 0) && (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
                    <BellOff className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm">No recent notifications.</p>
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

// ----------------------------------------------------------------------------
// Components
// ----------------------------------------------------------------------------

function HealthCard({ title, value, icon, trend }: { title: string, value: string | number, icon: React.ReactNode, trend: string }) {
  return (
    <Card className="bg-card border-border overflow-hidden group hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-muted-foreground">{title}</p>
          <div className="p-2.5 bg-secondary/80 rounded-xl transition-colors group-hover:bg-secondary">{icon}</div>
        </div>
        <div className="flex flex-col">
          <span className="text-4xl font-extrabold tracking-tight">{value}</span>
          <span className="text-sm text-muted-foreground mt-2 font-medium">{trend}</span>
        </div>
      </CardContent>
    </Card>
  );
}
