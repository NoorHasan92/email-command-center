"use client";

import { useState } from "react";
import { User, AIEvalRun, AIEvalResult } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Server, X, Search, Sparkles, RefreshCw } from "lucide-react";
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

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [usageFilter, setUsageFilter] = useState("ALL");
  const [reconcilingId, setReconcilingId] = useState<string | null>(null);

  // Filtered Users logic
  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (user.name?.toLowerCase().includes(q)) ||
      (user.email?.toLowerCase().includes(q));

    const matchesPlan =
      planFilter === "ALL" || (user.plan || "FREE").toUpperCase() === planFilter.toUpperCase();

    let matchesUsage = true;
    if (usageFilter === "ACTIVE") {
      matchesUsage = (user.aiUsage?.platformAiUsed || 0) > 0;
    } else if (usageFilter === "ZERO") {
      matchesUsage = (user.aiUsage?.platformAiUsed || 0) === 0;
    } else if (usageFilter === "BYOK") {
      matchesUsage = (user.aiConnection?.personalRequestCount || 0) > 0;
    } else if (usageFilter === "BONUS") {
      matchesUsage = (user.aiUsage?.lifetimeGranted || 0) > 0;
    }

    return matchesSearch && matchesPlan && matchesUsage;
  });

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
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    User AI Quota Tracker
                    <span className="text-xs font-normal text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                      {filteredUsers.length} of {users.length} users
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Monitor consumed tokens, BYOK requests, and manage individual allocations.
                  </p>
                </div>

                {/* Search & Filter Controls */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Search Bar */}
                  <div className="relative min-w-[220px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-black/40 border border-border/20 text-white placeholder-slate-500 rounded-xl pl-9 pr-3 py-1.5 text-xs outline-none focus:border-indigo-500 transition-colors"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Plan Filter */}
                  <div className="flex items-center gap-1.5 bg-black/40 border border-border/20 rounded-xl px-2.5 py-1">
                    <span className="text-[11px] text-slate-400 font-medium">Plan:</span>
                    <select
                      value={planFilter}
                      onChange={(e) => setPlanFilter(e.target.value)}
                      className="bg-transparent text-white text-xs outline-none font-semibold cursor-pointer"
                    >
                      <option value="ALL" className="bg-[#111] text-white">All Plans</option>
                      <option value="FREE" className="bg-[#111] text-white">FREE (500)</option>
                      <option value="PRO" className="bg-[#111] text-white">PRO (2,000)</option>
                      <option value="ULTRA" className="bg-[#111] text-white">ULTRA (5,000)</option>
                      <option value="ADMIN" className="bg-[#111] text-white">ADMIN (Unlimited)</option>
                    </select>
                  </div>

                  {/* Activity Filter */}
                  <div className="flex items-center gap-1.5 bg-black/40 border border-border/20 rounded-xl px-2.5 py-1">
                    <span className="text-[11px] text-slate-400 font-medium">Activity:</span>
                    <select
                      value={usageFilter}
                      onChange={(e) => setUsageFilter(e.target.value)}
                      className="bg-transparent text-white text-xs outline-none font-semibold cursor-pointer"
                    >
                      <option value="ALL" className="bg-[#111] text-white">All Activity</option>
                      <option value="ACTIVE" className="bg-[#111] text-white">Active Usage ({">"}0)</option>
                      <option value="ZERO" className="bg-[#111] text-white">Zero Usage</option>
                      <option value="BYOK" className="bg-[#111] text-white">Has BYOK</option>
                      <option value="BONUS" className="bg-[#111] text-white">Has Bonus</option>
                    </select>
                  </div>

                  {/* Reset Filters button */}
                  {(searchQuery || planFilter !== "ALL" || usageFilter !== "ALL") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setPlanFilter("ALL");
                        setUsageFilter("ALL");
                      }}
                      className="h-8 text-xs text-slate-400 hover:text-white px-2"
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </div>

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
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                          No users matched your search and filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const limit = user.plan === "FREE" ? 500 : user.plan === "PRO" ? 2000 : user.plan === "ULTRA" ? 5000 : 999999;
                        const used = user.aiUsage?.platformAiUsed || 0;
                        const pct = Math.min(100, Math.round((used / limit) * 100));

                        return (
                          <tr key={user.id} className="border-b border-border/5 hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-white">{user.name || "Unnamed User"}</div>
                              <div className="text-xs text-slate-500">{user.email}</div>
                              {user.aiUsage?.lifetimeGranted ? (
                                <span className="inline-block mt-1 text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                                  +{user.aiUsage.lifetimeGranted} Bonus Granted
                                </span>
                              ) : null}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Badge variant="outline" className={`font-mono text-xs ${
                                user.plan === "ULTRA" ? "bg-purple-500/10 text-purple-300 border-purple-500/30" :
                                user.plan === "PRO" ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30" :
                                user.plan === "ADMIN" ? "bg-amber-500/10 text-amber-300 border-amber-500/30" :
                                "bg-white/5 text-slate-300 border-white/10"
                              }`}>
                                {user.plan || "FREE"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-center text-slate-300">
                              <div className="flex flex-col items-center gap-1">
                                <div>
                                  <span className="font-bold text-white">{used}</span> / {limit}
                                </div>
                                <div className="w-24 bg-white/10 h-1 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-400' : 'bg-indigo-500'}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center text-slate-400 font-mono text-xs">
                              {user.aiConnection?.personalRequestCount || 0} / {user.aiConnection?.fallbackRequestCount || 0}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {/* Grant Bonus with rich hover explanation */}
                                <div className="relative group inline-block">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setGrantUser(user)}
                                    className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20 hover:text-indigo-300 gap-1.5 text-xs"
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    Grant Bonus
                                  </Button>
                                  {/* Tooltip Popup on Hover */}
                                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col z-50 w-64 p-2.5 bg-black/95 border border-indigo-500/30 rounded-xl shadow-2xl text-[11px] text-slate-200 backdrop-blur-md leading-relaxed text-left">
                                    <div className="flex items-center gap-1.5 font-semibold text-indigo-300 mb-0.5">
                                      <Sparkles className="w-3.5 h-3.5" />
                                      Grant Bonus Quota
                                    </div>
                                    <span>
                                      Credits additional free AI analyses directly to this user&apos;s account balance without upgrading or changing their subscription billing plan.
                                    </span>
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/95" />
                                  </div>
                                </div>

                                {/* Reconcile with rich hover explanation */}
                                <div className="relative group inline-block">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={reconcilingId === user.id}
                                    className="text-slate-400 hover:text-white gap-1.5 text-xs"
                                    onClick={async () => {
                                      setReconcilingId(user.id);
                                      try {
                                        const { reconcileQuota } = await import("@/server/actions/admin.actions");
                                        const res = await reconcileQuota(user.id);
                                        if (res.success) {
                                          setUsers(users.map(u => u.id === user.id ? {
                                            ...u,
                                            aiUsage: {
                                              ...(u.aiUsage || {}),
                                              platformAiUsed: res.platformCount
                                            },
                                            aiConnection: {
                                              ...(u.aiConnection || {}),
                                              personalRequestCount: res.personalCount,
                                              fallbackRequestCount: res.fallbackCount
                                            }
                                          } : u));
                                          toast.success(`Reconciled: ${res.platformCount} Platform, ${res.personalCount} BYOK`);
                                        }
                                      } catch (e) {
                                        toast.error("Failed to reconcile");
                                      } finally {
                                        setReconcilingId(null);
                                      }
                                    }}
                                  >
                                    <RefreshCw className={`w-3 h-3 ${reconcilingId === user.id ? 'animate-spin' : ''}`} />
                                    Reconcile
                                  </Button>
                                  {/* Tooltip Popup on Hover */}
                                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col z-50 w-64 p-2.5 bg-black/95 border border-slate-700 rounded-xl shadow-2xl text-[11px] text-slate-200 backdrop-blur-md leading-relaxed text-left">
                                    <div className="flex items-center gap-1.5 font-semibold text-white mb-0.5">
                                      <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                                      Reconcile AI Quota
                                    </div>
                                    <span>
                                      Recalculates exact usage numbers directly from raw AI usage events in the database to eliminate cache drifts or counter desyncs.
                                    </span>
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/95" />
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
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
