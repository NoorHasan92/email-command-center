import { db } from "@/server/repositories/db";
import { formatDistanceToNow, format } from "date-fns";
import { Bell, CheckCircle2, AlertCircle, Clock, Smartphone, MessageCircle, Mail } from "lucide-react";
import { auth } from "@/config/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  
  const cookieStore = await cookies();
  const selectedAccountId = cookieStore.get("selected_account_id")?.value;
  const accountId = selectedAccountId === "all" ? undefined : selectedAccountId;

  const accountFilter = accountId ? { id: accountId, userId } : { userId };

  const notifications = await db.notificationLog.findMany({
    where: { email: { emailAccount: accountFilter } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      email: {
        select: { subject: true, from: true }
      }
    }
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-10 z-10 relative styled-scroll">
      <div className="max-w-4xl mx-auto w-full space-y-6 md:space-y-8 pb-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/50">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
              <Bell className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Alerts Timeline</h1>
              <p className="text-muted-foreground">A chronological history of AI-triggered notifications.</p>
            </div>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="bg-card/80 backdrop-blur border border-border/50 rounded-3xl p-16 text-center flex flex-col items-center text-muted-foreground shadow-sm">
            <Bell className="w-16 h-16 mb-6 opacity-20" />
            <h2 className="text-xl font-bold mb-2">It's quiet...</h2>
            <p className="max-w-sm leading-relaxed">No notifications have been routed yet. Check your rules engine to configure routing.</p>
          </div>
        ) : (
          <div className="relative pl-4 md:pl-8">
            {/* Timeline track */}
            <div className="absolute top-0 bottom-0 left-[27px] md:left-[43px] w-0.5 bg-border/50" />
            
            <div className="space-y-8">
              {notifications.map((log, index) => {
                const isSuccess = log.status === "DELIVERED" || log.status === "READ" || log.status === "SENT";
                const isFailed = log.status === "FAILED";
                const isPending = log.status === "PENDING";
                
                let StatusIcon = isSuccess ? CheckCircle2 : isFailed ? AlertCircle : Clock;
                let statusColor = isSuccess ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" : isFailed ? "text-destructive bg-destructive/10 border-destructive/20" : "text-orange-500 bg-orange-500/10 border-orange-500/20";
                
                let ChannelIcon = log.channel === "WHATSAPP" ? MessageCircle : log.channel === "TELEGRAM" ? Smartphone : Mail;
                
                return (
                  <div key={log.id} className="relative flex items-start gap-6 group">
                    {/* Timeline Node */}
                    <div className="relative z-10 flex flex-col items-center mt-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110 duration-300 ${statusColor}`}>
                        <StatusIcon className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Timeline Content */}
                    <div className="flex-1 bg-card/80 backdrop-blur border border-border/50 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md hover:border-border/80 group">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/80 border border-border/50 text-xs font-bold tracking-wider text-muted-foreground uppercase shadow-sm">
                              <ChannelIcon className="w-3.5 h-3.5" /> {log.channel}
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider uppercase border shadow-sm ${statusColor}`}>
                              {log.status}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono ml-auto md:ml-0 whitespace-nowrap">
                              {formatDistanceToNow(log.createdAt, { addSuffix: true })}
                            </span>
                          </div>
                          
                          <h3 className="text-base font-bold text-foreground mb-1 leading-snug line-clamp-2">
                            {log.email.subject || "No Subject"}
                          </h3>
                          <p className="text-sm text-muted-foreground font-medium truncate">
                            From: {log.email.from}
                          </p>
                          
                          {log.error && (
                            <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium leading-relaxed">
                              <span className="font-bold uppercase tracking-wider block mb-1">Delivery Error</span>
                              {log.error}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
