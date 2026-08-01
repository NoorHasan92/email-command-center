// app/settings/page.tsx
// Renders the security settings and active sessions dashboard.

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { getActiveSessions, logoutAllDevicesAction } from "@/server/actions/auth.actions";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  const { sessions, currentSessionId } = await getActiveSessions();

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <Sidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64 w-full">
        <Header />
        <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">
          <div className="mx-auto grid w-full max-w-6xl gap-2">
            <h1 className="text-3xl font-semibold">Security Settings</h1>
          </div>
          <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr] mt-6">
            <nav className="grid gap-4 text-sm text-muted-foreground">
              <a href="#" className="font-semibold text-primary">Security</a>
              <a href="#">Profile</a>
            </nav>
            <div className="grid gap-6">
              
              <div className="rounded-xl border bg-card text-card-foreground shadow">
                <div className="flex flex-col space-y-1.5 p-6 border-b">
                  <h3 className="font-semibold leading-none tracking-tight">Active Sessions</h3>
                  <p className="text-sm text-muted-foreground">Manage and revoke your active devices.</p>
                </div>
                <div className="p-0">
                  <ul className="divide-y">
                    {sessions.map((session) => (
                      <li key={session.id} className="p-6 flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {session.os} - {session.browser} 
                            {session.id === currentSessionId && <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Current Device</span>}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {session.ipAddress} • Expires {session.expires.toLocaleDateString()}
                          </p>
                        </div>
                        {session.id !== currentSessionId && (
                          <form>
                             {/* In a real app, this would be a specific revoke action */}
                            <Button variant="outline" size="sm">Revoke</Button>
                          </form>
                        )}
                      </li>
                    ))}
                    {sessions.length === 0 && (
                      <li className="p-6 text-sm text-muted-foreground">No active sessions found.</li>
                    )}
                  </ul>
                </div>
                {sessions.length > 1 && (
                  <div className="p-6 border-t bg-muted/50 rounded-b-xl">
                    <form action={logoutAllDevicesAction}>
                      <Button variant="destructive">Logout All Other Devices</Button>
                    </form>
                  </div>
                )}
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
