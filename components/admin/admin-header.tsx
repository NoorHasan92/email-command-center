"use client";

import { usePathname } from "next/navigation";
import { UserAvatar } from "@/components/common/UserAvatar";
import { useSession } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { ADMIN_NAVIGATION } from "./admin-sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function AdminHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Basic breadcrumb generation based on pathname
  const paths = pathname.split("/").filter(Boolean);
  
  return (
    <header className="h-[72px] shrink-0 border-b border-border/10 bg-black/20 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 z-40 relative">
      <div className="flex items-center gap-3 md:gap-4">
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden p-2 -ml-2 text-slate-300 hover:text-white"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 md:gap-2 text-sm text-slate-400 font-medium">
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

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-0 top-0 left-0 w-full h-[100dvh] z-[100] bg-[#0a0a0a] flex flex-col md:hidden text-slate-200"
          >
            <div className="h-[72px] shrink-0 flex items-center justify-between px-4 border-b border-border/10 bg-black/20">
              <span className="font-bold text-white tracking-tight">INBOX SENTINEL</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 -mr-2 text-slate-300 hover:text-white bg-white/5 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-24">
              {ADMIN_NAVIGATION.map((group, idx) => (
                <div key={idx} className="flex flex-col space-y-2">
                  <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                    {group.section}
                  </h3>
                  {group.items.map(item => {
                    const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/admin");
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-3 font-medium transition-all",
                          isActive ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "text-slate-300 active:bg-white/5 hover:text-white"
                        )}
                      >
                        <item.icon className="w-5 h-5 shrink-0" />
                        {item.title}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
            
            <div className="shrink-0 p-4 border-t border-border/10 bg-black/40">
               <Link 
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 bg-white/5 hover:bg-white/10"
                >
                  Back to Application
                </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
