"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { logoutAllDevicesAction, updateProfileAction, updatePasswordAction } from "@/server/actions/auth.actions";
import { updateAppPreferencesAction } from "@/server/actions/preferences.actions";
import { connectAIKeyAction, disconnectAIKeyAction, updateAIProcessingModeAction, verifyAIKeyAction } from "@/server/actions/byok.actions";
import { createRazorpayByokOrderAction, verifyRazorpayByokSignatureAction } from "@/server/actions/billing.actions";
import { loadRazorpayScript } from "@/lib/razorpay";
import { Button } from "@/components/ui/button";
import { User, Shield, Key, Loader2, CheckCircle2, AlertCircle, User as UserIcon, Monitor, Bell, Mail, Globe, Laptop, Sun, Moon, Sliders, Brain, Cpu, Database, Link, Unlink, Lock, RefreshCw, Info, CreditCard, Type } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UserAvatar } from "@/components/common/UserAvatar";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useFont } from "@/providers/font-provider";


declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SettingsClient({
  sessions,
  currentSessionId,
  user,
  hasPassword,
  hasGoogleLinked,
  initialTab = "profile"
}: {
  sessions: any[];
  currentSessionId: string | null;
  user: any;
  hasPassword: boolean;
  hasGoogleLinked: boolean;
  initialTab?: string;
}) {
  const [activeTab, setActiveTab] = useState<"profile" | "preferences" | "ai" | "security" | "appearance" | "notifications">(initialTab as any);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [aiLoading, setAiLoading] = useState(false);
  const [aiKeyInput, setAiKeyInput] = useState("");
  const [isPurchasingByok, setIsPurchasingByok] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteFeedback, setDeleteFeedback] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { font, setFont } = useFont();
  const [draftFont, setDraftFont] = useState<string | null>(null);

  const handleFontChange = async (newFont: string) => {
    setFont(newFont);
    await updateAppPreferencesAction({ font: newFont });
    setDraftFont(null);
    toast.success("Typography updated");
  };

  const activeFontSelection = draftFont || font;

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const allFonts = [
        "font-geist", "font-inter", "font-outfit", "font-playfair",
        "font-roboto", "font-jakarta", "font-fira", "font-lora",
        "font-poppins", "font-montserrat", "font-nunito", "font-merriweather"
      ];
      root.classList.remove(...allFonts);
      if (draftFont) {
        root.classList.add(draftFont);
      } else if (font) {
        root.classList.add(font);
      }
    }
  }, [draftFont, font]);

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

  const handleConnectAIKey = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAiLoading(true);
    const res = await connectAIKeyAction(aiKeyInput);
    setAiLoading(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("AI Key connected successfully");
      setAiKeyInput("");
      router.refresh();
    }
  };

  const handleDisconnectAIKey = async () => {
    setAiLoading(true);
    const res = await disconnectAIKeyAction();
    setAiLoading(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("AI Key disconnected");
      router.refresh();
    }
  };

  const handleVerifyAIKey = async () => {
    setAiLoading(true);
    const res = await verifyAIKeyAction();
    setAiLoading(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("AI Key verified successfully");
      router.refresh();
    }
  };

  const handleAIProcessingModeChange = async (mode: any, allowFallback: boolean) => {
    const res = await updateAIProcessingModeAction(mode, allowFallback);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("AI Processing Mode updated");
      router.refresh();
    }
  };

  const handlePurchaseByok = async () => {
    setIsPurchasingByok(true);

    // 1. Create Order
    const orderRes = await createRazorpayByokOrderAction();
    if (!orderRes.success || !orderRes.orderId) {
      toast.error(orderRes.error || "Failed to initiate payment");
      setIsPurchasingByok(false);
      return;
    }

    // 1.5 Load Razorpay Script
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      toast.error("Failed to load Razorpay SDK. Please disable any adblockers and try again.");
      setIsPurchasingByok(false);
      return;
    }

    // 2. Open Razorpay Checkout
    const options = {
      key: orderRes.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: orderRes.amount,
      currency: orderRes.currency,
      name: "Inbox Sentinel",
      description: "Purchase BYOK Add-on",
      order_id: orderRes.orderId,
      handler: async function (response: any) {
        // 3. Verify Signature
        const verifyRes = await verifyRazorpayByokSignatureAction(
          response.razorpay_payment_id,
          response.razorpay_order_id,
          response.razorpay_signature
        );

        if (verifyRes.success) {
          toast.success("BYOK Add-on purchased successfully!");
          router.refresh();
        } else {
          toast.error(verifyRes.error || "Payment verification failed");
        }
        setIsPurchasingByok(false);
      },
      theme: {
        color: "#6366f1"
      },
      modal: {
        ondismiss: function () {
          setIsPurchasingByok(false);
        }
      }
    };

    const rzp = new window.Razorpay(options);

    rzp.on("payment.failed", function () {
      toast.error("Payment failed or cancelled.");
      setIsPurchasingByok(false);
    });

    rzp.open();
  };

  // UI Components
  const TABS = [
    { id: "profile", label: "Profile", icon: User },
    { id: "preferences", label: "App Settings", icon: Sliders },
    { id: "ai", label: "AI Provider", icon: Brain },
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
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">Welcome back, {user?.name || "User"}</h1>
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
                  onClick={() => {
                    setActiveTab(tab.id as any);
                  }}
                  className={`group relative flex items-center gap-2 md:gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 overflow-hidden shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
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
                                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${user?.plan === "ADMIN" ? "bg-indigo-500/20 text-indigo-400" :
                                    user?.plan === "ULTRA" ? "bg-purple-500/20 text-purple-400" :
                                      user?.plan === "PRO" ? "bg-blue-500/20 text-blue-400" :
                                        "bg-primary/20 text-primary"
                                  }`}>
                                  {user?.plan || "FREE"} PLAN
                                </span>
                                {hasGoogleLinked && (
                                  <span className="whitespace-nowrap shrink-0 text-[10px] uppercase tracking-wider font-bold bg-green-500/10 text-green-500 px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit border border-green-500/20">
                                    <CheckCircle2 className="w-3 h-3 shrink-0" /> Google Linked
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
                        <div className="flex flex-col gap-4 p-4 rounded-xl border border-border/50 bg-secondary/10 hover:bg-secondary/20 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="text-sm font-bold text-foreground">Calendar Automation</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                Allow AI to automatically schedule detected meetings, deadlines, and events into your Google Calendar.
                              </p>
                              <div className="flex items-center gap-2 mt-3">
                                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500 text-[10px] font-bold uppercase tracking-wider">Pro Feature</span>
                              </div>
                            </div>
                            <div className="shrink-0">
                              <label className={`relative inline-flex items-center ${user?.plan === "FREE" ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  disabled={user?.plan === "FREE"}
                                  checked={(user?.appPreferences as any)?.calendarAutomation !== "OFF" && !!(user?.appPreferences as any)?.calendarAutomation}
                                  onChange={async (e) => {
                                    const checked = e.target.checked;
                                    const newMode = checked ? "ASK" : "OFF";
                                    await updateAppPreferencesAction({ calendarAutomation: newMode });
                                    if (checked) {
                                      toast.success("Calendar automation enabled");
                                    } else {
                                      toast.error("Calendar automation disabled");
                                    }
                                  }}
                                />
                                <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                              </label>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-2">
                            <div className="text-xs font-semibold text-muted-foreground">Automation Mode</div>
                            <div className={`shrink-0 flex items-center bg-black/20 rounded-xl p-1 border border-border/30 transition-opacity ${((user?.appPreferences as any)?.calendarAutomation === "OFF" || !(user?.appPreferences as any)?.calendarAutomation) ? 'opacity-50 pointer-events-none' : ''}`}>
                              <button
                                disabled={user?.plan === "FREE"}
                                onClick={async () => {
                                  await updateAppPreferencesAction({ calendarAutomation: "AUTO" });
                                  toast.success("Calendar automation set to Automatic");
                                }}
                                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${(user?.appPreferences as any)?.calendarAutomation === "AUTO"
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : "text-muted-foreground hover:text-foreground"
                                  }`}
                              >
                                Auto-Manage
                              </button>
                              <button
                                disabled={user?.plan === "FREE"}
                                onClick={async () => {
                                  await updateAppPreferencesAction({ calendarAutomation: "ASK" });
                                  toast.success("Calendar automation set to Ask Permission");
                                }}
                                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${(user?.appPreferences as any)?.calendarAutomation === "ASK"
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : "text-muted-foreground hover:text-foreground"
                                  }`}
                              >
                                Ask First
                              </button>
                            </div>
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

                          <label className={`relative inline-flex items-center shrink-0 ${user?.plan === "FREE" ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              disabled={user?.plan === "FREE"}
                              checked={(user?.appPreferences as any)?.smartDrafts === true}
                              onChange={async (e) => {
                                const checked = e.target.checked;
                                await updateAppPreferencesAction({ smartDrafts: checked });
                                if (checked) {
                                  toast.success("Smart Drafts enabled");
                                } else {
                                  toast.error("Smart Drafts disabled");
                                }
                              }}
                            />
                            <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                          </label>
                        </div>

                      </div>
                    </div>
                  </div>
                )}

                {/* AI PROVIDER TAB */}
                {activeTab === "ai" && (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur text-card-foreground shadow-xl overflow-hidden hover:shadow-2xl hover:border-border transition-all duration-300">
                      <div className="p-6 border-b border-border/50 bg-secondary/10 flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold flex items-center gap-2"><Brain className="w-5 h-5 text-primary" /> AI Engine Settings</h3>
                          <p className="text-sm text-muted-foreground mt-1">Connect your own Gemini API key or use the platform default.</p>
                        </div>
                        <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                          <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                            <Database className="w-3 h-3" /> BYOK Add-on
                          </span>
                        </div>
                      </div>

                      <div className="p-6">
                        {user?.plan === "FREE" ? (
                          <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center border border-border/50">
                              <Lock className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div>
                              <h4 className="text-lg font-bold">Bring Your Own Key (BYOK)</h4>
                              <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
                                Connect your own Gemini API key to use your own quota. This feature is exclusively available for Pro and Ultra plans.
                              </p>
                            </div>
                            <Button
                              onClick={() => router.push('/billing')}
                              className="mt-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                            >
                              Upgrade to Pro to Unlock
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-8">

                            {/* API Key Connection Status */}
                            {user?.aiConnection && user.aiConnection.status === "ACTIVE" ? (
                              <div className="p-5 rounded-xl border border-green-500/20 bg-green-500/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                  <Cpu className="w-24 h-24 text-green-500" />
                                </div>
                                <div className="relative z-10">
                                  <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-foreground">API Key Connected</h4>
                                      <p className="text-xs text-muted-foreground">Provider: {user.aiConnection.provider}</p>
                                    </div>
                                  </div>

                                  <div className="bg-background/50 rounded-lg p-3 border border-border/50 font-mono text-sm mb-4 inline-flex items-center gap-3">
                                    <span className="text-muted-foreground">AIza•••••••••••••••••••••••••••••••••{user.aiConnection.keyLastFour}</span>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <Button variant="outline" size="sm" onClick={handleVerifyAIKey} disabled={aiLoading} className="rounded-lg text-xs h-8">
                                      {aiLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />} Verify
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={handleDisconnectAIKey} disabled={aiLoading} className="rounded-lg text-xs h-8">
                                      {aiLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Unlink className="w-4 h-4 mr-2" />} Disconnect Key
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="p-5 rounded-xl border border-border/50 bg-secondary/10">
                                <h4 className="font-bold text-foreground mb-2 flex items-center gap-2"><Key className="w-4 h-4" /> Connect Gemini Key</h4>
                                <p className="text-xs text-muted-foreground mb-4 max-w-lg">
                                  Your API key is securely encrypted (AES-256-GCM) in our database and decrypted only at request time.
                                </p>
                                <form onSubmit={handleConnectAIKey} className="flex items-center gap-3">
                                  <div className="relative flex-1 max-w-md">
                                    <input
                                      type="password"
                                      placeholder="AIzaSy..."
                                      value={aiKeyInput}
                                      onChange={(e) => setAiKeyInput(e.target.value)}
                                      required
                                      className="w-full bg-background border border-border/50 focus:border-primary rounded-xl pl-4 pr-10 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                                    />
                                  </div>
                                  <Button type="submit" disabled={aiLoading || !aiKeyInput} className="rounded-xl h-10 shadow-md hover:shadow-lg transition-all">
                                    {aiLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Link className="w-4 h-4 mr-2" />} Connect
                                  </Button>
                                </form>

                                <div className="mt-6 pt-4 border-t border-border/30">
                                  <div className="flex items-start gap-3">
                                    <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                    <div>
                                      <h5 className="text-sm font-bold">How to get a Gemini API Key</h5>
                                      <ol className="list-decimal pl-4 mt-2 space-y-1 text-xs text-muted-foreground">
                                        <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Google AI Studio</a>.</li>
                                        <li>Sign in with your Google account.</li>
                                        <li>Click <strong>Create API key</strong> and copy the generated key.</li>
                                        <li>Ensure billing is enabled if you expect high usage.</li>
                                      </ol>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Processing Mode Selection */}
                            {user?.aiConnection && user.aiConnection.status === "ACTIVE" && (
                              <div className="space-y-4">
                                <h4 className="text-sm font-bold text-foreground border-b border-border/30 pb-2">AI Processing Mode</h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Platform */}
                                  <div
                                    onClick={() => handleAIProcessingModeChange("PLATFORM", true)}
                                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${user.aiConnection.processingMode === "PLATFORM" ? "border-primary bg-primary/5" : "border-border/50 hover:border-border hover:bg-secondary/30"}`}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <h5 className="font-bold text-sm">Platform AI</h5>
                                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${user.aiConnection.processingMode === "PLATFORM" ? "border-primary" : "border-muted"}`}>
                                        {user.aiConnection.processingMode === "PLATFORM" && <div className="w-2 h-2 bg-primary rounded-full" />}
                                      </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Uses Inbox Sentinel's shared AI quota. Limited by your plan limits.</p>
                                  </div>

                                  {/* Hybrid */}
                                  <div
                                    onClick={() => handleAIProcessingModeChange("HYBRID", true)}
                                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${user.aiConnection.processingMode === "HYBRID" ? "border-primary bg-primary/5" : "border-border/50 hover:border-border hover:bg-secondary/30"}`}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <h5 className="font-bold text-sm flex items-center gap-1.5">Smart Hybrid <span className="bg-primary/20 text-primary text-[9px] uppercase px-1.5 py-0.5 rounded-full">Recommended</span></h5>
                                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${user.aiConnection.processingMode === "HYBRID" ? "border-primary" : "border-muted"}`}>
                                        {user.aiConnection.processingMode === "HYBRID" && <div className="w-2 h-2 bg-primary rounded-full" />}
                                      </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Uses your personal key first, falling back to Platform AI if your key fails or is rate-limited.</p>
                                  </div>

                                  {/* Personal Only */}
                                  <div
                                    onClick={() => handleAIProcessingModeChange("PERSONAL", false)}
                                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all md:col-span-2 ${user.aiConnection.processingMode === "PERSONAL" ? "border-primary bg-primary/5" : "border-border/50 hover:border-border hover:bg-secondary/30"}`}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <h5 className="font-bold text-sm">Strict Personal (No Fallback)</h5>
                                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${user.aiConnection.processingMode === "PERSONAL" ? "border-primary" : "border-muted"}`}>
                                        {user.aiConnection.processingMode === "PERSONAL" && <div className="w-2 h-2 bg-primary rounded-full" />}
                                      </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Never uses Platform AI. If your API key fails, email analysis will halt and wait for retry.</p>
                                  </div>
                                </div>
                              </div>
                            )}

                          </div>
                        )}
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
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
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

                    {/* Danger Zone */}
                    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 backdrop-blur text-card-foreground shadow-xl overflow-hidden transition-all duration-300">
                      <div className="p-6 border-b border-destructive/20 bg-destructive/10">
                        <h3 className="text-lg font-bold text-destructive flex items-center gap-2"><AlertCircle className="w-5 h-5" /> Danger Zone</h3>
                        <p className="text-sm text-destructive/80 mt-1">Irreversible and destructive actions for your account.</p>
                      </div>
                      <div className="p-6">
                        {user?.accountStatus === "DELETION_SCHEDULED" ? (
                          <div className="flex flex-col gap-4 bg-destructive/10 p-5 rounded-xl border border-destructive/20">
                            <div className="flex items-center gap-3">
                              <AlertCircle className="w-6 h-6 text-destructive shrink-0" />
                              <div>
                                <h4 className="font-bold text-destructive">Account Deletion Scheduled</h4>
                                <p className="text-sm text-destructive/80 mt-1">
                                  Your account is scheduled for deletion on <strong>{new Date(user?.deletionRequest?.scheduledDeletionAt).toLocaleDateString()}</strong>.
                                </p>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              disabled={deleteLoading}
                              onClick={async () => {
                                setDeleteLoading(true);
                                const { cancelAccountDeletionAction } = await import("@/server/actions/deletion.actions");
                                const res = await cancelAccountDeletionAction();
                                setDeleteLoading(false);
                                if (res.success) {
                                  toast.success("Account deletion cancelled successfully.");
                                  router.refresh();
                                } else {
                                  toast.error(res.error || "Failed to cancel deletion");
                                }
                              }}
                              className="w-fit self-start border-destructive text-destructive hover:bg-destructive hover:text-white transition-colors"
                            >
                              {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                              Cancel Deletion Request
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <h4 className="font-bold text-foreground">Delete Account</h4>
                              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                                Permanently remove your account, settings, active sessions, and data. This action is irreversible after a 14-day grace period.
                              </p>
                            </div>
                            <Button variant="destructive" onClick={() => setIsDeleteModalOpen(true)} className="shrink-0 rounded-xl font-bold shadow-md hover:shadow-lg transition-all">
                              Delete Account
                            </Button>
                          </div>
                        )}
                      </div>
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

                    <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur text-card-foreground shadow-xl overflow-hidden hover:shadow-2xl hover:border-border transition-all duration-300 mt-6">
                      <div className="p-6 border-b border-border/50 bg-secondary/10">
                        <h3 className="text-lg font-bold">Typography Preferences</h3>
                        <p className="text-sm text-muted-foreground mt-1">Select your preferred font style for the workspace.</p>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <button
                            onClick={() => setDraftFont("font-geist")}
                            className={`group relative flex flex-col p-4 rounded-xl border-2 transition-all duration-300 text-left overflow-hidden ${activeFontSelection === 'font-geist' ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.2)]' : 'border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50'}`}
                          >
                            <span className="font-sans text-xl font-bold mb-1">Geist Sans</span>
                            <span className="text-sm text-muted-foreground mb-4">The quick brown fox</span>
                            <div className="flex items-center justify-between w-full mt-auto">
                              <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Default</span>
                              {activeFontSelection === 'font-geist' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                            </div>
                          </button>

                          <button
                            onClick={() => setDraftFont("font-inter")}
                            className={`group relative flex flex-col p-4 rounded-xl border-2 transition-all duration-300 text-left overflow-hidden ${activeFontSelection === 'font-inter' ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.2)]' : 'border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50'}`}
                          >
                            <span className="font-inter text-xl font-bold mb-1" style={{ fontFamily: "var(--font-inter)" }}>Inter</span>
                            <span className="text-sm text-muted-foreground mb-4" style={{ fontFamily: "var(--font-inter)" }}>The quick brown fox</span>
                            <div className="flex items-center justify-between w-full mt-auto">
                              <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Modern</span>
                              {activeFontSelection === 'font-inter' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                            </div>
                          </button>

                          <button
                            onClick={() => setDraftFont("font-outfit")}
                            className={`group relative flex flex-col p-4 rounded-xl border-2 transition-all duration-300 text-left overflow-hidden ${activeFontSelection === 'font-outfit' ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.2)]' : 'border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50'}`}
                          >
                            <span className="font-outfit text-xl font-bold mb-1" style={{ fontFamily: "var(--font-outfit)" }}>Outfit</span>
                            <span className="text-sm text-muted-foreground mb-4" style={{ fontFamily: "var(--font-outfit)" }}>The quick brown fox</span>
                            <div className="flex items-center justify-between w-full mt-auto">
                              <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Friendly</span>
                              {activeFontSelection === 'font-outfit' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                            </div>
                          </button>

                          <button
                            onClick={() => setDraftFont("font-playfair")}
                            className={`group relative flex flex-col p-4 rounded-xl border-2 transition-all duration-300 text-left overflow-hidden ${activeFontSelection === 'font-playfair' ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.2)]' : 'border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50'}`}
                          >
                            <span className="font-playfair text-xl font-bold mb-1" style={{ fontFamily: "var(--font-playfair)" }}>Playfair</span>
                            <span className="text-sm text-muted-foreground mb-4" style={{ fontFamily: "var(--font-playfair)" }}>The quick brown fox</span>
                            <div className="flex items-center justify-between w-full mt-auto">
                              <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Classic</span>
                              {activeFontSelection === 'font-playfair' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                            </div>
                          </button>

                          <button
                            onClick={() => setDraftFont("font-roboto")}
                            className={`group relative flex flex-col p-4 rounded-xl border-2 transition-all duration-300 text-left overflow-hidden ${activeFontSelection === 'font-roboto' ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.2)]' : 'border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50'}`}
                          >
                            <span className="font-roboto text-xl font-bold mb-1" style={{ fontFamily: "var(--font-roboto)" }}>Roboto</span>
                            <span className="text-sm text-muted-foreground mb-4" style={{ fontFamily: "var(--font-roboto)" }}>The quick brown fox</span>
                            <div className="flex items-center justify-between w-full mt-auto">
                              <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Standard</span>
                              {activeFontSelection === 'font-roboto' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                            </div>
                          </button>

                          <button
                            onClick={() => setDraftFont("font-jakarta")}
                            className={`group relative flex flex-col p-4 rounded-xl border-2 transition-all duration-300 text-left overflow-hidden ${activeFontSelection === 'font-jakarta' ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.2)]' : 'border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50'}`}
                          >
                            <span className="font-jakarta text-xl font-bold mb-1" style={{ fontFamily: "var(--font-jakarta)" }}>Plus Jakarta</span>
                            <span className="text-sm text-muted-foreground mb-4" style={{ fontFamily: "var(--font-jakarta)" }}>The quick brown fox</span>
                            <div className="flex items-center justify-between w-full mt-auto">
                              <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Geometric</span>
                              {activeFontSelection === 'font-jakarta' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                            </div>
                          </button>

                          <button
                            onClick={() => setDraftFont("font-fira")}
                            className={`group relative flex flex-col p-4 rounded-xl border-2 transition-all duration-300 text-left overflow-hidden ${activeFontSelection === 'font-fira' ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.2)]' : 'border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50'}`}
                          >
                            <span className="font-fira text-xl font-bold mb-1" style={{ fontFamily: "var(--font-fira)" }}>Fira Code</span>
                            <span className="text-sm text-muted-foreground mb-4" style={{ fontFamily: "var(--font-fira)" }}>The quick brown fox</span>
                            <div className="flex items-center justify-between w-full mt-auto">
                              <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Monospace</span>
                              {activeFontSelection === 'font-fira' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                            </div>
                          </button>

                          <button
                            onClick={() => setDraftFont("font-lora")}
                            className={`group relative flex flex-col p-4 rounded-xl border-2 transition-all duration-300 text-left overflow-hidden ${activeFontSelection === 'font-lora' ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.2)]' : 'border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50'}`}
                          >
                            <span className="font-lora text-xl font-bold mb-1" style={{ fontFamily: "var(--font-lora)" }}>Lora</span>
                            <span className="text-sm text-muted-foreground mb-4" style={{ fontFamily: "var(--font-lora)" }}>The quick brown fox</span>
                            <div className="flex items-center justify-between w-full mt-auto">
                              <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Elegant</span>
                              {activeFontSelection === 'font-lora' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                            </div>
                          </button>

                          <button
                            onClick={() => setDraftFont("font-poppins")}
                            className={`group relative flex flex-col p-4 rounded-xl border-2 transition-all duration-300 text-left overflow-hidden ${activeFontSelection === 'font-poppins' ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.2)]' : 'border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50'}`}
                          >
                            <span className="font-poppins text-xl font-bold mb-1" style={{ fontFamily: "var(--font-poppins)" }}>Poppins</span>
                            <span className="text-sm text-muted-foreground mb-4" style={{ fontFamily: "var(--font-poppins)" }}>The quick brown fox</span>
                            <div className="flex items-center justify-between w-full mt-auto">
                              <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Playful</span>
                              {activeFontSelection === 'font-poppins' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                            </div>
                          </button>

                          <button
                            onClick={() => setDraftFont("font-montserrat")}
                            className={`group relative flex flex-col p-4 rounded-xl border-2 transition-all duration-300 text-left overflow-hidden ${activeFontSelection === 'font-montserrat' ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.2)]' : 'border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50'}`}
                          >
                            <span className="font-montserrat text-xl font-bold mb-1" style={{ fontFamily: "var(--font-montserrat)" }}>Montserrat</span>
                            <span className="text-sm text-muted-foreground mb-4" style={{ fontFamily: "var(--font-montserrat)" }}>The quick brown fox</span>
                            <div className="flex items-center justify-between w-full mt-auto">
                              <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Clean</span>
                              {activeFontSelection === 'font-montserrat' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                            </div>
                          </button>

                          <button
                            onClick={() => setDraftFont("font-nunito")}
                            className={`group relative flex flex-col p-4 rounded-xl border-2 transition-all duration-300 text-left overflow-hidden ${activeFontSelection === 'font-nunito' ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.2)]' : 'border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50'}`}
                          >
                            <span className="font-nunito text-xl font-bold mb-1" style={{ fontFamily: "var(--font-nunito)" }}>Nunito</span>
                            <span className="text-sm text-muted-foreground mb-4" style={{ fontFamily: "var(--font-nunito)" }}>The quick brown fox</span>
                            <div className="flex items-center justify-between w-full mt-auto">
                              <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Rounded</span>
                              {activeFontSelection === 'font-nunito' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                            </div>
                          </button>

                          <button
                            onClick={() => setDraftFont("font-merriweather")}
                            className={`group relative flex flex-col p-4 rounded-xl border-2 transition-all duration-300 text-left overflow-hidden ${activeFontSelection === 'font-merriweather' ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.2)]' : 'border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50'}`}
                          >
                            <span className="font-merriweather text-xl font-bold mb-1" style={{ fontFamily: "var(--font-merriweather)" }}>Merriweather</span>
                            <span className="text-sm text-muted-foreground mb-4" style={{ fontFamily: "var(--font-merriweather)" }}>The quick brown fox</span>
                            <div className="flex items-center justify-between w-full mt-auto">
                              <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Readable</span>
                              {activeFontSelection === 'font-merriweather' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                            </div>
                          </button>
                        </div>

                        {/* Save/Cancel Action Bar */}
                        {draftFont && draftFont !== font && (
                          <div className="mt-6 flex justify-end gap-3 p-4 bg-secondary/20 rounded-xl border border-border/50 animate-in slide-in-from-bottom-2 fade-in duration-300">
                            <Button variant="ghost" onClick={() => setDraftFont(null)}>
                              Cancel
                            </Button>
                            <Button onClick={() => handleFontChange(draftFont)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                              Save Preferences
                            </Button>
                          </div>
                        )}
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

      {/* Account Deletion Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-lg rounded-2xl border border-destructive/20 shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-border/50 bg-destructive/5 relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <AlertCircle className="w-24 h-24 text-destructive" />
                </div>
                <div className="relative z-10 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-destructive">Delete Account</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      This action will initiate the deletion of your account.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh] styled-scroll">
                <div className="space-y-3 bg-secondary/30 p-4 rounded-xl border border-border/50">
                  <h4 className="font-bold text-sm">What happens next?</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0 mt-1.5" />
                      Your account will be immediately logged out and disabled.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0 mt-1.5" />
                      A 14-day grace period will begin. You can cancel the deletion by logging in during this time.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0 mt-1.5" />
                      After 14 days, all your data, emails, and preferences will be permanently deleted.
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Why are you leaving? (Optional)</label>
                    <select
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      className="w-full bg-background border border-border/50 rounded-xl px-4 h-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                    >
                      <option value="">Select a reason...</option>
                      <option value="TOO_EXPENSIVE">Too expensive</option>
                      <option value="NOT_USEFUL">Not useful for my needs</option>
                      <option value="SWITCHING_PRODUCT">Switching to another product</option>
                      <option value="PRIVACY_CONCERNS">Privacy concerns</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Any feedback for us? (Optional)</label>
                    <textarea
                      value={deleteFeedback}
                      onChange={(e) => setDeleteFeedback(e.target.value)}
                      placeholder="We'd love to know how we can improve..."
                      className="w-full bg-background border border-border/50 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px] resize-y"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-border/50 bg-secondary/10 flex items-center justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={deleteLoading}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    setDeleteLoading(true);
                    // Server action will be implemented in the next step
                    const { requestAccountDeletionAction } = await import("@/server/actions/deletion.actions");
                    const res = await requestAccountDeletionAction({ reason: deleteReason, feedback: deleteFeedback });
                    setDeleteLoading(false);
                    if (res.success) {
                      toast.success("Account deletion requested. Please check your email to confirm.");
                      setIsDeleteModalOpen(false);
                      router.refresh();
                    } else {
                      toast.error(res.error || "Failed to request deletion");
                    }
                  }}
                  disabled={deleteLoading}
                  className="rounded-xl font-bold shadow-md"
                >
                  {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Confirm Deletion Request
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
