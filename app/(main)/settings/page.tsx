// app/settings/page.tsx
// Renders the security settings and active sessions dashboard.

import { getActiveSessions } from "@/server/actions/auth.actions";
import { auth } from "@/config/auth";
import { db } from "@/server/repositories/db";
import SettingsClient from "./SettingsClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
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
      accounts: { select: { provider: true } }
    }
  });

  const hasGoogleLinked = user?.accounts?.some(acc => acc.provider === "google") ?? false;

  return (
    <SettingsClient 
      sessions={sessions} 
      currentSessionId={currentSessionId} 
      user={user} 
      hasPassword={!!user?.passwordHash} 
      hasGoogleLinked={hasGoogleLinked}
    />
  );
}
