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

  // All queries MUST be scoped to the authenticated user's email accounts
  const userAccountFilter = { emailAccount: { userId } };

  // Fetch Inbox Health Metrics
  const criticalCount = await db.emailAnalysis.count({
    where: { urgencyScore: { gte: 90 }, email: { emailAccount: { userId }, status: { notIn: ["NOTIFIED", "SKIPPED"] } } }
  });

  const actionRequiredCount = await db.emailAnalysis.count({
    where: { requiresAction: true, email: { emailAccount: { userId }, status: { notIn: ["NOTIFIED", "SKIPPED"] } } }
  });

  const deadlinesCount = await db.emailAnalysis.count({
    where: { deadline: { not: null }, email: { emailAccount: { userId }, status: { notIn: ["NOTIFIED", "SKIPPED"] } } }
  });

  const lastSync = await db.emailAccount.findFirst({
    where: { userId, provider: "gmail" },
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

  // Fetch recent emails with analysis — SCOPED TO USER
  const recentEmails = await db.email.findMany({
    where: { emailAccount: { userId }, status: { notIn: ["NOTIFIED", "SKIPPED"] } },
    orderBy: { date: "desc" },
    take: 50,
    include: {
      analysis: true,
      emailAccount: {
        select: { provider: true, emailAddress: true }
      }
    }
  });

  // Fetch recent notifications — SCOPED TO USER
  const recentNotifications = await db.notificationLog.findMany({
    where: { email: { emailAccount: { userId } } },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      email: { select: { subject: true } }
    }
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative overflow-hidden">
      <DashboardClient 
        initialEmails={recentEmails} 
        healthData={healthData} 
        recentNotifications={recentNotifications} 
      />
    </div>
  );
}
