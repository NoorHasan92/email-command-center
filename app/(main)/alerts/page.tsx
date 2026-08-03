import { db } from "@/server/repositories/db";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { auth } from "@/config/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const notifications = await db.notificationLog.findMany({
    where: { email: { emailAccount: { userId } } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      email: {
        select: { subject: true, from: true }
      }
    }
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-auto p-6 lg:p-10 z-10 relative">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Notification Alerts</h1>
            <p className="text-muted-foreground">Recent alerts sent via WhatsApp and Email</p>
          </div>
        </div>

        <div className="bg-card/90 backdrop-blur border border-border rounded-xl overflow-hidden shadow-sm">
          {notifications.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center text-muted-foreground">
              <Bell className="w-12 h-12 mb-4 opacity-20" />
              <p>No notifications sent yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((log) => (
                <div key={log.id} className="p-5 flex items-start gap-4 hover:bg-secondary/30 transition-colors">
                  <div className="mt-1">
                    {log.status === "DELIVERED" || log.status === "READ" || log.status === "SENT" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : log.status === "FAILED" ? (
                      <AlertCircle className="w-5 h-5 text-destructive" />
                    ) : (
                      <Clock className="w-5 h-5 text-orange-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{log.channel}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider uppercase ${log.status === 'FAILED' ? 'bg-destructive/10 text-destructive' : (log.status === 'DELIVERED' || log.status === 'READ' || log.status === 'SENT') ? 'bg-green-500/10 text-green-500' : 'bg-secondary text-muted-foreground'}`}>
                        {log.status}
                      </span>
                    </div>
                    <p className="text-sm truncate font-medium text-foreground">{log.email.subject || "No Subject"}</p>
                    <p className="text-sm text-muted-foreground truncate">{log.email.from}</p>
                    {log.error && (
                      <p className="text-xs text-destructive mt-1 font-medium">{log.error}</p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                    {formatDistanceToNow(log.createdAt, { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
