"use server";

import { db } from "@/server/repositories/db";
import { auth } from "@/config/auth";

export async function getAnalyticsData() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  // Verify if user has an email account connected
  const accountCount = await db.emailAccount.count({
    where: { userId }
  });

  if (accountCount === 0) {
    return { hasData: false };
  }

  // Get total processed (Emails belonging to this user)
  const totalProcessed = await db.email.count({
    where: {
      emailAccount: {
        userId
      }
    }
  });

  if (totalProcessed === 0) {
    return { hasData: false };
  }

  const criticalCount = await db.emailAnalysis.count({
    where: {
      urgencyScore: { gte: 80 },
      email: {
        emailAccount: { userId }
      }
    }
  });

  // Calculate last 7 days volume
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const emailsLast7Days = await db.email.findMany({
    where: {
      emailAccount: { userId },
      date: { gte: sevenDaysAgo }
    },
    include: { analysis: true }
  });

  // Group by day for the chart
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const activityMap = new Map();
  
  // Initialize last 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayName = days[d.getDay()];
    activityMap.set(dayName, { name: dayName, processed: 0, critical: 0 });
  }

  emailsLast7Days.forEach(email => {
    const dayName = days[new Date(email.date).getDay()];
    if (activityMap.has(dayName)) {
      const entry = activityMap.get(dayName);
      entry.processed += 1;
      if (email.analysis && email.analysis.urgencyScore >= 80) {
        entry.critical += 1;
      }
    }
  });

  const activityData = Array.from(activityMap.values());

  // Category Breakdown
  const categoryCounts = await db.emailAnalysis.groupBy({
    by: ['category'],
    where: {
      email: { emailAccount: { userId } }
    },
    _count: { category: true }
  });

  const categoryData = categoryCounts.map(c => ({
    name: c.category.charAt(0) + c.category.slice(1).toLowerCase().replace('_', ' '),
    count: c._count.category
  })).sort((a, b) => b.count - a.count);

  // Time saved estimation: Assume each email takes 1.5 mins to read manually, and AI saves 1 min per email
  const timeSavedMinutes = totalProcessed * 1.0;
  const hours = Math.floor(timeSavedMinutes / 60);
  const minutes = Math.floor(timeSavedMinutes % 60);
  const timeSavedStr = `${hours}h ${minutes}m`;

  // Calculate Accuracy
  const wrongFeedbackCount = await db.userLearningRule.count({
    where: {
      userId,
      feedbackType: 'WRONG'
    }
  });
  
  let accuracy = 100;
  if (totalProcessed > 0) {
    accuracy = Math.max(0, 100 - ((wrongFeedbackCount / totalProcessed) * 100));
  }
  const accuracyStr = `${accuracy.toFixed(1)}%`;

  return {
    hasData: true,
    stats: {
      totalProcessed,
      criticalCount,
      timeSaved: timeSavedStr,
      accuracy: accuracyStr
    },
    activityData,
    categoryData
  };
}
