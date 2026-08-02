import { auth } from "@/config/auth";
import { db } from "@/server/repositories/db";
import { redirect } from "next/navigation";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  // If the user already has an email account, redirect to dashboard
  const emailAccountsCount = await db.emailAccount.count({
    where: { userId: session.user.id }
  });

  if (emailAccountsCount > 0) {
    redirect("/dashboard");
  }

  return <OnboardingClient userName={session.user.name || "there"} />;
}
