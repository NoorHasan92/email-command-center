import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { auth } from "@/config/auth";
import { db } from "@/server/repositories/db";
import { redirect } from "next/navigation";
import { PageTransition } from "@/components/layout/page-transition";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Route Guard: Ensure at least one Gmail account is connected
  const emailAccountsCount = await db.emailAccount.count({
    where: { userId: session.user.id }
  });

  if (emailAccountsCount === 0) {
    redirect("/onboarding");
  }

  return (
    <div className="flex h-screen w-full bg-background relative overflow-hidden text-foreground p-4 gap-4">
      {/* Global Premium Ambient Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[500px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none z-0" />
      
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden z-10 relative bg-card rounded-[28px] shadow-2xl shadow-black/40 border border-white/5">
        <Header />
        <div className="h-6 shrink-0" />
        <main className="flex-1 overflow-auto bg-transparent px-8 pb-8 relative">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
