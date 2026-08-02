"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Mail, Clock, Brain, Inbox } from "lucide-react";
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
  activityData?: any[];
  categoryData?: any[];
}

export default function AnalyticsClient({ data }: { data: AnalyticsData }) {
  if (!data.hasData) {
    return (
      <div className="flex-1 flex flex-col h-full bg-transparent overflow-auto p-6 lg:p-10 z-10 relative">
        <div className="max-w-4xl mx-auto w-full h-full flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center">
            <Inbox className="w-12 h-12 text-primary opacity-50" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Not Enough Data Yet</h1>
          <p className="text-muted-foreground max-w-md">
            We need to process more emails before we can generate meaningful analytics. 
            Connect your inbox and check back later.
          </p>
          <div className="mt-4">
            <Link href="/integrations">
              <Button>Manage Integrations</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { stats, activityData, categoryData } = data;

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-auto p-6 lg:p-10 z-10 relative">
      <div className="max-w-6xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Analytics</h1>
          <p className="text-muted-foreground">Understand your email habits and the time saved by AI.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Time Saved (Estimated)" value={stats?.timeSaved || "0h 0m"} icon={<Clock className="w-5 h-5 text-blue-500" />} trend="Total time saved" />
          <StatCard title="Total Processed" value={stats?.totalProcessed || 0} icon={<Mail className="w-5 h-5 text-muted-foreground" />} trend="Emails analyzed" />
          <StatCard title="Critical Actions Caught" value={stats?.criticalCount || 0} icon={<Activity className="w-5 h-5 text-destructive" />} trend="Deadlines & high priority" />
          <StatCard title="AI Accuracy" value={stats?.accuracy || "100%"} icon={<Brain className="w-5 h-5 text-purple-500" />} trend="Based on user feedback" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card/90 backdrop-blur border-border">
            <CardHeader>
              <CardTitle>Email Volume (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorProcessed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="processed" stroke="#3b82f6" fillOpacity={1} fill="url(#colorProcessed)" />
                    <Area type="monotone" dataKey="critical" stroke="#ef4444" fillOpacity={1} fill="url(#colorCritical)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/90 backdrop-blur border-border">
            <CardHeader>
              <CardTitle>Categories Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#333" />
                    <XAxis type="number" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#888" fontSize={12} tickLine={false} axisLine={false} width={100} />
                    <Tooltip 
                      cursor={{fill: '#1f2937'}}
                      contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string, value: string | number, icon: React.ReactNode, trend: string }) {
  return (
    <Card className="bg-card/90 backdrop-blur border-border overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-muted-foreground">{title}</p>
          <div className="p-2.5 bg-secondary/80 rounded-xl">{icon}</div>
        </div>
        <div className="flex flex-col">
          <span className="text-3xl font-extrabold tracking-tight">{value}</span>
          <span className="text-xs text-muted-foreground mt-2 font-medium">{trend}</span>
        </div>
      </CardContent>
    </Card>
  );
}
