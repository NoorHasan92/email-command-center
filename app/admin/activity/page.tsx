import { db } from "@/server/repositories/db";
import { requireAdmin } from "@/server/actions/admin.actions";
import { Activity } from "lucide-react";
import { UserAvatar } from "@/components/common/UserAvatar";
import { Badge } from "@/components/ui/badge";

export default async function AdminActivityPage() {
  await requireAdmin();

  const recentUsers = await db.user.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
  });

  const recentDeletions = await db.accountDeletionRequest.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: { user: true }
  });

  return (
    <div className="flex flex-col gap-8 w-full">
      <div>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-white">
          <Activity className="w-8 h-8 text-indigo-500" />
          Activity & Events
        </h1>
        <p className="text-slate-400 mt-2 font-medium">Recent platform activities and account lifecycles.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Registrations */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white">New Registrations</h2>
          <div className="bg-[#0f0f0f] border border-border/10 rounded-2xl overflow-hidden shadow-inner flex flex-col">
            {recentUsers.map(user => (
              <div key={user.id} className="p-4 border-b border-border/5 flex items-center justify-between last:border-0 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <UserAvatar src={user.image} name={user.name} size="sm" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-white leading-tight">{user.name || "Unknown"}</span>
                    <span className="text-xs text-slate-500">{user.email}</span>
                  </div>
                </div>
                <div className="text-xs font-medium text-slate-400">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Account Deletions */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white">Account Deletion Requests</h2>
          <div className="bg-[#0f0f0f] border border-border/10 rounded-2xl overflow-hidden shadow-inner flex flex-col">
            {recentDeletions.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No recent deletion requests.</div>
            ) : (
              recentDeletions.map(req => (
                <div key={req.id} className="p-4 border-b border-border/5 flex items-center justify-between last:border-0 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <UserAvatar src={req.user?.image} name={req.user?.name} size="sm" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-white leading-tight">{req.user?.name || "Unknown"}</span>
                      <span className="text-xs text-slate-500">{req.user?.email}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className={`
                      ${req.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}
                      ${req.status === 'SCHEDULED' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : ''}
                      ${req.status === 'FAILED' ? 'bg-red-500/10 text-red-400 border-red-500/20' : ''}
                      ${req.status === 'CANCELLED' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' : ''}
                    `}>
                      {req.status}
                    </Badge>
                    <span className="text-xs text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
