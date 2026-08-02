"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { APP_CONFIG } from "@/config/app";
import { NAVIGATION } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { signOut } from "next-auth/react";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [showLogout, setShowLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 shrink-0">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="text-primary">{APP_CONFIG.name}</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 space-y-1">
          {NAVIGATION.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* Footer / Logout */}
      <div className="p-4 border-t border-border shrink-0 mt-auto">
        <button 
          onClick={() => setShowLogout(true)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
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
    </aside>
  );
}
