import { db } from "@/server/repositories/db";
import { requireAdmin } from "@/server/actions/admin.actions";
import { Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function AdminAuditLogsPage() {
  await requireAdmin();

  const logs = await db.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <div className="flex flex-col gap-8 w-full">
      <div>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-white">
          <Database className="w-8 h-8 text-indigo-500" />
          System Audit Logs
        </h1>
        <p className="text-slate-400 mt-2 font-medium">Immutable record of administrative actions.</p>
      </div>

      <div className="bg-[#0f0f0f] rounded-2xl border border-border/10 shadow-2xl overflow-x-auto">
        <div className="min-w-[800px] w-full p-1">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-[#0a0a0a] text-slate-500 border-b border-border/10 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 rounded-tl-xl font-bold tracking-wider">Timestamp</th>
                <th className="px-6 py-4 font-bold tracking-wider">Admin ID</th>
                <th className="px-6 py-4 font-bold tracking-wider">Action</th>
                <th className="px-6 py-4 font-bold tracking-wider">Target User ID</th>
                <th className="px-6 py-4 rounded-tr-xl font-bold tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500">
                    No audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="border-b border-border/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-300">
                      {log.adminId}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-300">
                      {log.targetUserId}
                    </td>
                    <td className="px-6 py-4">
                      <pre className="bg-black/40 p-2 rounded text-xs font-mono text-slate-300 max-w-xs overflow-x-auto">
                        {JSON.stringify(log.newValue, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
