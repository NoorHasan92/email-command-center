"use client";

import { useState, useEffect } from "react";
import { getAdminPayments } from "@/server/actions/admin-business.actions";
import { Input } from "@/components/ui/input";
import { Search, ExternalLink, RefreshCcw, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export function PaymentsClient() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchPayments = async (searchTerm = search, pageNum = page) => {
    setLoading(true);
    try {
      const data = await getAdminPayments(pageNum, 50, searchTerm);
      setPayments(data.payments);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPayments(search, 1);
      setPage(1);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-indigo-400" />
          Transactions Lifecycle
        </h2>
        
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Search Order ID, Razorpay ID, Email..." 
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
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Order ID / Receipt</th>
                <th className="px-6 py-4 font-semibold">Razorpay ID</th>
                <th className="px-6 py-4 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    <RefreshCcw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading payments...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No payments found.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{p.user?.name || "Unknown"}</div>
                      <div className="text-xs text-slate-500">{p.user?.email || "-"}</div>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-300">
                      {p.currency} {(p.amount / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={
                        p.status === "CAPTURED" ? "bg-emerald-500/20 text-emerald-400 border-0" :
                        p.status === "FAILED" ? "bg-red-500/20 text-red-400 border-0" :
                        p.status === "REFUNDED" ? "bg-amber-500/20 text-amber-400 border-0" :
                        "bg-slate-500/20 text-slate-400 border-0"
                      }>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-slate-400">{p.order?.referenceNumber || "-"}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{p.receiptNumber || "-"}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-indigo-300">
                      {p.providerPaymentId ? (
                        <a 
                          href={`https://dashboard.razorpay.com/app/payments/${encodeURIComponent(p.providerPaymentId)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 hover:text-indigo-400 hover:underline"
                        >
                          {p.providerPaymentId}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : "-"}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {format(new Date(p.createdAt), "MMM d, yyyy HH:mm")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Basic Pagination Controls */}
      <div className="flex items-center justify-between text-sm text-slate-400">
        <div>Showing {payments.length} of {total} payments</div>
        <div className="flex gap-2">
          <button 
            disabled={page === 1}
            onClick={() => { setPage(p => p - 1); fetchPayments(search, page - 1); }}
            className="px-3 py-1 bg-[#111] border border-border/10 rounded hover:bg-white/5 disabled:opacity-50"
          >
            Previous
          </button>
          <button 
            disabled={payments.length < 50}
            onClick={() => { setPage(p => p + 1); fetchPayments(search, page + 1); }}
            className="px-3 py-1 bg-[#111] border border-border/10 rounded hover:bg-white/5 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
