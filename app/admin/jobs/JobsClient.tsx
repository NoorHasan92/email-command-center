"use client";

import { useState, useEffect } from "react";
import { getAdminWebhookEvents, retryWebhookEvent, getAdminAIFailures } from "@/server/actions/admin-system.actions";
import { RefreshCcw, Server, AlertCircle, Play } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function JobsClient() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [aiFailures, setAiFailures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Quick fetch
  const loadData = async () => {
    setLoading(true);
    try {
      const [wh, ai] = await Promise.all([
        getAdminWebhookEvents(1, 50, "FAILED"),
        getAdminAIFailures(1, 50)
      ]);
      setWebhooks(wh.events);
      setAiFailures(ai.failures);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRetryWebhook = async (id: string) => {
    try {
      await retryWebhookEvent(id);
      loadData();
    } catch (err) {
      alert("Retry failed");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Server className="w-5 h-5 text-indigo-400" />
          System Jobs & Health
        </h2>
        
        <button 
          onClick={loadData}
          className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-[#0f0f0f] border-border/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Failed Webhooks</CardTitle>
            <AlertCircle className={`w-4 h-4 ${webhooks.length > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{webhooks.length}</div>
            <p className="text-xs text-slate-500 mt-1">Pending manual intervention</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#0f0f0f] border-border/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">AI Task Failures</CardTitle>
            <AlertCircle className={`w-4 h-4 ${aiFailures.length > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{aiFailures.length}</div>
            <p className="text-xs text-slate-500 mt-1">Recent AI errors</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="webhooks" className="mt-4">
        <TabsList className="bg-[#0f0f0f] border border-border/10">
          <TabsTrigger value="webhooks">Failed Webhooks</TabsTrigger>
          <TabsTrigger value="ai">AI Processing Failures</TabsTrigger>
        </TabsList>
        
        <TabsContent value="webhooks" className="mt-4">
          <div className="bg-[#0f0f0f] border border-border/10 rounded-2xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-black/40 border-b border-border/10">
                <tr>
                  <th className="px-6 py-4 font-semibold">Provider</th>
                  <th className="px-6 py-4 font-semibold">Error Message</th>
                  <th className="px-6 py-4 font-semibold">Retry Count</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {webhooks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No failed webhooks found.
                    </td>
                  </tr>
                ) : (
                  webhooks.map((w) => (
                    <tr key={w.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{w.provider}</td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-red-400 max-w-[300px] truncate" title={w.error || ""}>
                          {w.error || "Unknown Error"}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300">{w.retryCount}</td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {format(new Date(w.createdAt), "MMM d, HH:mm")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRetryWebhook(w.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors text-xs font-medium"
                        >
                          <Play className="w-3 h-3" />
                          Retry
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="mt-4">
          <div className="bg-[#0f0f0f] border border-border/10 rounded-2xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-black/40 border-b border-border/10">
                <tr>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Operation</th>
                  <th className="px-6 py-4 font-semibold">Error Code</th>
                  <th className="px-6 py-4 font-semibold">Model</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {aiFailures.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No AI failures found.
                    </td>
                  </tr>
                ) : (
                  aiFailures.map((a) => (
                    <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{a.user?.email || "Unknown"}</td>
                      <td className="px-6 py-4 text-xs text-slate-300">{a.operationType}</td>
                      <td className="px-6 py-4">
                        <Badge className="bg-red-500/20 text-red-400 border-0">{a.errorCode || "FAILED"}</Badge>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">{a.model || "-"}</td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {format(new Date(a.createdAt), "MMM d, HH:mm")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
