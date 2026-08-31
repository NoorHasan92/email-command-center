import { db } from "@/server/repositories/db";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/actions/admin.actions";
import { UserAvatar } from "@/components/common/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { KeyRound, Mail, Activity, Calendar, ShieldAlert, Shield } from "lucide-react";
import { EntitlementManagementCard } from "./EntitlementManagementCard";

export default async function AdminUserDetailPage({ params }: { params: { userId: string } }) {
  await requireAdmin();
  
  const user = await db.user.findUnique({
    where: { id: params.userId },
    include: {
      emailAccounts: true,
      aiUsage: true,
      aiConnection: true,
      aiQuotaGrants: { orderBy: { createdAt: "desc" }, take: 5 },
      entitlements: { orderBy: { grantedAt: "desc" } },
      _count: {
        select: {
          auditLogs: true,
          orders: true,
          transactionalEmailLogs: true
        }
      }
    }
  });

  if (!user) {
    return notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row md:items-start gap-6 bg-[#0f0f0f] border border-border/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="shrink-0">
          <UserAvatar src={user.image} name={user.name} size="xl" />
        </div>
        
        <div className="flex flex-col gap-2 flex-1 z-10">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <h1 className="text-3xl font-black text-white tracking-tight">{user.name || "Unknown User"}</h1>
            <div className="flex items-center gap-2">
              {user.role === "ADMIN" && (
                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                  <KeyRound className="w-3 h-3 mr-1" /> Admin
                </Badge>
              )}
              <Badge variant="secondary" className="bg-white/5 text-slate-300 border-border/10 hover:bg-white/10">
                {user.plan} PLAN
              </Badge>
              {user.lockedUntil && new Date(user.lockedUntil) > new Date() && (
                <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">Locked out</Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-slate-400 font-medium">
            <Mail className="w-4 h-4" />
            <a href={`mailto:${user.email}`} className="hover:text-indigo-400 transition-colors">{user.email}</a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">Joined</span>
              <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">Last Login</span>
              <span className="text-sm font-medium text-slate-300">
                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}
              </span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">Email Accounts</span>
              <span className="text-sm font-medium text-slate-300">{user.emailAccounts.length} Connected</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">BYOK Status</span>
              <span className="text-sm font-medium text-slate-300">
                {user.aiConnection?.status === "ACTIVE" ? (
                  <span className="text-emerald-400 font-bold">Active</span>
                ) : (
                  <span className="text-slate-500">Not configured</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Email Accounts */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-400" />
            Connected Inboxes
          </h2>
          <div className="bg-[#0f0f0f] border border-border/10 rounded-2xl overflow-hidden shadow-inner flex flex-col">
            {user.emailAccounts.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No email accounts connected.</div>
            ) : (
              user.emailAccounts.map(account => (
                <div key={account.id} className="p-4 border-b border-border/5 flex items-center justify-between last:border-0">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-white">{account.emailAddress}</span>
                    <span className="text-xs text-slate-500 uppercase tracking-wider">{account.provider}</span>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20">
                    {account.syncStatus}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Activity Summary */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Platform Footprint
          </h2>
          <div className="bg-[#0f0f0f] border border-border/10 rounded-2xl p-6 shadow-inner flex flex-col gap-6">
            <div className="flex justify-between items-center pb-4 border-b border-border/5">
              <span className="text-slate-400 font-medium">Orders / Payments</span>
              <span className="text-white font-bold">{user._count.orders}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-border/5">
              <span className="text-slate-400 font-medium">Transactional Emails Received</span>
              <span className="text-white font-bold">{user._count.transactionalEmailLogs}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Audit Log Events</span>
              <span className="text-white font-bold">{user._count.auditLogs}</span>
            </div>
          </div>
        </div>
        
        {/* Entitlements Management */}
        <EntitlementManagementCard userId={user.id} entitlements={user.entitlements} />
      </div>
    </div>
  );
}
