"use client";

import { useState, useEffect } from "react";
import { getAdminAccountDeletions, forceFailDeletion, retryDeletion } from "@/server/actions/admin-business.actions";
import { Input } from "@/components/ui/input";
import { Search, Trash2, RefreshCcw, AlertTriangle, Play } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export function AccountDeletionsClient() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchRequests = async (searchTerm = search, pageNum = page) => {
    setLoading(true);
    try {
      const data = await getAdminAccountDeletions(pageNum, 50, searchTerm);
      setRequests(data.requests);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchRequests(search, 1);
      setPage(1);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleForceFail = async (id: string) => {
    if (!confirm("Are you sure you want to FORCE FAIL this processing request?")) return;
    try {
      await forceFailDeletion(id);
      fetchRequests();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRetry = async (id: string) => {
    if (!confirm("Are you sure you want to retry this failed request? The cleanup cron will pick it up.")) return;
    try {
      await retryDeletion(id);
      fetchRequests();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-indigo-400" />
          Account Deletions
        </h2>
        
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Search by User Email..." 
            className="pl-9 bg-[#111] border-border/10 text-white"
          />
        </div>
      </div>

      <div className="bg-[#0f0f0f] border border-border/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-black/40 border-b border-border/10">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Reason</th>
                <th className="px-6 py-4 font-semibold">Requested At</th>
                <th className="px-6 py-4 font-semibold">Scheduled / Deleted At</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    <RefreshCcw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No account deletion requests found.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{r.user?.name || "Unknown"}</div>
                      <div className="text-xs text-slate-500">{r.user?.email || "-"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={
                        r.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-400 border-0" :
                        r.status === "SCHEDULED" ? "bg-blue-500/20 text-blue-400 border-0" :
                        r.status === "PROCESSING" ? "bg-amber-500/20 text-amber-400 border-0" :
                        r.status === "FAILED" ? "bg-red-500/20 text-red-400 border-0" :
                        "bg-slate-500/20 text-slate-400 border-0"
                      }>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-300 max-w-[250px] truncate" title={r.reason || ""}>
                        {r.reason || "-"}
                      </div>
                      {r.feedback && (
                        <div className="text-[10px] text-slate-500 mt-1 max-w-[250px] truncate" title={r.feedback}>
                          Feedback: {r.feedback}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {r.requestedAt ? format(new Date(r.requestedAt), "MMM d, yyyy HH:mm") : "-"}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {r.deletedAt ? (
                        <span className="text-emerald-400">
                          {format(new Date(r.deletedAt), "MMM d, yyyy HH:mm")}
                        </span>
                      ) : r.scheduledDeletionAt ? (
                        <span className="text-blue-400">
                          {format(new Date(r.scheduledDeletionAt), "MMM d, yyyy HH:mm")}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {r.status === "PROCESSING" && (
                        <button 
                          onClick={() => handleForceFail(r.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-xs font-medium"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          Force Fail
                        </button>
                      )}
                      {r.status === "FAILED" && (
                        <button 
                          onClick={() => handleRetry(r.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-xs font-medium"
                        >
                          <Play className="w-3 h-3" />
                          Safe Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination Controls */}
      <div className="flex items-center justify-between text-sm text-slate-400">
        <div>Showing {requests.length} of {total} requests</div>
        <div className="flex gap-2">
          <button 
            disabled={page === 1}
            onClick={() => { setPage(p => p - 1); fetchRequests(search, page - 1); }}
            className="px-3 py-1 bg-[#111] border border-border/10 rounded hover:bg-white/5 disabled:opacity-50"
          >
            Previous
          </button>
          <button 
            disabled={requests.length < 50}
            onClick={() => { setPage(p => p + 1); fetchRequests(search, page + 1); }}
            className="px-3 py-1 bg-[#111] border border-border/10 rounded hover:bg-white/5 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
