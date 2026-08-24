"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { APP_CONFIG } from "@/config/app";
import { NAVIGATION } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { LogOut, User as UserIcon, CheckCircle2, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { signOut, useSession } from "next-auth/react";
import { UserAvatar } from "@/components/common/UserAvatar";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMobileDrawer } from "@/providers/mobile-drawer-provider";

export function Sidebar() {
  const pathname = usePathname();
  
  const [showLogout, setShowLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const { data: session } = useSession();
  const { isOpen, close } = useMobileDrawer();

  // Load state from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  const toggleSidebar = () => {
    const newValue = !isCollapsed;
    setIsCollapsed(newValue);
    localStorage.setItem("sidebar_collapsed", String(newValue));
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      <TooltipProvider delay={0}>
        <motion.aside
          initial={false}
          animate={{ width: isCollapsed ? 80 : 288 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "fixed md:relative inset-y-0 left-0 z-50 flex flex-col shrink-0 h-full md:rounded-[28px] bg-[#111113]/95 md:bg-[#111113]/80 backdrop-blur-xl border-r md:border border-white/5 shadow-2xl shadow-black/40 overflow-visible transition-transform duration-300 md:translate-x-0",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
        {/* Floating Collapse Button (Desktop Only) */}
        <button
          onClick={toggleSidebar}
          className="hidden md:flex absolute -right-3 top-8 w-6 h-6 rounded-full bg-border border border-border/50 items-center justify-center shadow-lg hover:scale-110 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all z-50 text-foreground cursor-pointer focus:outline-none"
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </motion.div>
        </button>

        <div className="flex h-[72px] items-center px-6 shrink-0 border-b border-border/30 overflow-hidden">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <motion.div layout>
              <Image src="/app-logo.png" alt="Inbox Sentinel Logo" width={32} height={32} className="rounded-md shrink-0" unoptimized />
            </motion.div>
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="text-primary tracking-tight font-bold text-lg whitespace-nowrap"
                >
                  {APP_CONFIG.name}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        <div className="flex-1 overflow-x-hidden overflow-y-auto py-6 styled-scroll">
          <nav className="flex flex-col px-3 space-y-2">
            {NAVIGATION.map((item) => {
              // Hide admin-only routes from regular users
              if (item.adminOnly && (session?.user as any)?.role !== "ADMIN") return null;
              const isActive = pathname.startsWith(item.href);
              const navLink = (
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 overflow-hidden",
                    isActive
                      ? "text-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                      : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground hover:scale-[1.02]"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-1/2 w-[3px] bg-primary rounded-r-full shadow-[0_0_10px_rgba(var(--primary),0.8)]"
                    />
                  )}
                  
                  <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                    <item.icon className="h-5 w-5 relative z-10 transition-transform group-hover:scale-110 duration-300" />
                  </div>
                  
                  <AnimatePresence mode="wait">
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="relative z-10 font-semibold text-sm whitespace-nowrap"
                      >
                        {item.title}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );

              return isCollapsed ? (
                <Tooltip key={item.id}>
                  <TooltipTrigger render={navLink} />
                  <TooltipContent side="right" sideOffset={20} className="font-semibold px-3 py-1.5 ml-2">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <div key={item.id}>{navLink}</div>
              );
            })}
          </nav>
        </div>
        
        {/* Footer / Profile Section */}
        <div className="p-4 border-t border-border/30 shrink-0 mt-auto bg-black/10 overflow-hidden">
          <div className="flex flex-col gap-4">
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
                        <span className="text-sm font-semibold truncate text-foreground">{session?.user?.name || "User"}</span>
                        <div className="flex items-center mt-0.5">
                          <span className="text-[10px] text-muted-foreground font-medium truncate">{session?.user?.email || "Connected"}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );

              return isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger render={profileContent} />
                  <TooltipContent side="right" sideOffset={20} className="flex flex-col gap-1 px-3 py-2 ml-2">
                    <span className="font-bold">{session?.user?.name || "User"}</span>
                    <span className="text-xs text-muted-foreground">{session?.user?.email}</span>
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
                  <div className="h-[1px] w-full bg-border/40 my-1" />
                  <div className="flex items-center justify-between px-2 text-xs font-semibold text-muted-foreground">
                    <span className="uppercase tracking-wider">Plan</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] tracking-wide uppercase",
                      (session?.user as any)?.plan === "ADMIN" ? "bg-indigo-500/20 text-indigo-400" :
                      (session?.user as any)?.plan === "ULTRA" ? "bg-purple-500/20 text-purple-400" :
                      (session?.user as any)?.plan === "PRO" ? "bg-blue-500/20 text-blue-400" :
                      "bg-primary/20 text-primary"
                    )}>
                      {(session?.user as any)?.plan || "FREE"}
                    </span>
                  </div>
                  <button 
                    onClick={() => setShowLogout(true)}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-destructive/20 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    Log out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Logout icon button when collapsed */}
            <AnimatePresence mode="wait">
              {isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex justify-center"
                >
                  <Tooltip>
                    <TooltipTrigger render={
                      <button 
                        onClick={() => setShowLogout(true)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:scale-105 transition-all duration-200 cursor-pointer focus:outline-none"
                      >
                        <LogOut className="h-4 w-4 shrink-0" />
                      </button>
                    } />
                    <TooltipContent side="right" sideOffset={20} className="font-semibold px-3 py-1.5 ml-2">
                      Log out
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <ConfirmModal 
          isOpen={showLogout}
          onClose={() => setShowLogout(false)}
          onConfirm={handleLogout}
          title="Log out of Inbox Sentinel"
          description="Are you sure you want to log out? You will need to sign in again to access your dashboard and active alerts."
          confirmText="Log out"
          cancelText="Cancel"
          isDestructive={true}
          loading={loggingOut}
        />
        </motion.aside>
      </TooltipProvider>
    </>
  );
}
