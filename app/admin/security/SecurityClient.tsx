"use client";

import { useState, useEffect } from "react";
import { getAdminSecurityLogs, revokeUserSessions, getSuspiciousActivity } from "@/server/actions/admin-security.actions";
import { Input } from "@/components/ui/input";
import { Search, ShieldAlert, RefreshCcw, Lock } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export function SecurityClient() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [threats, setThreats] = useState<any>(null);

  // For revoking sessions
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeLoading, setRevokeLoading] = useState(false);

  const fetchLogs = async (searchTerm = search, pageNum = page) => {
    setLoading(true);
    try {
      const [data, threatsData] = await Promise.all([
        getAdminSecurityLogs(pageNum, 50, searchTerm),
        getSuspiciousActivity()
      ]);
      setLogs(data.logs);
      setTotal(data.total);
      setThreats(threatsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchLogs(search, 1);
      setPage(1);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleRevoke = async () => {
    if (!revokingId) return;
    setRevokeLoading(true);
    try {
      await revokeUserSessions(revokingId);
      alert("Sessions successfully revoked.");
    } catch (err: any) {
      alert("Failed to revoke: " + err.message);
    } finally {
      setRevokeLoading(false);
      setRevokingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-indigo-400" />
          Security Center
        </h2>
        
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Search by Email or IP Address..." 
            className="pl-9 bg-[#111] border-border/10 text-white"
          />
        </div>
      </div>

      {threats && (threats.highFailureUsers.length > 0 || threats.recentLockouts.length > 0) && (
        <Card className="bg-red-500/5 border-red-500/20 mb-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Threat Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {threats.highFailureUsers.length > 0 && (
              <div>
                <h4 className="text-red-300 mb-1 font-medium">High Login Failures ({">"}5 attempts)</h4>
                <ul className="text-red-200/70 list-disc pl-5">
                  {threats.highFailureUsers.map((u: any) => (
                    <li key={u.id}>{u.email} ({u.failedLoginAttempts} failures)</li>
                  ))}
                </ul>
              </div>
            )}
            {threats.recentLockouts.length > 0 && (
              <div>
                <h4 className="text-red-300 mb-1 font-medium">Recent Account Lockouts (Last 24h)</h4>
                <ul className="text-red-200/70 list-disc pl-5">
                  {threats.recentLockouts.map((l: any) => (
                    <li key={l.id}>{l.user?.email || "Unknown"} (IP: {l.ipAddress || "N/A"})</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="bg-[#0f0f0f] border border-border/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-black/40 border-b border-border/10">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Action</th>
                <th className="px-6 py-4 font-semibold">IP Address</th>
                <th className="px-6 py-4 font-semibold">User Agent</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    <RefreshCcw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading security logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No security events found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isFailure = log.action.includes("FAILED") || log.action.includes("LOCKED");
                  const isSuccess = log.action.includes("SUCCESS") || log.action === "LOGIN_SUCCESS";

                  return (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{log.user?.name || "System/Unknown"}</div>
                        <div className="text-xs text-slate-500">{log.user?.email || "-"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={
                          isFailure ? "bg-red-500/20 text-red-400 border-0" :
                          isSuccess ? "bg-emerald-500/20 text-emerald-400 border-0" :
                          "bg-slate-500/20 text-slate-400 border-0"
                        }>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">
                        {log.ipAddress || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[10px] text-slate-500 max-w-[200px] truncate" title={log.userAgent || ""}>
                          {log.userAgent || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {format(new Date(log.createdAt), "MMM d, yyyy HH:mm")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {log.user?.id && (
                          <button
                            onClick={() => setRevokingId(log.user.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-xs font-medium"
                          >
                            <Lock className="w-3 h-3" />
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm text-slate-400">
        <div>Showing {logs.length} of {total} events</div>
        <div className="flex gap-2">
          <button 
            disabled={page === 1}
            onClick={() => { setPage(p => p - 1); fetchLogs(search, page - 1); }}
            className="px-3 py-1 bg-[#111] border border-border/10 rounded hover:bg-white/5 disabled:opacity-50"
          >
            Previous
          </button>
          <button 
            disabled={logs.length < 50}
            onClick={() => { setPage(p => p + 1); fetchLogs(search, page + 1); }}
            className="px-3 py-1 bg-[#111] border border-border/10 rounded hover:bg-white/5 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!revokingId}
        onClose={() => setRevokingId(null)}
        onConfirm={handleRevoke}
        title="Revoke All Sessions"
        description="Are you sure you want to revoke all active sessions for this user? They will be immediately logged out of all devices. This action is logged."
        confirmText="Revoke Sessions"
        cancelText="Cancel"
        isDestructive={true}
        loading={revokeLoading}
      />
    </div>
  );
}
