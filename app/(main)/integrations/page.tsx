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
    select: { whatsappOptIn: true, phoneNumber: true }
  });

  const accounts = await db.emailAccount.findMany({
    where: { userId: session.user.id }
  });
  
  const gmailAccount = accounts.find(a => a.provider === "gmail");

  return (
    <IntegrationsClient 
      gmailAccount={gmailAccount ? JSON.parse(JSON.stringify(gmailAccount)) : undefined}
      whatsappOptIn={user?.whatsappOptIn || false}
      phoneNumber={user?.phoneNumber || null}
    />
  );
}
