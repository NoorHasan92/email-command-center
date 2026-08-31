"use client";

import { useEffect, useState } from "react";
import { getAdminRevenueMetrics, getPaymentAnomalies } from "@/server/actions/admin-business.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CreditCard, CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";
import { RefreshCcw } from "lucide-react";

export function RevenueClient() {
  const [metrics, setMetrics] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [data, anomalyData] = await Promise.all([
          getAdminRevenueMetrics(),
          getPaymentAnomalies()
        ]);
        setMetrics(data);
        setAnomalies(anomalyData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <RefreshCcw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          Revenue Analytics
        </h2>
        <p className="text-slate-400 mt-1">Aggregated financial metrics from captured payments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#0f0f0f] border-border/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white">
              ${metrics.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-emerald-400/70 mt-1">Lifetime captured</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0f0f0f] border-border/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Transactions</CardTitle>
            <CreditCard className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white">
              {metrics.totalPayments}
            </div>
            <p className="text-xs text-indigo-400/70 mt-1">All payment attempts</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0f0f0f] border-border/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Successful Captures</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white">
              {metrics.successfulPayments}
            </div>
            <p className="text-xs text-blue-400/70 mt-1">
              {metrics.totalPayments > 0 
                ? ((metrics.successfulPayments / metrics.totalPayments) * 100).toFixed(1) 
                : 0}% Success Rate
            </p>
          </CardContent>
        </Card>
      </div>

      {metrics.dailyRevenue.length > 0 && (
        <div className="mt-4 flex flex-col gap-4">
          <h3 className="text-lg font-bold text-white">Last 30 Days Trend</h3>
          <div className="bg-[#0f0f0f] border border-border/10 rounded-2xl p-6 h-64 flex items-end gap-2 overflow-x-auto">
            {/* Simple CSS Bar Chart for Revenue */}
            {metrics.dailyRevenue.map((day: any) => {
              const maxAmount = Math.max(...metrics.dailyRevenue.map((d: any) => d.amount));
              const heightPct = maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0;
              return (
                <div key={day.date} className="flex flex-col items-center justify-end h-full gap-2 min-w-[30px] group relative">
                  <div 
                    className="w-full bg-emerald-500/20 hover:bg-emerald-500/40 border-t border-emerald-500/50 rounded-t-sm transition-all"
                    style={{ height: `${Math.max(heightPct, 1)}%` }}
                  />
                  <div className="text-[10px] text-slate-500 -rotate-45 origin-top-left w-6">{day.date.split("-").slice(1).join("/")}</div>
                  
                  {/* Tooltip */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 border border-border/10">
                    ${day.amount.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {anomalies && (anomalies.missingEntitlement.length > 0 || anomalies.unpaidEntitlement.length > 0) && (
        <div className="mt-8">
          <h3 className="text-lg font-bold text-red-400 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5" />
            Reconciliation Anomalies
          </h3>
          <div className="flex flex-col gap-4">
            {anomalies.missingEntitlement.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <h4 className="font-semibold text-red-300 mb-2 text-sm">Missing Entitlement (Paid but plan is FREE)</h4>
                <ul className="text-sm text-red-200/70 list-disc pl-5">
                  {anomalies.missingEntitlement.map((u: any) => (
                    <li key={u.id}>{u.email} ({u.name})</li>
                  ))}
                </ul>
              </div>
            )}
            {anomalies.unpaidEntitlement.length > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                <h4 className="font-semibold text-orange-300 mb-2 text-sm">Unpaid Entitlement (Plan is PRO/ULTRA but no captured payments)</h4>
                <ul className="text-sm text-orange-200/70 list-disc pl-5">
                  {anomalies.unpaidEntitlement.map((u: any) => (
                    <li key={u.id}>{u.email} ({u.name})</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
