"use client";

import { useState, useEffect } from "react";
import { getAdminTransactionalEmails } from "@/server/actions/admin-business.actions";
import { Input } from "@/components/ui/input";
import { Search, Mail, RefreshCcw } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export function EmailsClient() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchEmails = async (searchTerm = search, pageNum = page) => {
    setLoading(true);
    try {
      const data = await getAdminTransactionalEmails(pageNum, 50, searchTerm);
      setEmails(data.emails);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchEmails(search, 1);
      setPage(1);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Mail className="w-5 h-5 text-indigo-400" />
          Transactional Emails
        </h2>
        
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Search Recipient, Subject, Idempotency Key..." 
            className="pl-9 bg-[#111] border-border/10 text-white"
          />
        </div>
      </div>

      <div className="bg-[#0f0f0f] border border-border/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-black/40 border-b border-border/10">
              <tr>
                <th className="px-6 py-4 font-semibold">Recipient</th>
                <th className="px-6 py-4 font-semibold">Subject & Type</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Idempotency Key</th>
                <th className="px-6 py-4 font-semibold">Date Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    <RefreshCcw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading emails...
                  </td>
                </tr>
              ) : emails.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No transactional emails found.
                  </td>
                </tr>
              ) : (
                emails.map((e) => (
                  <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-medium text-white">
                      {e.recipient}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{e.subject}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">{e.type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={
                        e.status === "DELIVERED" ? "bg-emerald-500/20 text-emerald-400 border-0" :
                        e.status === "FAILED" ? "bg-red-500/20 text-red-400 border-0" :
                        e.status === "BOUNCED" ? "bg-orange-500/20 text-orange-400 border-0" :
                        e.status === "COMPLAINED" ? "bg-rose-500/20 text-rose-400 border-0" :
                        "bg-slate-500/20 text-slate-400 border-0"
                      }>
                        {e.status}
                      </Badge>
                      {e.lastError && (
                        <div className="text-[10px] text-red-400 mt-1 max-w-[200px] truncate" title={e.lastError}>
                          {e.lastError}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-slate-400 truncate max-w-[200px]" title={e.idempotencyKey}>
                        {e.idempotencyKey}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {e.sentAt ? format(new Date(e.sentAt), "MMM d, yyyy HH:mm") : "-"}
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
        <div>Showing {emails.length} of {total} emails</div>
        <div className="flex gap-2">
          <button 
            disabled={page === 1}
            onClick={() => { setPage(p => p - 1); fetchEmails(search, page - 1); }}
            className="px-3 py-1 bg-[#111] border border-border/10 rounded hover:bg-white/5 disabled:opacity-50"
          >
            Previous
          </button>
          <button 
            disabled={emails.length < 50}
            onClick={() => { setPage(p => p + 1); fetchEmails(search, page + 1); }}
            className="px-3 py-1 bg-[#111] border border-border/10 rounded hover:bg-white/5 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
