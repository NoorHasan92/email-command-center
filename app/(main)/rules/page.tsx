import { getRulesAction } from "@/server/actions/rules.actions";
import RulesClient from "./RulesClient";
import { auth } from "@/config/auth";
import { db } from "@/server/repositories/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { rules } = await getRulesAction();
  
  const emailAccounts = await db.emailAccount.findMany({
    where: { userId: session.user.id },
    select: { id: true, emailAddress: true }
  });
  
  return (
    <RulesClient initialRules={rules || []} emailAccounts={emailAccounts} />
  );
}
