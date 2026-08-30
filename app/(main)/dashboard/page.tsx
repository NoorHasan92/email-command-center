import { cookies } from "next/headers";
import { db } from "@/server/repositories/db";
import { Prisma } from "@prisma/client";
import DashboardClient from "./DashboardClient";
import { auth } from "@/config/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  
  const cookieStore = await cookies();
  const selectedAccountId = cookieStore.get("selected_account_id")?.value;
  const accountId = selectedAccountId === "all" ? undefined : selectedAccountId;

  // All queries MUST be scoped to the authenticated user's email accounts
  // If accountId is provided, scope to that specific account
  const accountFilter = accountId ? { id: accountId, userId } : { userId };

  // Fetch Inbox Health Metrics
  const criticalCount = await db.emailAnalysis.count({
    where: { urgencyScore: { gte: 90 }, email: { emailAccount: accountFilter, status: { notIn: ["NOTIFIED", "SKIPPED"] } } }
  });

  const actionRequiredCount = await db.emailAnalysis.count({
    where: { requiresAction: true, email: { emailAccount: accountFilter, status: { notIn: ["NOTIFIED", "SKIPPED"] } } }
  });

  const deadlinesCount = await db.emailAnalysis.count({
    where: { deadline: { not: null }, email: { emailAccount: accountFilter, status: { notIn: ["NOTIFIED", "SKIPPED"] } } }
  });

  const lastSync = await db.emailAccount.findFirst({
    where: { ...accountFilter, provider: "gmail" },
    orderBy: { lastSyncCompletedAt: "desc" },
    select: { lastSyncCompletedAt: true }
  });

  const healthData = {
    criticalCount,
    actionRequiredCount,
    deadlinesToday: Math.floor(deadlinesCount * 0.2),
    deadlinesWeek: deadlinesCount,
    lastSync: lastSync?.lastSyncCompletedAt?.toISOString() || null
  };

  // Fetch recent emails with analysis — SCOPED TO USER or SPECIFIC ACCOUNT
  const recentEmails = await db.email.findMany({
    where: { emailAccount: accountFilter, status: { notIn: ["NOTIFIED", "SKIPPED"] } },
    orderBy: { date: "desc" },
    take: 50,
    include: {
      analysis: true,
      emailAccount: {
        select: { provider: true, emailAddress: true }
      }
    }
  });

  // Fetch recent notifications
  const recentNotifications = await db.notificationLog.findMany({
    where: { email: { emailAccount: accountFilter } },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      email: { select: { subject: true } }
    }
  });

  // Fetch user's email accounts for the switcher
  const emailAccounts = await db.emailAccount.findMany({
    where: { userId },
    select: { id: true, emailAddress: true }
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative overflow-hidden">
      <DashboardClient 
        initialEmails={recentEmails} 
        healthData={healthData} 
        recentNotifications={recentNotifications}
        emailAccounts={emailAccounts}
        selectedAccountId={accountId || null}
      />
    </div>
  );
}
