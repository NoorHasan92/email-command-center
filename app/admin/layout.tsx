import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { auth } from "@/config/auth";
import { redirect } from "next/navigation";
import { PageTransition } from "@/components/layout/page-transition";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  // @ts-expect-error - Custom role not in default NextAuth types
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen w-full bg-[#030303] relative overflow-hidden text-slate-200">
      {/* Admin specific background ambient effects */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[500px] bg-purple-500/5 blur-[100px] rounded-full pointer-events-none z-0" />
      
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden z-10 relative bg-transparent">
        <AdminHeader />
        <main className="flex-1 overflow-auto bg-transparent px-4 py-6 md:px-8 relative styled-scroll">
          <PageTransition>
            <div className="max-w-[1600px] mx-auto w-full h-full pb-20">
              {children}
            </div>
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
