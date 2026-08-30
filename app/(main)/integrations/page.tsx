import { db } from "@/server/repositories/db";
import { auth } from "@/config/auth";
import IntegrationsClient from "./IntegrationsClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { 
      whatsappOptIn: true, 
      phoneNumber: true,
      telegramOptIn: true,
      telegramChatId: true,
      telegramUsername: true,
      notifyChannels: true,
      plan: true,
    }
  });

  const accounts = await db.emailAccount.findMany({
    where: { userId: session.user.id }
  });
  
  const gmailAccounts = accounts.filter(a => a.provider === "gmail");

  return (
    <IntegrationsClient 
      gmailAccounts={JSON.parse(JSON.stringify(gmailAccounts))}
      userPlan={user?.plan || "FREE"}
      whatsappOptIn={user?.whatsappOptIn || false}
      phoneNumber={user?.phoneNumber || null}
      telegramOptIn={user?.telegramOptIn || false}
      telegramChatId={user?.telegramChatId || null}
      telegramUsername={user?.telegramUsername || null}
      notifyChannels={Array.isArray(user?.notifyChannels) ? user.notifyChannels as string[] : []}
    />
  );
}
