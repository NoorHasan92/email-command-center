import { redirect } from "next/navigation";
import { auth } from "@/config/auth";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Admin Dashboard - Inbox Sentinel",
  description: "Administrative tools and AI Evaluation",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // @ts-expect-error - role is extended but not in next-auth DefaultUser type yet
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
