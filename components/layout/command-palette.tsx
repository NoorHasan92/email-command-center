"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, LayoutDashboard, Mail, Bell, Settings, Filter, BarChart, User, LogOut } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-all" onClick={() => setOpen(false)}>
      <div className="fixed left-[50%] top-[20%] z-50 w-full max-w-lg translate-x-[-50%] shadow-2xl">
        <Command
          onClick={(e) => e.stopPropagation()}
          className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-popover border border-border text-popover-foreground shadow-[0_0_40px_rgba(0,0,0,0.1)]"
        >
          <div className="flex items-center border-b border-border px-4 py-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input
              autoFocus
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Type a command or search..."
            />
            <div className="ml-2 flex items-center gap-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ESC
              </kbd>
            </div>
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>
            
            <Command.Group heading="Navigation" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              <CommandItem onSelect={() => runCommand(() => router.push(ROUTES.dashboard))} icon={<LayoutDashboard />}>
                Dashboard
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push(ROUTES.inbox))} icon={<Mail />}>
                Inbox
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/integrations"))} icon={<Filter />}>
                Integrations
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/rules"))} icon={<Filter />}>
                Rules Builder
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/analytics"))} icon={<BarChart />}>
                Analytics
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push(ROUTES.alerts))} icon={<Bell />}>
                Alerts
              </CommandItem>
            </Command.Group>
            
            <Command.Group heading="Settings" className="px-2 py-1.5 text-xs font-medium text-muted-foreground mt-2">
              <CommandItem onSelect={() => runCommand(() => router.push(ROUTES.settings))} icon={<User />}>
                Profile & Security
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => window.location.href = "/api/auth/signout")} icon={<LogOut />}>
                Log out
              </CommandItem>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

function CommandItem({ children, onSelect, icon }: { children: React.ReactNode, onSelect: () => void, icon?: React.ReactNode }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none transition-colors",
        "data-[selected=true]:bg-secondary data-[selected=true]:text-secondary-foreground"
      )}
    >
      <div className="mr-2 flex h-4 w-4 items-center justify-center text-muted-foreground">
        {icon}
      </div>
      {children}
    </Command.Item>
  );
}
