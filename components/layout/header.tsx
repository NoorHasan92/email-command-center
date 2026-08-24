"use client";

import { Bell, User, CheckCircle2, AlertCircle, Eye, ArrowRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ROUTES } from "@/config/routes";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useSession } from "next-auth/react";
import { UserAvatar } from "@/components/common/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMobileDrawer } from "@/providers/mobile-drawer-provider";

import { useState } from "react";

export function Header() {
  const pathname = usePathname();
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const { data: session } = useSession();
  const { toggle } = useMobileDrawer();
  
  let title = "Dashboard";
  if (pathname.includes("/inbox")) title = "Inbox";
  if (pathname.includes("/alerts")) title = "Alerts";
  if (pathname.includes("/settings")) title = "Settings";
  if (pathname.includes("/admin")) title = "Admin Panel";
  if (pathname.includes("/rules")) title = "Rules Builder";
  if (pathname.includes("/analytics")) title = "AI Insights";
  if (pathname.includes("/integrations")) title = "Integrations";

  return (
    <header className="sticky top-0 md:top-4 z-40 flex h-14 md:h-[60px] items-center gap-4 md:rounded-2xl border-b md:border border-white/5 bg-background/80 md:bg-background/40 px-4 backdrop-blur-md lg:px-6 md:mx-8 md:mt-4 shadow-sm shrink-0">
      <div className="flex flex-1 items-center gap-2 md:gap-4">
        <button
          onClick={toggle}
          className="md:hidden p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors focus:outline-none"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-lg md:text-xl font-bold tracking-tight capitalize truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="relative h-8 w-8 rounded-full border border-border/50 bg-muted/30 hover:bg-secondary transition-colors inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 group">
            <Bell className="h-4 w-4 text-muted-foreground transition-transform group-hover:rotate-12 group-hover:scale-110 duration-200 origin-top" />
            {hasUnreadNotifications && (
              <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
            )}
            <span className="sr-only">Toggle notifications</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-card border-border/50 shadow-lg rounded-xl">
            <DropdownMenuGroup className="flex items-center justify-between px-2 py-1.5">
              <DropdownMenuLabel className="font-semibold text-sm px-0">Recent Notifications</DropdownMenuLabel>
              {hasUnreadNotifications && (
                <button 
                  onClick={() => setHasUnreadNotifications(false)}
                  className="text-xs text-primary hover:text-primary/80 font-medium transition-colors focus:outline-none"
                >
                  Mark as read
                </button>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuGroup className="py-1">
              {hasUnreadNotifications ? (
                <>
                  <DropdownMenuItem className="gap-3 p-3 cursor-pointer items-start">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-sm leading-none">WhatsApp Sent</span>
                      <span className="text-xs text-muted-foreground leading-snug">Billing Pending alert delivered successfully.</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-3 p-3 cursor-pointer items-start">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-sm leading-none">Telegram Failed</span>
                      <span className="text-xs text-muted-foreground leading-snug">Could not reach API. Will retry in 5m.</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-3 p-3 cursor-pointer items-start">
                    <Eye className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-sm leading-none">Email Reviewed</span>
                      <span className="text-xs text-muted-foreground leading-snug">AI safely categorized 14 promotional emails.</span>
                    </div>
                  </DropdownMenuItem>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground/30 mb-3" />
                  <span className="font-medium text-sm text-foreground">You're all caught up!</span>
                  <span className="text-xs text-muted-foreground mt-1">No new notifications right now.</span>
                </div>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-border/50" />
            <Link href={ROUTES.alerts} className="w-full">
              <DropdownMenuItem className="w-full flex items-center justify-center p-2 text-xs font-medium text-primary hover:text-primary/80 cursor-pointer">
                View all alerts <ArrowRight className="h-3 w-3 ml-1" />
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle />
        
        <Link href={ROUTES.settings} className="rounded-full flex items-center justify-center transition-colors">
          <UserAvatar src={session?.user?.image} name={session?.user?.name} size="sm" />
        </Link>
      </div>
    </header>
  );
}
