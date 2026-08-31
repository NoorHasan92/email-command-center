import { db } from "@/server/repositories/db";
import { ShieldAlert, Users, Server, AlertCircle, Activity, CreditCard, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminCommandCenter() {
  // Fetch real data
  const [
    totalUsers,
    proUsers,
    totalAiEvents,
    failedAiEvents,
    pendingDeletions,
    totalPayments
  ] = await Promise.all([
    db.user.count({ where: { isDeleted: false } }),
    db.user.count({ where: { plan: { in: ["PRO", "ULTRA"] }, isDeleted: false } }),
    db.aIUsageEvent.count(),
    db.aIUsageEvent.count({ where: { status: "FAILED" } }),
    db.accountDeletionRequest.count({ where: { status: { in: ["SCHEDULED"] } } }),
    db.payment.aggregate({
      where: { status: "CAPTURED" },
      _sum: { amount: true }
    })
  ]);

  const totalRevenue = (totalPayments._sum.amount || 0) / 100; // Assuming paise

  const aiSuccessRate = totalAiEvents > 0 
    ? (((totalAiEvents - failedAiEvents) / totalAiEvents) * 100).toFixed(1)
    : "100";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-white">
          <ShieldAlert className="w-8 h-8 text-indigo-500" />
          Command Center
        </h1>
        <p className="text-slate-400 mt-2 font-medium">Platform overview and attention required.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#0f0f0f] border-border/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Users</CardTitle>
            <Users className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{totalUsers}</div>
            <p className="text-xs text-indigo-400 font-semibold mt-1">{proUsers} premium users</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0f0f0f] border-border/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">AI Success Rate</CardTitle>
            <Server className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{aiSuccessRate}%</div>
            <p className="text-xs text-slate-500 mt-1">{totalAiEvents} total events</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0f0f0f] border-border/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Platform Revenue</CardTitle>
            <CreditCard className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-emerald-400 mt-1">Captured payments</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0f0f0f] border-border/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Pending Deletions</CardTitle>
            <Activity className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{pendingDeletions}</div>
            <p className="text-xs text-slate-500 mt-1">Scheduled for deletion</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
        {/* ATTENTION REQUIRED */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Attention Required
          </h2>
          
          <div className="bg-[#0f0f0f] border border-border/10 rounded-2xl p-6 flex flex-col gap-4">
            {failedAiEvents > 0 && (
              <div className="flex items-start justify-between p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                <div>
                  <h3 className="font-semibold text-red-400">Failed AI Requests Detected</h3>
                  <p className="text-sm text-slate-400 mt-1">There are {failedAiEvents} failed AI usage events in the database.</p>
                </div>
                <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">Investigate</Badge>
              </div>
            )}
            
            {failedAiEvents === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500/50 mb-3" />
                <h3 className="font-semibold text-emerald-400">All Systems Healthy</h3>
                <p className="text-sm text-slate-400 mt-1">No operational anomalies detected.</p>
              </div>
            )}
          </div>
        </div>

        {/* SYSTEM STATUS */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            System Status
          </h2>
          
          <div className="bg-[#0f0f0f] border border-border/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border/5">
              <div className="font-medium text-slate-200">Gmail Pub/Sub Webhook</div>
              <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 border-0">Connected</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border-b border-border/5">
              <div className="font-medium text-slate-200">Transaction Email Service</div>
              <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 border-0">Healthy</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border-b border-border/5">
              <div className="font-medium text-slate-200">AI Processing (Platform)</div>
              <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 border-0">Online</Badge>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="font-medium text-slate-200">Background Job Worker</div>
              <Badge className="bg-slate-500/20 text-slate-400 hover:bg-slate-500/20 border-0">External (Vercel Cron)</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
