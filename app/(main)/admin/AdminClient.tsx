"use client";

import { useState } from "react";
import { AIEvalRun, AIEvalResult, User } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search, Trash2, ShieldAlert, Mail, Activity, CalendarDays, KeyRound, X } from "lucide-react";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { deleteUser } from "./actions";
import { UserAvatar } from "@/components/common/UserAvatar";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type RunWithResults = AIEvalRun & { results: AIEvalResult[] };

type UserWithCounts = User & {
  _count: {
    emailAccounts: number;
    auditLogs: number;
  };
};

export function AdminClient({ runs, initialUsers }: { runs: RunWithResults[], initialUsers: UserWithCounts[] }) {
  const [selectedRun, setSelectedRun] = useState<RunWithResults | null>(runs[0] || null);
  const [users, setUsers] = useState<UserWithCounts[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredUsers = users.filter((u) => {
    const matchesSearch = (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || "") ||
                          (u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPlan = planFilter === "ALL" || u.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await deleteUser(userToDelete);
      setUsers(users.filter(u => u.id !== userToDelete));
      toast.success("User successfully deleted.");
    } catch (error) {
      toast.error("Failed to delete user.");
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  return (
    <div className="w-full flex flex-col flex-1 p-6 md:p-10 space-y-8 bg-gradient-to-br from-background via-background to-indigo-950/20">

      {/* Admin Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
            <ShieldAlert className="w-10 h-10 text-indigo-500" />
            Command Center
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">System administration and AI evaluation dashboard.</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full flex flex-col">
        <TabsList className="w-full md:w-auto self-start bg-black/40 border border-white/5 backdrop-blur-md">
          <TabsTrigger value="users" className="data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300">
            User Management
          </TabsTrigger>
          <TabsTrigger value="ai-eval" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
            AI Evaluation Suite
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* USER MANAGEMENT TAB */}
          <TabsContent value="users" className="flex flex-col space-y-6 m-0 border-0 p-0 outline-none">

            <div className="flex flex-col gap-6 shrink-0">
              {/* Insights Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
                <div className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/5 shadow-inner">
                  <div className="bg-white/5 p-3 rounded-xl text-muted-foreground">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Free Users</div>
                    <div className="text-3xl font-bold">{users.filter(u => u.plan === "FREE" || !u.plan).length}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/5 shadow-inner">
                  <div className="bg-blue-500/20 p-3 rounded-xl text-blue-400">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pro Users</div>
                    <div className="text-3xl font-bold">{users.filter(u => u.plan === "PRO").length}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/5 shadow-inner">
                  <div className="bg-purple-500/20 p-3 rounded-xl text-purple-400">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Ultra Users</div>
                    <div className="text-3xl font-bold">{users.filter(u => u.plan === "ULTRA").length}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/5 shadow-inner">
                  <div className="bg-indigo-500/20 p-3 rounded-xl text-indigo-400">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Admins</div>
                    <div className="text-3xl font-bold">{users.filter(u => u.plan === "ADMIN").length}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/5 shadow-inner">
                  <div className="bg-emerald-500/20 p-3 rounded-xl text-emerald-400">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Users</div>
                    <div className="text-3xl font-bold">{users.length}</div>
                  </div>
                </div>
              </div>

              {/* Search & Filter Row */}
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                <div className="relative w-full sm:w-96 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    className="flex h-9 w-full border bg-transparent px-3 py-1 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 pl-10 bg-black/40 border-white/10 focus-visible:ring-2 focus-visible:ring-indigo-500/50 rounded-xl text-sm"
                  />
                </div>

                <div className="shrink-0 w-full sm:w-auto flex items-center gap-2">
                  <select
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value)}
                    className="h-9 w-full sm:w-auto rounded-xl border border-white/10 bg-black/40 pl-4 pr-10 py-1 text-sm font-medium focus:ring-2 focus:ring-indigo-500/50 outline-none text-foreground"
                  >
                    <option value="ALL">All Plans</option>
                    <option value="FREE">Free</option>
                    <option value="PRO">Pro</option>
                    <option value="ULTRA">Ultra</option>
                    <option value="ADMIN">Admin</option>
                  </select>

                  {(searchQuery || planFilter !== "ALL") && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-9 w-9 rounded-xl border border-white/10 bg-black/20 hover:bg-white/10 transition-colors"
                      onClick={() => {
                        setSearchQuery("");
                        setPlanFilter("ALL");
                      }}
                      title="Clear filters"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-black/20 rounded-2xl border border-white/5 shadow-2xl overflow-x-auto">
              <div className="min-w-[800px] w-full p-1">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-black/40 text-muted-foreground border-b border-white/10 sticky top-0 z-10 backdrop-blur-xl">
                    <tr>
                      <th rowSpan={2} className="px-6 py-4 rounded-tl-xl font-bold tracking-wider text-center border-b border-white/10">User</th>
                      <th rowSpan={2} className="px-6 py-4 font-bold tracking-wider text-center border-b border-white/10">Role & Status</th>
                      <th rowSpan={2} className="px-6 py-4 font-bold tracking-wider text-center border-b border-white/10">Plan</th>
                      <th rowSpan={2} className="px-6 py-4 font-bold tracking-wider text-center border-b border-white/10">Email Accounts</th>
                      <th colSpan={2} className="px-6 py-2 font-bold tracking-wider text-center border-b border-white/10">Last Login</th>
                      <th rowSpan={2} className="px-6 py-4 rounded-tr-xl font-bold tracking-wider text-center border-b border-white/10">Actions</th>
                    </tr>
                    <tr>
                      <th className="px-6 py-2 font-bold tracking-wider text-center border-b border-white/10">Date</th>
                      <th className="px-6 py-2 font-bold tracking-wider text-center border-b border-white/10">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-12 text-muted-foreground">
                            No users found matching "{searchQuery}"
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <motion.tr
                            key={user.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <UserAvatar src={user.image} name={user.name} size="sm" />
                                <div>
                                  <div className="font-semibold text-foreground">{user.name || "Unknown"}</div>
                                  <div className="text-xs text-muted-foreground">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex flex-col gap-1.5 items-center justify-center">
                                {user.role === "ADMIN" ? (
                                  <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                                    <KeyRound className="w-3 h-3 mr-1" /> Admin
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-white/5 text-muted-foreground">User</Badge>
                                )}
                                {user.lockedUntil && new Date(user.lockedUntil) > new Date() && (
                                  <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">Locked</Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Badge variant="outline" className={`
                                ${user.plan === 'ADMIN' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : ''}
                                ${user.plan === 'ULTRA' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : ''}
                                ${user.plan === 'PRO' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : ''}
                                ${user.plan === 'FREE' || !user.plan ? 'bg-white/5 text-muted-foreground border-white/10' : ''}
                              `}>
                                {user.plan || "FREE"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                <Mail className="w-4 h-4" />
                                <span className="font-medium text-foreground">{user._count.emailAccounts}</span> Connected
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {user.lastLoginAt ? (() => {
                                const d = new Date(user.lastLoginAt);
                                const pad = (n: number) => n.toString().padStart(2, '0');
                                return <span className="font-medium text-foreground whitespace-nowrap">{`${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`}</span>;
                              })() : <span className="text-muted-foreground text-center block">Never</span>}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {user.lastLoginAt ? (() => {
                                const d = new Date(user.lastLoginAt);
                                const pad = (n: number) => n.toString().padStart(2, '0');
                                return <span className="font-medium text-foreground whitespace-nowrap">{`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`}</span>;
                              })() : <span className="text-muted-foreground text-center block">-</span>}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setUserToDelete(user.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* AI EVAL TAB */}
          <TabsContent value="ai-eval" className="flex flex-col m-0 border-0 p-0 outline-none">
            {runs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-black/20 rounded-2xl border border-white/5 my-10">
                <h2 className="text-2xl font-semibold mb-2">No Evaluation Runs Found</h2>
                <p className="text-muted-foreground text-center max-w-md">
                  Run the AI Evaluation Suite via CLI to generate evaluation metrics.
                </p>
              </div>
            ) : (
              <div className="flex flex-col space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/5 shrink-0">
                  <h2 className="text-xl font-bold tracking-tight">AI Evaluation Runs</h2>
                  <div className="flex space-x-2 w-full sm:w-auto">
                    <select
                      className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-purple-500/50 outline-none w-full sm:w-auto"
                      onChange={(e) => setSelectedRun(runs.find(r => r.id === e.target.value) || null)}
                      value={selectedRun?.id || ""}
                    >
                      {runs.map(run => (
                        <option key={run.id} value={run.id}>
                          {new Date(run.createdAt).toLocaleString()} - {run.promptVersion} ({run.datasetName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedRun && (
                  <div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                      <Card className="bg-black/20 border-white/5 shadow-xl">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">Overall Accuracy</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-foreground">{(selectedRun.accuracy * 100).toFixed(1)}%</div>
                          <p className="text-xs font-semibold mt-1 text-purple-400">F1 Score: {(selectedRun.f1Score * 100).toFixed(1)}%</p>
                        </CardContent>
                      </Card>

                      <Card className="bg-black/20 border-white/5 shadow-xl">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">Opp / Deadline Acc</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-foreground">{(selectedRun.opportunityAccuracy * 100).toFixed(1)}%</div>
                          <p className="text-xs font-semibold mt-1 text-purple-400">Deadline: {(selectedRun.deadlineAccuracy * 100).toFixed(1)}%</p>
                        </CardContent>
                      </Card>

                      <Card className="bg-black/20 border-white/5 shadow-xl">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">Average Latency</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-foreground">{selectedRun.averageLatencyMs.toFixed(0)} <span className="text-xl">ms</span></div>
                          <p className="text-xs font-semibold mt-1 text-muted-foreground">Per email processed</p>
                        </CardContent>
                      </Card>

                      <Card className="bg-black/20 border-white/5 shadow-xl">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-foreground">${selectedRun.totalCost.toFixed(4)}</div>
                          <p className="text-xs font-semibold mt-1 text-muted-foreground">Total for {selectedRun.totalEmails} emails</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="bg-black/20 rounded-2xl border border-white/5 p-6 shadow-xl mb-12">
                      <h3 className="text-xl font-bold tracking-tight mb-6 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-red-400" />
                        Mismatches / Errors
                      </h3>
                      <div className="space-y-4">
                        {selectedRun.results.filter(r => !r.isPerfectMatch).length === 0 ? (
                          <div className="text-muted-foreground text-center py-10 font-medium">No errors! 100% perfect match.</div>
                        ) : (
                          selectedRun.results.filter(r => !r.isPerfectMatch).map(result => (
                            <Card key={result.id} className="border-red-900/30 bg-red-950/20 backdrop-blur-sm">
                              <CardHeader className="py-4 border-b border-red-900/20">
                                <CardTitle className="text-base text-red-100">{result.emailSubject}</CardTitle>
                                <CardDescription className="text-red-400/80">{result.emailFrom}</CardDescription>
                              </CardHeader>
                              <CardContent className="py-4 text-sm">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                    <div className="font-bold text-muted-foreground uppercase tracking-wider text-xs mb-2">Expected</div>
                                    <div className="flex justify-between border-b border-white/5 pb-1"><span>Category:</span> <span>{result.expectedCategory}</span></div>
                                    <div className="flex justify-between border-b border-white/5 pb-1"><span>Action:</span> <span>{result.expectedActionReq ? "Yes" : "No"}</span></div>
                                    <div className="flex justify-between border-b border-white/5 pb-1"><span>Opportunity:</span> <span>{result.expectedOpportunity ? "Yes" : "No"}</span></div>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="font-bold text-muted-foreground uppercase tracking-wider text-xs mb-2">Actual</div>
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

      <ConfirmModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        title="Permanently Delete User"
        description="Are you absolutely sure you want to delete this user? This action cannot be undone. All of their connected email accounts, rules, and analysis history will be permanently destroyed."
        confirmText="Delete Account"
        cancelText="Cancel"
        isDestructive={true}
        loading={isDeleting}
      />
    </div>
  );
}