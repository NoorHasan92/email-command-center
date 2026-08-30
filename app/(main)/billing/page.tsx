import { auth } from "@/config/auth";
import { db } from "@/server/repositories/db";
import { redirect } from "next/navigation";
import BillingClient from "./BillingClient";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      aiUsage: true,
      aiConnection: true
    }
  });

  if (!user) redirect("/login");

  // Sum active grants
  const activeGrants = await db.aIQuotaGrant.findMany({
    where: {
      userId,
      remainingAmount: { gt: 0 },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    }
  });

  const bonusAvailable = activeGrants.reduce((sum, g) => sum + g.remainingAmount, 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      <BillingClient 
        plan={user.plan}
        usage={user.aiUsage}
        bonusAvailable={bonusAvailable}
      />
    </div>
  );
}
