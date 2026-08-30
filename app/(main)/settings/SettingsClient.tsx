"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { logoutAllDevicesAction, updateProfileAction, updatePasswordAction } from "@/server/actions/auth.actions";
import { updateAppPreferencesAction } from "@/server/actions/preferences.actions";
import { Button } from "@/components/ui/button";
import { User, Shield, Key, Loader2, CheckCircle2, AlertCircle, User as UserIcon, Monitor, Bell, Mail, Globe, Laptop, Sun, Moon, Sliders } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UserAvatar } from "@/components/common/UserAvatar";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import Image from "next/image";

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
  const [activeTab, setActiveTab] = useState<"profile" | "preferences" | "security" | "appearance" | "notifications">("profile");
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await updateProfileAction(formData);
    setProfileLoading(false);
    if (res.success) {
      toast.success("Profile updated successfully", {
        description: "Your display name has been saved.",
      });
      router.refresh();
    } else {
      toast.error("Failed to update profile", {
        description: res.error || "An error occurred",
      });
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError("");
    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = await updatePasswordAction(formData);
    setPasswordLoading(false);
    if (res.success) {
      toast.success("Password updated", {
        description: "Your security credentials have been changed.",
      });
      form.reset();
    } else {
      setPasswordError(res.error || "An error occurred");
    }
  };

  // UI Components
  const TABS = [
    { id: "profile", label: "Profile", icon: User },
    { id: "preferences", label: "App Settings", icon: Sliders },
    { id: "security", label: "Security", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Monitor },
    { id: "notifications", label: "Notifications", icon: Bell },
  ] as const;

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-10 z-10 relative styled-scroll">
      <div className="max-w-[1000px] mx-auto w-full space-y-6 md:space-y-8 pb-24">
        
        {/* Premium Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/50 pb-6"
        >
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-2">Welcome back, {user?.name || "User"}</h1>
            <p className="text-muted-foreground text-sm max-w-lg leading-relaxed">
              Manage your account, workspace preferences, security, and AI experience.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-secondary/30 px-3 py-1.5 rounded-full border border-border/50 backdrop-blur-sm shrink-0">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground">Connected: <span className="text-foreground">{user?.email}</span></span>
          </div>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Better Sidebar Navigation */}
          <nav className="w-full md:w-56 shrink-0 flex flex-row overflow-x-auto md:flex-col gap-2 pb-2 md:pb-0 no-scrollbar">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`group relative flex items-center gap-2 md:gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 overflow-hidden shrink-0 ${
                    isActive ? 'text-primary' : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="settings-tab-active"
                      className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <tab.icon className={`w-4 h-4 relative z-10 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} /> 
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                
                {/* PROFILE TAB */}
                {activeTab === "profile" && (
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left: Profile Form */}
                    <div className="flex-1 space-y-6">
                      <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur text-card-foreground shadow-xl overflow-hidden hover:shadow-2xl hover:border-border transition-all duration-300">
                        <div className="p-6 border-b border-border/50 bg-secondary/10">
                          <h3 className="text-lg font-bold">Profile Information</h3>
                          <p className="text-sm text-muted-foreground mt-1">Manage your public identity and primary email.</p>
                        </div>
                        <div className="p-6">
                          {/* Premium Profile Card / Avatar */}
                          <div className="flex items-center gap-6 mb-8">
                            <UserAvatar src={user?.image} name={user?.name} size="xl" />
                            <div className="flex flex-col justify-center">
                              <h4 className="text-xl font-bold tracking-tight">{user?.name}</h4>
                              <p className="text-sm text-muted-foreground mb-2">{user?.email}</p>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                                  user?.plan === "ADMIN" ? "bg-indigo-500/20 text-indigo-400" :
                                  user?.plan === "ULTRA" ? "bg-purple-500/20 text-purple-400" :
                                  user?.plan === "PRO" ? "bg-blue-500/20 text-blue-400" :
                                  "bg-primary/20 text-primary"
                                }`}>
                                  {user?.plan || "FREE"} PLAN
                                </span>
                                {hasGoogleLinked && (
                                  <span className="text-[10px] uppercase tracking-wider font-bold bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Google Linked
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <form onSubmit={handleProfileSubmit} className="space-y-5">
                            <div className="space-y-2 relative">
                              <label className="text-sm font-semibold text-foreground">Display Name</label>
                              <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input 
                                  name="name" 
                                  type="text" 
                                  className="w-full bg-secondary/30 border border-border/50 hover:border-border rounded-xl pl-10 pr-4 h-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200" 
                                  defaultValue={user?.name || ""} 
                                  required 
                                />
                              </div>
                            </div>
                            <div className="space-y-2 relative">
                              <label className="text-sm font-semibold text-foreground">Email Address</label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input 
                                  type="email" 
                                  disabled 
                                  className="w-full bg-secondary/10 border border-border/30 rounded-xl pl-10 pr-4 h-12 text-sm text-muted-foreground cursor-not-allowed" 
                                  defaultValue={user?.email || ""} 
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1.5">
                                Your primary email and profile picture are securely synced from your connected authentication provider.
                              </p>
                            </div>
                            <div className="pt-4">
                              <Button 
                                type="submit" 
                                disabled={profileLoading}
                                className="h-11 rounded-xl px-6 font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-95 active:translate-y-0"
                              >
                                {profileLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Save Changes
                              </Button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>

                    {/* Right: Account Summary */}
                    <div className="w-full lg:w-72 shrink-0 space-y-6">
                      <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur text-card-foreground shadow-xl overflow-hidden hover:shadow-2xl hover:border-border transition-all duration-300">
                        <div className="p-5 border-b border-border/50 bg-secondary/10">
                          <h3 className="text-base font-bold flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> Workspace</h3>
                        </div>
                        <div className="p-5 space-y-4">
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Current Workspace</p>
                            <p className="text-sm font-medium">Inbox Sentinel</p>
                          </div>
                          <div className="w-full h-px bg-border/50" />
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Plan</p>
                            <p className="text-sm font-medium flex items-center gap-2 capitalize">
                              {(user?.plan || "FREE").toLowerCase()} <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                            </p>
                          </div>
                          <div className="w-full h-px bg-border/50" />
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Emails Processed</p>
                            <p className="text-sm font-medium text-muted-foreground italic">— Will appear after analysis</p>
                          </div>
                          <div className="w-full h-px bg-border/50" />
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">AI Accuracy</p>
                            <p className="text-sm font-medium text-muted-foreground italic">— Not available yet</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur text-card-foreground shadow-xl overflow-hidden hover:shadow-2xl hover:border-border transition-all duration-300">
                        <div className="p-5 border-b border-border/50 bg-secondary/10">
                          <h3 className="text-base font-bold flex items-center gap-2"><Monitor className="w-4 h-4 text-primary" /> Connected Services</h3>
                        </div>
                        <div className="p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              <span className="text-sm font-medium">Gmail</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              <span className="text-sm font-medium">Telegram</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              <span className="text-sm font-medium">WhatsApp</span>
                            </div>
                          </div>
                          <div className="pt-2 mt-2 border-t border-border/50">
                            <p className="text-[10px] text-muted-foreground text-center uppercase tracking-wider font-semibold">Last Sync: 15 minutes ago</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* APP SETTINGS (PREFERENCES) TAB */}
                {activeTab === "preferences" && (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur text-card-foreground shadow-xl overflow-hidden hover:shadow-2xl hover:border-border transition-all duration-300">
                      <div className="p-6 border-b border-border/50 bg-secondary/10">
                        <h3 className="text-lg font-bold flex items-center gap-2"><Sliders className="w-5 h-5 text-primary" /> App Settings</h3>
                        <p className="text-sm text-muted-foreground mt-1">Configure your AI automations and workflow preferences.</p>
                      </div>
                      
                      <div className="p-6 space-y-8">
                        {/* Calendar Automation */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/50 bg-secondary/10 hover:bg-secondary/20 transition-colors">
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-foreground">Calendar Automation</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              Allow AI to automatically schedule detected meetings, deadlines, and events into your Google Calendar.
                            </p>
                            <div className="flex items-center gap-2 mt-3">
                              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500 text-[10px] font-bold uppercase tracking-wider">Pro Feature</span>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center bg-black/20 rounded-xl p-1 border border-border/30">
                            <button
                              disabled={user?.plan === "FREE"}
                              onClick={async () => {
                                const newMode = (user?.appPreferences as any)?.calendarAutomation === "AUTO" ? "ASK" : "AUTO";
                                await updateAppPreferencesAction({ calendarAutomation: newMode });
                                toast.success(`Calendar automation set to ${newMode === "AUTO" ? "Automatic" : "Ask Permission"}`);
                              }}
                              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                                (user?.appPreferences as any)?.calendarAutomation === "AUTO" 
                                  ? "bg-primary text-primary-foreground shadow-md" 
                                  : "text-muted-foreground hover:text-foreground"
                              } ${user?.plan === "FREE" ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              Auto-Manage
                            </button>
                            <button
                              disabled={user?.plan === "FREE"}
                              onClick={async () => {
                                await updateAppPreferencesAction({ calendarAutomation: "ASK" });
                                toast.success("Calendar automation set to Ask Permission");
                              }}
                              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                                (user?.appPreferences as any)?.calendarAutomation !== "AUTO" 
                                  ? "bg-primary text-primary-foreground shadow-md" 
                                  : "text-muted-foreground hover:text-foreground"
                              } ${user?.plan === "FREE" ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              Ask First
                            </button>
                          </div>
                        </div>

                        {/* Smart Drafts */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/50 bg-secondary/10 hover:bg-secondary/20 transition-colors">
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-foreground">Smart Drafts</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              Automatically generate intelligent reply drafts for actionable emails directly in your Gmail Drafts folder. You will be notified via WhatsApp.
                            </p>
                            <div className="flex items-center gap-2 mt-3">
                              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500 text-[10px] font-bold uppercase tracking-wider">Pro Feature</span>
                            </div>
                          </div>
                          
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              disabled={user?.plan === "FREE"}
                              checked={(user?.appPreferences as any)?.smartDrafts === true}
                              onChange={async (e) => {
                                const checked = e.target.checked;
                                await updateAppPreferencesAction({ smartDrafts: checked });
                                toast.success(`Smart Drafts ${checked ? "enabled" : "disabled"}`);
                              }}
                            />
                            <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                          </label>
                        </div>

                      </div>
                    </div>
                  </div>
                )}

                {/* SECURITY TAB */}
                {activeTab === "security" && (
                  <div className="space-y-6">
                    {/* Password Management */}
                    <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur text-card-foreground shadow-xl overflow-hidden hover:shadow-2xl hover:border-border transition-all duration-300">
                      <div className="p-6 border-b border-border/50 bg-secondary/10">
                        <h3 className="text-lg font-bold flex items-center gap-2"><Key className="w-5 h-5 text-primary" /> Password</h3>
                        <p className="text-sm text-muted-foreground mt-1">Manage your password and authentication methods.</p>
                      </div>
                      <div className="p-6">
                        {!hasPassword ? (
                          <div className="flex flex-col items-start gap-4">
                            <div className="flex items-center gap-3 px-4 py-3 bg-secondary/30 rounded-xl border border-border/50">
                              <Shield className="w-5 h-5 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">Password management is securely handled by your OAuth provider.</p>
                            </div>
                          </div>
                        ) : (
                          <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-md">
                            <div className="space-y-2 relative">
                              <label className="text-sm font-semibold">Current Password</label>
                              <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input 
                                  name="currentPassword" 
                                  type="password" 
                                  required 
                                  className="w-full bg-secondary/30 border border-border/50 hover:border-border rounded-xl pl-10 pr-4 h-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200" 
                                />
                              </div>
                            </div>
                            <div className="space-y-2 relative">
                              <label className="text-sm font-semibold">New Password</label>
                              <div className="relative">
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input 
                                  name="newPassword" 
                                  type="password" 
                                  required 
                                  className="w-full bg-secondary/30 border border-border/50 hover:border-border rounded-xl pl-10 pr-4 h-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200" 
                                  minLength={8} 
                                />
                              </div>
                            </div>
                            
                            {passwordError && (
                              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-2 text-sm text-destructive animate-in fade-in slide-in-from-top-1">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <p>{passwordError}</p>
                              </div>
                            )}
                            
                            <div className="pt-2">
                              <Button 
                                type="submit" 
                                disabled={passwordLoading}
                                className="h-11 rounded-xl px-6 font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-95 active:translate-y-0"
                              >
                                {passwordLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Change Password
                              </Button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>

                    {/* Google Account */}
                    <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur text-card-foreground shadow-xl overflow-hidden hover:shadow-2xl hover:border-border transition-all duration-300">
                      <div className="p-6 border-b border-border/50 bg-secondary/10">
                        <h3 className="text-lg font-bold flex items-center gap-2">Google Authentication</h3>
                        <p className="text-sm text-muted-foreground mt-1">Manage linked single sign-on providers.</p>
                      </div>
                      <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-border/10">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-base">Google Account</p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {hasGoogleLinked ? "Your profile picture and identity are securely synced." : "Not linked"}
                            </p>
                          </div>
                        </div>
                        <div>
                          {hasGoogleLinked ? (
                            <span className="text-sm text-emerald-500 font-bold tracking-wide flex items-center justify-center gap-1.5 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 shadow-sm w-fit">
                              <CheckCircle2 className="w-4 h-4" /> Connected
                            </span>
                          ) : (
                            <Button 
                              variant="outline" 
                              onClick={() => signIn("google", { callbackUrl: "/settings" })}
                              className="h-11 rounded-xl px-6 font-semibold"
                            >
                              Link Google
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Active Sessions */}
                    <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur text-card-foreground shadow-xl overflow-hidden hover:shadow-2xl hover:border-border transition-all duration-300">
                      <div className="p-6 border-b border-border/50 bg-secondary/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold flex items-center gap-2"><Monitor className="w-5 h-5 text-primary" /> Active Sessions</h3>
                          <p className="text-sm text-muted-foreground mt-1">Review and manage devices logged into your account.</p>
                        </div>
                        {sessions.length > 1 && (
                          <form action={logoutAllDevicesAction}>
                            <Button variant="destructive" size="sm" className="rounded-lg font-semibold shadow-sm">Revoke all others</Button>
                          </form>
                        )}
                      </div>
                      <ul className="divide-y divide-border/50">
                        {sessions.map((session) => (
                          <li key={session.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/10 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-secondary border border-border/50 flex items-center justify-center shrink-0">
                                {session.os?.toLowerCase().includes("mac") || session.os?.toLowerCase().includes("ios") ? (
                                  <Laptop className="w-5 h-5 text-muted-foreground" />
                                ) : (
                                  <Monitor className="w-5 h-5 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground flex items-center gap-2 text-sm">
                                  {session.os || "Unknown OS"} - {session.browser || "Unknown Browser"} 
                                  {session.id === currentSessionId && (
                                    <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Current Device</span>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1 font-medium">
                                  {session.ipAddress || "Unknown IP"} • Expires {new Date(session.expires).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            {session.id !== currentSessionId && (
                              <Button variant="outline" size="sm" disabled className="rounded-lg">Revoke</Button>
                            )}
                          </li>
                        ))}
                        {sessions.length === 0 && (
                          <li className="p-8 text-sm text-muted-foreground text-center font-medium">No active sessions found.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                {/* APPEARANCE TAB */}
                {activeTab === "appearance" && (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur text-card-foreground shadow-xl overflow-hidden hover:shadow-2xl hover:border-border transition-all duration-300">
                      <div className="p-6 border-b border-border/50 bg-secondary/10">
                        <h3 className="text-lg font-bold">Theme Preferences</h3>
                        <p className="text-sm text-muted-foreground mt-1">Customize the appearance of your AI workspace.</p>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Dark Theme Card */}
                          <button 
                            onClick={() => setTheme("dark")}
                            className={`group relative flex flex-col gap-3 p-4 rounded-xl border-2 transition-all duration-300 text-left overflow-hidden ${theme === 'dark' ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.2)]' : 'border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50'}`}
                          >
                            <div className="w-full h-28 rounded-lg bg-[#0a0a0a] border border-white/10 flex items-center justify-center mb-2 shadow-inner group-hover:scale-[1.02] transition-transform">
                              <Moon className={`w-8 h-8 ${theme === 'dark' ? 'text-primary' : 'text-white/50'}`} />
                            </div>
                            <div className="flex items-center justify-between w-full px-1">
                              <span className="font-semibold text-sm">Dark Theme</span>
                              {theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                            </div>
                          </button>

                          {/* Light Theme Card */}
                          <button 
                            onClick={() => setTheme("light")}
                            className={`group relative flex flex-col gap-3 p-4 rounded-xl border-2 transition-all duration-300 text-left overflow-hidden ${theme === 'light' ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.2)]' : 'border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50'}`}
                          >
                            <div className="w-full h-28 rounded-lg bg-[#ffffff] border border-black/10 flex items-center justify-center mb-2 shadow-inner group-hover:scale-[1.02] transition-transform">
                              <Sun className={`w-8 h-8 ${theme === 'light' ? 'text-primary' : 'text-black/50'}`} />
                            </div>
                            <div className="flex items-center justify-between w-full px-1">
                              <span className="font-semibold text-sm">Light Theme</span>
                              {theme === 'light' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                            </div>
                          </button>

                          {/* System Theme Card */}
                          <button 
                            onClick={() => setTheme("system")}
                            className={`group relative flex flex-col gap-3 p-4 rounded-xl border-2 transition-all duration-300 text-left overflow-hidden ${theme === 'system' ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.2)]' : 'border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50'}`}
                          >
                            <div className="w-full h-28 rounded-lg bg-gradient-to-r from-[#ffffff] to-[#0a0a0a] border border-border/50 flex items-center justify-center mb-2 shadow-inner group-hover:scale-[1.02] transition-transform relative">
                              <Monitor className={`w-8 h-8 absolute left-[25%] -translate-x-1/2 text-black/50`} />
                              <Moon className={`w-8 h-8 absolute left-[75%] -translate-x-1/2 text-white/50`} />
                            </div>
                            <div className="flex items-center justify-between w-full px-1">
                              <span className="font-semibold text-sm">System Sync</span>
                              {theme === 'system' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* NOTIFICATIONS TAB */}
                {activeTab === "notifications" && (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur text-card-foreground shadow-xl overflow-hidden hover:shadow-2xl hover:border-border transition-all duration-300 flex flex-col items-center justify-center py-20 px-6 text-center">
                      <div className="w-20 h-20 rounded-full bg-secondary/50 border border-border flex items-center justify-center mb-6 shadow-inner">
                        <Bell className="w-10 h-10 text-muted-foreground opacity-50" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Notification Preferences</h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Notification settings are currently managed by the global AI engine. Custom thresholds and alert routing will be available in a future update.
                      </p>
                    </div>
                  </div>
                )}
                
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
