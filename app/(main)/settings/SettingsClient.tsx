"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { logoutAllDevicesAction, updateProfileAction, updatePasswordAction } from "@/server/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { User, Shield, Key, Loader2, CheckCircle2, AlertCircle, User as UserIcon } from "lucide-react";

export default function SettingsClient({ 
  sessions, 
  currentSessionId,
  user,
  hasPassword,
  hasGoogleLinked
}: { 
  sessions: any[];
  currentSessionId: string | null;
  user: any;
  hasPassword: boolean;
  hasGoogleLinked: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  
  const router = useRouter();

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess(false);
    const formData = new FormData(e.currentTarget);
    const res = await updateProfileAction(formData);
    setProfileLoading(false);
    if (res.success) {
      setProfileSuccess(true);
      router.refresh();
      setTimeout(() => setProfileSuccess(false), 3000);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordSuccess(false);
    setPasswordError("");
    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = await updatePasswordAction(formData);
    setPasswordLoading(false);
    if (res.success) {
      setPasswordSuccess(true);
      form.reset();
      setTimeout(() => setPasswordSuccess(false), 3000);
    } else {
      setPasswordError(res.error || "An error occurred");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-auto p-6 lg:p-10 z-10 relative">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and security.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar Navigation */}
          <nav className="w-full md:w-48 shrink-0 flex flex-col gap-1">
            <button 
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
            >
              <User className="w-4 h-4" /> Profile
            </button>
            <button 
              onClick={() => setActiveTab("security")}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
            >
              <Shield className="w-4 h-4" /> Security
            </button>
          </nav>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            
            {activeTab === "profile" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="rounded-xl border bg-card/90 backdrop-blur text-card-foreground shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-border">
                    <h3 className="text-lg font-semibold">Public Profile</h3>
                    <p className="text-sm text-muted-foreground">This is how others will see you on the platform.</p>
                  </div>
                  <form onSubmit={handleProfileSubmit} className="p-6 space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p className="mb-2">Avatar synced automatically for now.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Display Name</label>
                      <input name="name" type="text" className="w-full max-w-md bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" defaultValue={user?.name || ""} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email Address</label>
                      <input type="email" disabled className="w-full max-w-md bg-secondary/30 border border-border rounded-md px-3 py-2 text-sm text-muted-foreground cursor-not-allowed" defaultValue={user?.email || ""} />
                      <p className="text-xs text-muted-foreground">Your primary email cannot be changed here.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button type="submit" disabled={profileLoading}>
                        {profileLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                      </Button>
                      {profileSuccess && (
                        <span className="text-sm text-green-500 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Profile updated successfully.
                        </span>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                {/* Active Sessions */}
                <div className="rounded-xl border bg-card/90 backdrop-blur text-card-foreground shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-border">
                    <h3 className="text-lg font-semibold">Active Sessions</h3>
                    <p className="text-sm text-muted-foreground">Manage and revoke your active devices.</p>
                  </div>
                  <ul className="divide-y divide-border">
                    {sessions.map((session) => (
                      <li key={session.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {session.os || "Unknown OS"} - {session.browser || "Unknown Browser"} 
                            {session.id === currentSessionId && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Current Device</span>}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {session.ipAddress || "Unknown IP"} • Expires {new Date(session.expires).toLocaleDateString()}
                          </p>
                        </div>
                        {session.id !== currentSessionId && (
                          <Button variant="outline" size="sm" disabled>Revoke (Dev)</Button>
                        )}
                      </li>
                    ))}
                    {sessions.length === 0 && (
                      <li className="p-6 text-sm text-muted-foreground text-center">No active sessions found.</li>
                    )}
                  </ul>
                  {sessions.length > 1 && (
                    <div className="p-6 border-t border-border bg-secondary/30 flex justify-end">
                      <form action={logoutAllDevicesAction}>
                        <Button variant="destructive" size="sm">Revoke all other devices</Button>
                      </form>
                    </div>
                  )}
                </div>

                {/* Password Management */}
                <div className="rounded-xl border bg-card/90 backdrop-blur text-card-foreground shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-border">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><Key className="w-4 h-4" /> Password</h3>
                  </div>
                  <div className="p-6">
                    {!hasPassword ? (
                      <div>
                        <p className="text-sm text-muted-foreground mb-4">You are currently logged in via an OAuth provider, so password management is handled by your provider.</p>
                        <Button variant="outline" disabled>Change Password</Button>
                      </div>
                    ) : (
                      <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Current Password</label>
                          <input name="currentPassword" type="password" required className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">New Password</label>
                          <input name="newPassword" type="password" required className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" minLength={8} />
                        </div>
                        
                        {passwordError && (
                          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2 text-sm text-destructive">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <p>{passwordError}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 pt-2">
                          <Button type="submit" disabled={passwordLoading}>
                            {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Change Password
                          </Button>
                          {passwordSuccess && (
                            <span className="text-sm text-green-500 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Password updated!
                            </span>
                          )}
                        </div>
                      </form>
                    )}
                  </div>
                </div>

                {/* Connected Accounts */}
                <div className="rounded-xl border bg-card/90 backdrop-blur text-card-foreground shadow-sm overflow-hidden mt-6">
                  <div className="p-6 border-b border-border">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><UserIcon className="w-4 h-4" /> Connected Accounts</h3>
                    <p className="text-sm text-muted-foreground mt-1">Link third-party accounts to sign in seamlessly.</p>
                  </div>
                  <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      <div>
                        <p className="font-medium">Google Account</p>
                        <p className="text-sm text-muted-foreground">
                          {hasGoogleLinked ? "Linked for secure single sign-on" : "Not linked"}
                        </p>
                      </div>
                    </div>
                    <div>
                      {hasGoogleLinked ? (
                        <span className="text-sm text-green-500 font-medium flex items-center gap-1 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                          <CheckCircle2 className="w-4 h-4" /> Connected
                        </span>
                      ) : (
                        <Button variant="outline" onClick={() => signIn("google", { callbackUrl: "/settings" })}>
                          Link Google Account
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
