"use client";

import { usePathname } from "next/navigation";
import { UserAvatar } from "@/components/common/UserAvatar";
import { useSession } from "next-auth/react";

export function AdminHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Basic breadcrumb generation based on pathname
  const paths = pathname.split("/").filter(Boolean);
  
  return (
    <header className="h-[72px] shrink-0 border-b border-border/10 bg-black/20 backdrop-blur-xl flex items-center justify-between px-6 z-40 relative">
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
            <span>Admin</span>
            {paths.slice(1).map((path, idx) => (
              <span key={idx} className="flex items-center gap-2">
                <span className="text-slate-600">/</span>
                <span className={idx === paths.length - 2 ? "text-slate-200 capitalize" : "capitalize"}>
                  {path.replace(/-/g, " ")}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* We can add global admin search or notifications here in the future */}
        <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          <div className="flex flex-col text-right">
            <span className="text-sm font-semibold text-white leading-tight">{session?.user?.name || "Admin"}</span>
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider leading-tight">Superadmin</span>
          </div>
          <UserAvatar src={session?.user?.image} name={session?.user?.name} size="sm" />
        </div>
      </div>
    </header>
  );
}
