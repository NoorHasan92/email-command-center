import { db } from "@/server/repositories/db";
import InboxClient from "./InboxClient";
import { auth } from "@/config/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const recentEmails = await db.email.findMany({
    where: { emailAccount: { userId } },
    orderBy: { date: "desc" },
    take: 100,
    include: {
      analysis: true,
      emailAccount: {
        select: { provider: true, emailAddress: true }
      }
    }
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      <InboxClient initialEmails={recentEmails} />
    </div>
  );
}
