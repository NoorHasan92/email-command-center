"use client";

import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ROUTES } from "@/config/routes";

export function Header() {
  const pathname = usePathname();
  
  let title = "Dashboard";
  if (pathname.includes("/inbox")) title = "Inbox";
  if (pathname.includes("/alerts")) title = "Alerts";
  if (pathname.includes("/settings")) title = "Settings";
  if (pathname.includes("/admin")) title = "Admin Panel";

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:h-[60px] lg:px-6">
      <div className="flex flex-1 items-center gap-4">
        <h1 className="text-lg font-semibold md:text-xl capitalize">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <Link 
          href={ROUTES.alerts}
          className={`relative flex items-center justify-center rounded-lg hover:bg-muted transition-colors w-8 h-8`}
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-primary" />
          <span className="sr-only">Toggle notifications</span>
        </Link>
        <Link href={ROUTES.settings} className="h-8 w-8 rounded-full bg-muted border flex items-center justify-center hover:bg-secondary transition-colors">
          <User className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>
    </header>
  );
}
