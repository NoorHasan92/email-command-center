"use client";

import { useState } from "react";
import { User, AIEvalRun, AIEvalResult } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Server, X } from "lucide-react";
import { grantBonusQuota } from "@/server/actions/admin.actions";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type RunWithResults = AIEvalRun & { results: AIEvalResult[] };

type UserWithCounts = User & {
  aiUsage?: any;
  aiConnection?: any;
};

export function AIOpsClient({ initialUsers, runs }: { initialUsers: UserWithCounts[], runs: RunWithResults[] }) {
  const [users, setUsers] = useState<UserWithCounts[]>(initialUsers);
  const [selectedRun, setSelectedRun] = useState<RunWithResults | null>(runs[0] || null);

  // Grant Bonus State
  const [grantUser, setGrantUser] = useState<UserWithCounts | null>(null);
  const [grantAmount, setGrantAmount] = useState<number>(500);
  const [grantReason, setGrantReason] = useState<string>("Admin Bonus");
  const [isGranting, setIsGranting] = useState(false);

  const handleGrantBonus = async () => {
    if (!grantUser) return;
    setIsGranting(true);
    try {
      await grantBonusQuota(grantUser.id, grantAmount, grantReason);
      setUsers(users.map(u => {
        if (u.id === grantUser.id) {
          return {
            ...u,
            aiUsage: {
              ...(u.aiUsage || {}),
              lifetimeGranted: (u.aiUsage?.lifetimeGranted || 0) + grantAmount
            }
          };
        }
        return u;
      }));
      toast.success(`Granted ${grantAmount} bonus analyses to ${grantUser.name}.`);
    } catch (error) {
      toast.error("Failed to grant bonus.");
    } finally {
      setIsGranting(false);
      setGrantUser(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      <div>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-white">
          <Server className="w-8 h-8 text-indigo-500" />
          AI Operations
        </h1>
        <p className="text-slate-400 mt-2 font-medium">Manage AI quota, monitor evaluations, and reconcile usage.</p>
      </div>

      <Tabs defaultValue="quota" className="w-full flex flex-col">
        <TabsList className="w-full md:w-auto self-start bg-[#0f0f0f] border border-border/10 overflow-x-auto no-scrollbar flex-nowrap rounded-xl">
          <TabsTrigger value="quota" className="data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300 shrink-0">
            Quota Management
          </TabsTrigger>
          <TabsTrigger value="evals" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 shrink-0">
            AI Evaluations
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="quota" className="flex flex-col space-y-6 m-0 border-0 p-0 outline-none">
            <div className="bg-[#0f0f0f] p-6 rounded-2xl border border-border/10 shadow-inner">
              <h2 className="text-2xl font-bold mb-4 text-white">AI Usage Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
                <div className="flex flex-col gap-2 bg-black/20 p-4 rounded-xl border border-border/10">
                  <span className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Total Platform Requests</span>
                  <span className="text-3xl font-bold text-white">
                    {users.reduce((acc, user) => acc + (user.aiUsage?.platformAiUsed || 0), 0)}
                  </span>
                </div>
                <div className="flex flex-col gap-2 bg-black/20 p-4 rounded-xl border border-border/10">
                  <span className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Total BYOK Requests</span>
                  <span className="text-3xl font-bold text-white">
                    {users.reduce((acc, user) => acc + (user.aiConnection?.personalRequestCount || 0), 0)}
                  </span>
                </div>
                <div className="flex flex-col gap-2 bg-black/20 p-4 rounded-xl border border-border/10">
                  <span className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Total Fallback</span>
                  <span className="text-3xl font-bold text-white">
                    {users.reduce((acc, user) => acc + (user.aiConnection?.fallbackRequestCount || 0), 0)}
                  </span>
                </div>
                <div className="flex flex-col gap-2 bg-black/20 p-4 rounded-xl border border-border/10">
                  <span className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Total Lifetime Grant</span>
                  <span className="text-3xl font-bold text-indigo-400">
                    {users.reduce((acc, user) => acc + (user.aiUsage?.lifetimeGranted || 0), 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#0f0f0f] p-6 rounded-2xl border border-border/10 shadow-inner">
              <h2 className="text-xl font-bold mb-4 text-white">User AI Quota Tracker</h2>
              <div className="bg-black/20 rounded-xl border border-border/10 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase text-slate-500 border-b border-border/10">
                    <tr>
                      <th className="px-6 py-4 font-bold tracking-wider">User</th>
                      <th className="px-6 py-4 font-bold tracking-wider text-center">Plan</th>
                      <th className="px-6 py-4 font-bold tracking-wider text-center">Platform Used / Limit</th>
                      <th className="px-6 py-4 font-bold tracking-wider text-center">BYOK / Fallback</th>
                      <th className="px-6 py-4 font-bold tracking-wider text-center">Manage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => {
                      const limit = user.plan === "FREE" ? 500 : user.plan === "PRO" ? 2000 : user.plan === "ULTRA" ? 5000 : 999999;
                      return (
                        <tr key={user.id} className="border-b border-border/5 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-white">{user.name}</div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge variant="outline" className="bg-white/5">{user.plan || "FREE"}</Badge>
                          </td>
                          <td className="px-6 py-4 text-center text-slate-300">
                            <span className="font-bold text-white">{user.aiUsage?.platformAiUsed || 0}</span> / {limit}
                          </td>
                          <td className="px-6 py-4 text-center text-slate-500">
                            {user.aiConnection?.personalRequestCount || 0} / {user.aiConnection?.fallbackRequestCount || 0}
                          </td>
                          <td className="px-6 py-4 text-center flex items-center justify-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setGrantUser(user)} className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20 hover:text-indigo-300">Grant Bonus</Button>
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={async () => {
                              try {
                                const { reconcileQuota } = await import("@/server/actions/admin.actions");
                                const res = await reconcileQuota(user.id);
                                if (res.success) toast.success(`Reconciled: ${res.platformCount} Platform, ${res.personalCount} BYOK`);
                              } catch (e) {
                                toast.error("Failed to reconcile");
                              }
                            }}>Reconcile</Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="evals" className="flex flex-col m-0 border-0 p-0 outline-none">
            {runs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-[#0f0f0f] rounded-2xl border border-border/10 my-10 shadow-inner">
                <h2 className="text-2xl font-semibold mb-2 text-white">No Evaluation Runs Found</h2>
                <p className="text-slate-400 text-center max-w-md">
                  Run the AI Evaluation Suite via CLI to generate evaluation metrics.
                </p>
              </div>
            ) : (
              <div className="flex flex-col space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0f0f0f] p-4 rounded-2xl border border-border/10 shrink-0 shadow-inner">
                  <h2 className="text-xl font-bold tracking-tight text-white">AI Evaluation Runs</h2>
                  <div className="flex space-x-2 w-full sm:w-auto">
                    <select
                      className="bg-black/40 border border-border/10 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-purple-500/50 outline-none w-full sm:w-auto text-white"
                      onChange={(e) => setSelectedRun(runs.find(r => r.id === e.target.value) || null)}
                      value={selectedRun?.id || ""}
                    >
                      {runs.map(run => (
                        <option key={run.id} value={run.id} className="bg-black text-white">
                          {new Date(run.createdAt).toLocaleString()} - {run.promptVersion} ({run.datasetName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedRun && (
                  <div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                      <Card className="bg-[#0f0f0f] border-border/10 shadow-xl">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium text-slate-400">Overall Accuracy</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-white">{(selectedRun.accuracy * 100).toFixed(1)}%</div>
                          <p className="text-xs font-semibold mt-1 text-purple-400">F1 Score: {(selectedRun.f1Score * 100).toFixed(1)}%</p>
                        </CardContent>
                      </Card>

                      <Card className="bg-[#0f0f0f] border-border/10 shadow-xl">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium text-slate-400">Opp / Deadline Acc</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-white">{(selectedRun.opportunityAccuracy * 100).toFixed(1)}%</div>
                          <p className="text-xs font-semibold mt-1 text-purple-400">Deadline: {(selectedRun.deadlineAccuracy * 100).toFixed(1)}%</p>
                        </CardContent>
                      </Card>

                      <Card className="bg-[#0f0f0f] border-border/10 shadow-xl">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium text-slate-400">Average Latency</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-white">{selectedRun.averageLatencyMs.toFixed(0)} <span className="text-xl">ms</span></div>
                          <p className="text-xs font-semibold mt-1 text-slate-500">Per email processed</p>
                        </CardContent>
                      </Card>

                      <Card className="bg-[#0f0f0f] border-border/10 shadow-xl">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium text-slate-400">Total Cost</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-white">${selectedRun.totalCost.toFixed(4)}</div>
                          <p className="text-xs font-semibold mt-1 text-slate-500">Total for {selectedRun.totalEmails} emails</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="bg-[#0f0f0f] rounded-2xl border border-border/10 p-6 shadow-xl mb-12">
                      <h3 className="text-xl font-bold tracking-tight mb-6 flex items-center gap-2 text-white">
                        <ShieldAlert className="w-5 h-5 text-red-400" />
                        Mismatches / Errors
                      </h3>
                      <div className="space-y-4">
                        {selectedRun.results.filter(r => !r.isPerfectMatch).length === 0 ? (
                          <div className="text-slate-500 text-center py-10 font-medium">No errors! 100% perfect match.</div>
                        ) : (
                          selectedRun.results.filter(r => !r.isPerfectMatch).map(result => (
                            <Card key={result.id} className="border-red-900/30 bg-red-950/20 backdrop-blur-sm">
                              <CardHeader className="py-4 border-b border-red-900/20">
                                <CardTitle className="text-base text-white font-bold">{result.emailSubject}</CardTitle>
                                <CardDescription className="text-red-400">{result.emailFrom}</CardDescription>
                              </CardHeader>
                              <CardContent className="py-4 text-sm">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                  <div className="space-y-2 text-slate-300">
                                    <div className="font-bold text-slate-500 uppercase tracking-wider text-xs mb-2">Expected</div>
                                    <div className="flex justify-between border-b border-white/5 pb-1"><span>Category:</span> <span>{result.expectedCategory}</span></div>
                                    <div className="flex justify-between border-b border-white/5 pb-1"><span>Action:</span> <span>{result.expectedActionReq ? "Yes" : "No"}</span></div>
                                    <div className="flex justify-between border-b border-white/5 pb-1"><span>Opportunity:</span> <span>{result.expectedOpportunity ? "Yes" : "No"}</span></div>
                                  </div>
                                  <div className="space-y-2 text-slate-300">
                                    <div className="font-bold text-slate-500 uppercase tracking-wider text-xs mb-2">Actual</div>
                                    <div className={`flex justify-between border-b border-white/5 pb-1 ${result.actualCategory !== result.expectedCategory ? "text-red-400 font-bold" : ""}`}>
                                      <span>Category:</span> <span>{result.actualCategory}</span>
                                    </div>
                                    <div className={`flex justify-between border-b border-white/5 pb-1 ${result.actualActionReq !== result.expectedActionReq ? "text-red-400 font-bold" : ""}`}>
                                      <span>Action:</span> <span>{result.actualActionReq ? "Yes" : "No"}</span>
                                    </div>
                                    <div className={`flex justify-between border-b border-white/5 pb-1 ${result.actualOpportunity !== result.expectedOpportunity ? "text-red-400 font-bold" : ""}`}>
                                      <span>Opportunity:</span> <span>{result.actualOpportunity ? "Yes" : "No"}</span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* Grant Bonus Modal */}
      {grantUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111] w-full max-w-md rounded-2xl border border-border/10 shadow-2xl p-6 flex flex-col gap-4 relative">
            <button 
              onClick={() => setGrantUser(null)} 
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white">Grant AI Bonus Quota</h2>
            <p className="text-sm text-slate-400 mb-2">
              Add bonus AI analyses to <strong className="text-white">{grantUser.name}</strong>.
            </p>
            
            <div className="space-y-4 text-white">
              <div>
                <label className="text-sm font-medium mb-1 block text-slate-300">Bonus Amount (Analyses)</label>
                <input 
                  type="number" 
                  value={grantAmount}
                  onChange={e => setGrantAmount(parseInt(e.target.value) || 0)}
                  className="w-full bg-black/40 border border-border/10 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-slate-300">Reason (Audit Log)</label>
                <input 
                  type="text" 
                  value={grantReason}
                  onChange={e => setGrantReason(e.target.value)}
                  className="w-full bg-black/40 border border-border/10 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                  placeholder="e.g. Apology for outage"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <Button variant="ghost" onClick={() => setGrantUser(null)} className="text-slate-300 hover:text-white">Cancel</Button>
              <Button 
                className="bg-indigo-500 hover:bg-indigo-600 text-white border-0" 
                onClick={handleGrantBonus}
                disabled={isGranting}
              >
                {isGranting ? "Granting..." : "Confirm Grant"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
