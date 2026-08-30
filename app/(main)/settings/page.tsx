// app/settings/page.tsx
// Renders the security settings and active sessions dashboard.

import { getActiveSessions } from "@/server/actions/auth.actions";
import { auth } from "@/config/auth";
import { db } from "@/server/repositories/db";
import SettingsClient from "./SettingsClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: { tab?: string } }) {
  const { sessions, currentSessionId } = await getActiveSessions();
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { 
      name: true, 
      email: true, 
      image: true,
      passwordHash: true,
      plan: true,
      appPreferences: true,
      byokEnabled: true,
      aiConnection: {
        select: {
          id: true,
          provider: true,
          keyLastFour: true,
          status: true,
          selectedModel: true,
          processingMode: true,
          allowPlatformFallback: true,
          lastVerifiedAt: true,
          personalRequestCount: true,
          fallbackRequestCount: true,
        }
      },
      accounts: { select: { provider: true } }
    }
  });

  const hasGoogleLinked = user?.accounts?.some(acc => acc.provider === "google") ?? false;
  
  // Await searchParams before accessing properties (Next.js 15+ requirement)
  const resolvedSearchParams = await searchParams;
  const initialTab = resolvedSearchParams?.tab || "profile";

  return (
    <SettingsClient 
      sessions={sessions} 
      currentSessionId={currentSessionId} 
      user={user} 
      hasPassword={!!user?.passwordHash} 
      hasGoogleLinked={hasGoogleLinked}
      initialTab={initialTab}
    />
  );
}
