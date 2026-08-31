"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LogOut, ShieldAlert, Activity, Users, Settings, CreditCard, 
  Mail, Plug, Lock, Server, BarChart, ChevronLeft,
  Trash2, Database
} from "lucide-react";
import { useState, useEffect } from "react";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { signOut, useSession } from "next-auth/react";
import { UserAvatar } from "@/components/common/UserAvatar";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const ADMIN_NAVIGATION = [
  { section: "Overview", items: [
    { id: "command-center", title: "Command Center", href: "/admin", icon: ShieldAlert },
  ]},
  { section: "Operations", items: [
    { id: "ai-ops", title: "AI Operations", href: "/admin/ai-operations", icon: Server },
    { id: "activity", title: "Activity & Events", href: "/admin/activity", icon: Activity },
  ]},
  { section: "Management", items: [
    { id: "users", title: "Users", href: "/admin/users", icon: Users },
    { id: "deletions", title: "Account Deletions", href: "/admin/account-deletions", icon: Trash2 },
  ]},
  { section: "Business", items: [
    { id: "payments", title: "Payments & Orders", href: "/admin/payments", icon: CreditCard },
    { id: "revenue", title: "Revenue Analytics", href: "/admin/revenue", icon: BarChart },
  ]},
  { section: "Communication", items: [
    { id: "emails", title: "Transactional Emails", href: "/admin/emails", icon: Mail },
  ]},
  { section: "Integrations", items: [
    { id: "integrations", title: "System Integrations", href: "/admin/integrations", icon: Plug },
  ]},
  { section: "Security", items: [
    { id: "security", title: "Security Center", href: "/admin/security", icon: Lock },
    { id: "audit", title: "Audit Logs", href: "/admin/audit-logs", icon: Database },
  ]},
  { section: "System", items: [
    { id: "jobs", title: "Jobs & Cron", href: "/admin/jobs", icon: Settings },
    { id: "config", title: "Configuration", href: "/admin/configuration", icon: Settings },
  ]}
];

export function AdminSidebar() {
  const pathname = usePathname();
  
  const [showLogout, setShowLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const { data: session } = useSession();

  useEffect(() => {
    const saved = localStorage.getItem("admin_sidebar_collapsed");
    if (saved) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  const toggleSidebar = () => {
    const newValue = !isCollapsed;
    setIsCollapsed(newValue);
    localStorage.setItem("admin_sidebar_collapsed", String(newValue));
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <TooltipProvider delay={0}>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 288 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "hidden md:flex relative z-50 flex-col shrink-0 h-full bg-[#0a0a0a] border-r border-border/10 shadow-2xl overflow-visible transition-transform duration-300 text-slate-200"
        )}
      >
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-8 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center shadow-lg hover:scale-110 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all z-50 text-slate-200 cursor-pointer focus:outline-none"
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </motion.div>
        </button>

        <div className="flex h-[72px] items-center px-6 shrink-0 border-b border-border/10 overflow-hidden bg-black/20">
          <Link href="/admin" className="flex items-center gap-3 font-semibold">
            <motion.div layout>
              <Image src="/app-logo.png" alt="Inbox Sentinel Logo" width={32} height={32} className="rounded-md shrink-0" unoptimized />
            </motion.div>
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col whitespace-nowrap"
                >
                  <span className="text-white tracking-tight font-bold text-sm leading-tight">INBOX SENTINEL</span>
                  <span className="text-indigo-400 font-black text-xs uppercase tracking-widest leading-tight">Admin Console</span>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        </div>

        <div className="flex-1 overflow-x-hidden overflow-y-auto py-6 styled-scroll">
          <nav className="flex flex-col px-3 space-y-6">
            {ADMIN_NAVIGATION.map((group, groupIdx) => (
              <div key={groupIdx} className="flex flex-col space-y-1.5">
                {!isCollapsed && (
                  <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                    {group.section}
                  </h3>
                )}
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/admin");
                  const navLink = (
                    <Link
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2 transition-all duration-200 overflow-hidden",
                        isActive
                          ? "text-white bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)] border border-indigo-500/30"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="admin-active-pill"
                          className="absolute left-0 top-1/2 -translate-y-1/2 h-1/2 w-[3px] bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"
                        />
                      )}
                      
                      <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                        <item.icon className={cn("h-4 w-4 relative z-10 transition-transform group-hover:scale-110 duration-300", isActive ? "text-indigo-400" : "")} />
                      </div>
                      
                      <AnimatePresence mode="wait">
                        {!isCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="relative z-10 font-medium text-sm whitespace-nowrap"
                          >
                            {item.title}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Link>
                  );

                  return isCollapsed ? (
                    <Tooltip key={item.id}>
                      <TooltipTrigger render={<div />}>
                        {navLink}
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={20} className="font-semibold px-3 py-1.5 ml-2 bg-[#111] text-white border-border/10">
                        {item.title}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <div key={item.id}>{navLink}</div>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>
        
        {/* Footer / Profile Section */}
        <div className="p-4 border-t border-border/10 shrink-0 mt-auto bg-black/40 overflow-hidden">
          <div className="flex flex-col gap-4">
            
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col gap-2 mb-2"
                >
                  <Link 
                    href="/dashboard" 
                    className="flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 bg-white/5 hover:bg-white/10 transition-all duration-200"
                  >
                    <ChevronLeft className="w-4 h-4 shrink-0" />
                    Back to Application
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {(() => {
              const profileContent = (
                <div className="flex items-center gap-3 px-1">
                  <UserAvatar src={session?.user?.image} name={session?.user?.name} size="md" disableAnimation />
                  <AnimatePresence mode="wait">
                    {!isCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col min-w-0"
                      >
                        <span className="text-sm font-semibold truncate text-white">{session?.user?.name || "Admin"}</span>
                        <div className="flex items-center mt-0.5">
                          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Superadmin</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );

              return isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger render={<div />}>
                    {profileContent}
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={20} className="flex flex-col gap-1 px-3 py-2 ml-2 bg-[#111] text-white border-border/10">
                    <span className="font-bold">{session?.user?.name || "User"}</span>
                    <span className="text-xs text-slate-400">Superadmin</span>
                  </TooltipContent>
                </Tooltip>
              ) : profileContent;
            })()}
            
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col gap-2"
                >
                  <button 
                    onClick={() => setShowLogout(true)}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    Secure Log Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {isCollapsed && (
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex justify-center flex-col gap-2"
                >
                  <Tooltip>
                    <TooltipTrigger render={<div />}>
                      <Link 
                        href="/dashboard"
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 transition-all duration-200 cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4 shrink-0" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={20} className="font-semibold px-3 py-1.5 ml-2 bg-[#111] text-white border-border/10">
                      Back to Application
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger render={<div />}>
                      <button 
                        onClick={() => setShowLogout(true)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 cursor-pointer focus:outline-none"
                      >
                        <LogOut className="h-4 w-4 shrink-0" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={20} className="font-semibold px-3 py-1.5 ml-2 bg-[#111] text-white border-border/10">
                      Log out
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>

        <ConfirmModal 
          isOpen={showLogout}
          onClose={() => setShowLogout(false)}
          onConfirm={handleLogout}
          title="Secure Log Out"
          description="Are you sure you want to log out of the administration console? You will need to sign in again to access both the admin console and the regular dashboard."
          confirmText="Log out"
          cancelText="Cancel"
          isDestructive={true}
          loading={loggingOut}
        />
      </motion.aside>
    </TooltipProvider>
  );
}
