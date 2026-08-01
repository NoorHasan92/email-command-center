// app/dashboard/page.tsx
// This file is a page component for the dashboard.
// It fetches data from the database and passes it to the DashboardClient component.

import { db } from "@/server/repositories/db";
import { Prisma } from "@prisma/client";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Fetch Inbox Health Metrics
  const criticalCount = await db.emailAnalysis.count({
    where: { score: { gte: 90 } }
  });

  const actionRequiredCount = await db.emailAnalysis.count({
    where: { isActionRequired: true }
  });

  // Very simplified approximation for deadlines - in a real app, you'd parse dates
  const deadlinesCount = await db.emailAnalysis.count({
    where: { extractedDeadlines: { not: Prisma.DbNull } }
  });

  const lastSync = await db.emailAccount.findFirst({
    where: { provider: "gmail" },
    orderBy: { lastSyncCompletedAt: "desc" },
    select: { lastSyncCompletedAt: true }
  });

  const healthData = {
    criticalCount,
    actionRequiredCount,
    deadlinesToday: Math.floor(deadlinesCount * 0.2), // Mock logic for V1 visual
    deadlinesWeek: deadlinesCount,
    lastSync: lastSync?.lastSyncCompletedAt?.toISOString() || null
  };

  // Fetch recent emails with analysis
  const recentEmails = await db.email.findMany({
    orderBy: { date: "desc" },
    take: 50,
    include: {
      analysis: true,
      emailAccount: {
        select: { provider: true, emailAddress: true }
      }
    }
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      <DashboardClient initialEmails={recentEmails} healthData={healthData} />
    </div>
  );
}
