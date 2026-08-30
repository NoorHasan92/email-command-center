import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { auth } from "@/config/auth";
import { db } from "@/server/repositories/db";
import { redirect } from "next/navigation";
import { PageTransition } from "@/components/layout/page-transition";
import { MobileDrawerProvider } from "@/providers/mobile-drawer-provider";

import { cookies } from "next/headers";

import { GlobalLoaderProvider } from "@/providers/global-loader-provider";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch all email accounts for the global switcher
  const emailAccounts = await db.emailAccount.findMany({
    where: { userId: session.user.id },
    select: { id: true, emailAddress: true, provider: true }
  });

  if (emailAccounts.length === 0) {
    redirect("/onboarding");
  }

  const cookieStore = await cookies();
  const selectedAccountId = cookieStore.get("selected_account_id")?.value || "all";

  return (
    <div className="flex h-screen w-full bg-background relative overflow-hidden text-foreground md:p-4 md:gap-4">
      {/* Global Premium Ambient Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[500px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none z-0" />
      
      <MobileDrawerProvider>
        <GlobalLoaderProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col h-full overflow-hidden z-10 relative bg-background md:bg-card md:rounded-[28px] md:shadow-2xl md:shadow-black/10 dark:md:shadow-black/40 md:border md:border-border/50">
            <Header emailAccounts={emailAccounts} selectedAccountId={selectedAccountId} />
            <div className="hidden md:block h-6 shrink-0" />
            <main className="flex-1 overflow-auto bg-transparent px-4 pb-20 md:px-8 md:pb-8 relative">
              <PageTransition>
                {children}
              </PageTransition>
            </main>
          </div>
        </GlobalLoaderProvider>
      </MobileDrawerProvider>
    </div>
  );
}
