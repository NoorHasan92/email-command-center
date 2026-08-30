"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Mail, Clock, Brain, Inbox, Sparkles, TrendingUp, TrendingDown, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface AnalyticsData {
  hasData: boolean;
  stats?: {
    totalProcessed: number;
    criticalCount: number;
    timeSaved: string;
    accuracy: string;
  };
  aiStats?: {
    platform: number;
    personal: number;
    fallback: number;
  };
  activityData?: any[];
  categoryData?: any[];
}

export default function AnalyticsClient({ data }: { data: AnalyticsData }) {
  if (!data.hasData) {
    return (
      <div className="flex-1 flex flex-col h-full bg-transparent overflow-auto p-4 md:p-6 lg:p-10 z-10 relative">
        <div className="max-w-4xl mx-auto w-full h-full flex flex-col items-center justify-center text-center space-y-6 pb-24">
          <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center border border-primary/10 shadow-inner">
            <Inbox className="w-12 h-12 text-primary opacity-50" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Gathering Insights</h1>
          <p className="text-muted-foreground max-w-md">
            Your AI Chief of Staff is monitoring your inbox. Check back later once we have processed enough emails to generate meaningful, story-driven analytics about your workflow.
          </p>
          <div className="mt-4">
            <Link href="/integrations">
              <Button className="rounded-full px-8">Manage Integrations</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { stats, aiStats, activityData, categoryData } = data;

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-auto p-4 md:p-6 lg:p-10 z-10 relative">
      <div className="max-w-6xl mx-auto w-full space-y-6 md:space-y-8 pb-24">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">AI Insights</h1>
          <p className="text-muted-foreground">Discover how your AI Chief of Staff is optimizing your daily workflow.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InsightCard 
            title="Time Recovered" 
            metric={stats?.timeSaved || "0h 0m"} 
            narrative={`By analyzing ${stats?.totalProcessed || 0} emails and filtering out noise, your AI has given you back significant focus time.`}
            icon={<Clock className="w-6 h-6 text-blue-500" />}
            accentColor="bg-blue-500"
          />
          <InsightCard 
            title="Critical Actions Protected" 
            metric={stats?.criticalCount || 0} 
            narrative={`We successfully caught and highlighted high-priority deadlines and critical requests before they slipped through the cracks.`}
            icon={<Target className="w-6 h-6 text-emerald-500" />}
            accentColor="bg-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <Card className="col-span-1 lg:col-span-2 bg-card/80 backdrop-blur border-border/50 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-secondary/10 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Email Volume (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorProcessed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" strokeOpacity={0.8} />
                    <XAxis dataKey="name" stroke="#888" tick={{ fill: '#888' }} fontSize={12} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#888" tick={{ fill: '#888' }} fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px', color: '#fff', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)' }}
                      itemStyle={{ color: '#fff', fontWeight: 500 }}
                    />
                    <Area type="monotone" dataKey="processed" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorProcessed)" />
                    <Area type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorCritical)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 bg-card/80 backdrop-blur border-border/50 shadow-sm rounded-2xl overflow-hidden flex flex-col">
            <CardHeader className="border-b border-border/50 bg-secondary/10 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" /> Confidence & Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col justify-center items-center text-center space-y-6 relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500/10 rounded-full blur-[50px] pointer-events-none" />
              
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-[8px] border-purple-500/20 flex items-center justify-center relative shadow-inner">
                  <div className="absolute inset-0 rounded-full border-[8px] border-purple-500 border-l-transparent border-b-transparent transform rotate-45" />
                  <span className="text-4xl font-black">{stats?.accuracy || "98%"}</span>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-2">Highly Calibrated</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The Consequence Engine is accurately categorizing your emails with exceptional precision, continuously learning from your workflow.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Quota & Routing Insights */}
        <div>
          <h2 className="text-xl font-bold tracking-tight mb-4 mt-8">AI Processing Source</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card/80 backdrop-blur border-border/50 shadow-sm rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2 text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="font-semibold uppercase tracking-wider text-xs">Platform AI</h3>
                </div>
                <div className="text-3xl font-bold">{aiStats?.platform || 0} <span className="text-sm font-medium text-muted-foreground">requests</span></div>
                <p className="text-sm text-muted-foreground mt-2">Analyzed using your Inbox Sentinel plan quota.</p>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur border-border/50 shadow-sm rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2 text-emerald-400">
                  <Brain className="w-5 h-5" />
                  <h3 className="font-semibold uppercase tracking-wider text-xs">Personal AI (BYOK)</h3>
                </div>
                <div className="text-3xl font-bold">{aiStats?.personal || 0} <span className="text-sm font-medium text-muted-foreground">requests</span></div>
                <p className="text-sm text-muted-foreground mt-2">Analyzed securely using your own API key at no platform cost.</p>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur border-border/50 shadow-sm rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2 text-orange-400">
                  <Activity className="w-5 h-5" />
                  <h3 className="font-semibold uppercase tracking-wider text-xs">Platform Fallback</h3>
                </div>
                <div className="text-3xl font-bold">{aiStats?.fallback || 0} <span className="text-sm font-medium text-muted-foreground">requests</span></div>
                <p className="text-sm text-muted-foreground mt-2">Saved by platform fallback when personal AI failed.</p>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}

function InsightCard({ title, metric, narrative, icon, accentColor }: { title: string, metric: string | number, narrative: string, icon: React.ReactNode, accentColor: string }) {
  return (
    <Card className="bg-card/80 backdrop-blur border-border/50 overflow-hidden relative rounded-2xl group transition-all hover:shadow-md hover:border-border">
      <div className={`absolute top-0 left-0 w-1.5 h-full ${accentColor}`} />
      <CardContent className="p-6 pl-8 flex gap-6 items-start">
        <div className="p-4 bg-secondary/80 rounded-2xl shrink-0 group-hover:scale-110 transition-transform duration-300 border border-border/50 shadow-inner">
          {icon}
        </div>
        <div className="flex flex-col">
          <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">{title}</p>
          <span className="text-4xl font-black tracking-tight mb-3 text-foreground">{metric}</span>
          <p className="text-sm text-muted-foreground/90 leading-relaxed font-medium">
            {narrative}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
