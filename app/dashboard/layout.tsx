import { ReactNode } from "react";
import Link from "next/link";
import { Inbox, LayoutDashboard, Settings, Activity, Filter } from "lucide-react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-border bg-card/50 backdrop-blur-xl flex flex-col transition-all duration-300">
        <div className="h-14 flex items-center px-4 border-b border-border">
          <div className="w-6 h-6 bg-primary rounded-md mr-3 flex items-center justify-center shadow-lg shadow-primary/20">
            <Inbox className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight text-sm text-foreground">Inbox Sentinel</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <p className="px-2 text-xs font-medium text-muted-foreground mb-2 mt-4 uppercase tracking-wider">Views</p>
          <NavItem href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Overview" active />
          <NavItem href="/dashboard/inbox" icon={<Inbox className="w-4 h-4" />} label="Inbox" />
          <NavItem href="/dashboard/rules" icon={<Filter className="w-4 h-4" />} label="Rules" />
          <NavItem href="/dashboard/analytics" icon={<Activity className="w-4 h-4" />} label="Analytics" />
          
          <div className="mt-8">
            <p className="px-2 text-xs font-medium text-muted-foreground mb-2 mt-4 uppercase tracking-wider">Labels</p>
            <div className="space-y-1">
              <LabelItem color="bg-red-500" label="Action Required" />
              <LabelItem color="bg-orange-500" label="High Priority" />
              <LabelItem color="bg-blue-500" label="Updates" />
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-border mt-auto">
          <NavItem href="/settings" icon={<Settings className="w-4 h-4" />} label="Settings" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}

function NavItem({ href, icon, label, active }: { href: string; icon: ReactNode; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active 
          ? "bg-secondary text-foreground" 
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

function LabelItem({ color, label }: { color: string; label: string }) {
  return (
    <button className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span>{label}</span>
    </button>
  );
}
