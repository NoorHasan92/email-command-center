"use client";

import { useEffect, useState } from "react";
import { getDatabaseIntegrityReport } from "@/server/actions/admin-integrity.actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, AlertTriangle, RefreshCcw, Database } from "lucide-react";

export function IntegrityClient() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await getDatabaseIntegrityReport();
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const getStatusColor = (count: number) => count > 0 ? "text-red-400" : "text-emerald-400";
  const getStatusIcon = (count: number) => count > 0 ? <AlertTriangle className="w-5 h-5 text-red-400" /> : <ShieldCheck className="w-5 h-5 text-emerald-400" />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-400" />
          Database Integrity Audit
        </h2>
        
        <button 
          onClick={fetchReport}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#111] hover:bg-[#222] border border-border/10 rounded-lg text-sm transition-colors text-white disabled:opacity-50"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Run Audit
        </button>
      </div>

      <p className="text-slate-400">
        Read-only health checks for database relational constraints, orphaned records, and entitlement state consistency.
      </p>

      {loading && !report ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
          <RefreshCcw className="w-8 h-8 animate-spin mb-4" />
          Running Integrity Checks...
        </div>
      ) : report ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-[#0f0f0f] border-border/10">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Orphaned Payments
                {getStatusIcon(report.orphanedPayments)}
              </CardTitle>
              <CardDescription>Payments unlinked from any Order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getStatusColor(report.orphanedPayments)}`}>
                {report.orphanedPayments}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0f0f0f] border-border/10">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Duplicate Razorpay IDs
                {getStatusIcon(report.duplicatePaymentIds)}
              </CardTitle>
              <CardDescription>Multiple records with same providerPaymentId</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getStatusColor(report.duplicatePaymentIds)}`}>
                {report.duplicatePaymentIds}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0f0f0f] border-border/10">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Stuck AI Quota Events
                {getStatusIcon(report.expiredStuckQuota)}
              </CardTitle>
              <CardDescription>Expired reservations never committed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getStatusColor(report.expiredStuckQuota)}`}>
                {report.expiredStuckQuota}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0f0f0f] border-border/10">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Unpaid Entitlements
                {getStatusIcon(report.unpaidEntitlements)}
              </CardTitle>
              <CardDescription>Active PLAN source=PAYMENT, no captured payment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getStatusColor(report.unpaidEntitlements)}`}>
                {report.unpaidEntitlements}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0f0f0f] border-border/10">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Stuck Deletions
                {getStatusIcon(report.stuckDeletions)}
              </CardTitle>
              <CardDescription>Deletions PROCESSING for &gt; 1 hour</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getStatusColor(report.stuckDeletions)}`}>
                {report.stuckDeletions}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
