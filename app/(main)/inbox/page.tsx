import { db } from "@/server/repositories/db";
import InboxClient from "./InboxClient";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const recentEmails = await db.email.findMany({
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
