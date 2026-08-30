import { cookies } from "next/headers";
import { db } from "@/server/repositories/db";
import InboxClient from "./InboxClient";
import { auth } from "@/config/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  
  const cookieStore = await cookies();
  const selectedAccountId = cookieStore.get("selected_account_id")?.value;
  const accountId = selectedAccountId === "all" ? undefined : selectedAccountId;

  const accountFilter = accountId ? { id: accountId, userId } : { userId };

  const recentEmails = await db.email.findMany({
    where: { emailAccount: accountFilter },
    orderBy: { date: "desc" },
    take: 10,
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
