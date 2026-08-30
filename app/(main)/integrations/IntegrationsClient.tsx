"use client";

import { useState, useEffect } from "react";
import { Plug, Plus, Check, Phone, Loader2, Mail, X, Send, Bell, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toggleWhatsAppAction, disconnectGmailAction, disconnectTelegramAction, updateNotifyChannelsAction } from "@/server/actions/integrations.actions";
import { sendWhatsAppOTPAction, verifyWhatsAppOTPAction } from "@/server/actions/whatsapp-otp.actions";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { initiateAccountLinkAction, verifyLinkCodesAction } from "@/server/actions/link-account.actions";
import { toast } from "sonner";
import PhoneInput, { isValidPhoneNumber, getCountries } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import * as Flags from 'country-flag-icons/react/3x2';

const CustomFlag = ({ country, countryName }: { country: string, countryName: string }) => {
  const Flag = Flags[country as keyof typeof Flags];
  if (!Flag) return <div className="w-5 h-4 bg-muted rounded-sm border border-border shrink-0" title={countryName} />;
  return <Flag title={countryName} className="w-5 h-4 object-cover rounded-sm border border-border shrink-0" />;
};

const CustomCountrySelect = ({ value, onChange, iconComponent: Icon }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

  const allCountries = getCountries().map(country => {
    let label: string = country;
    try {
      label = regionNames.of(country) || country;
    } catch (e) { }
    return { value: country, label };
  }).sort((a, b) => a.label.localeCompare(b.label));

  const filteredOptions = allCountries.filter((option: any) =>
    option.label?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 h-full hover:bg-secondary/50 focus:outline-none transition-colors border-r border-input bg-muted/10"
      >
        <Icon country={value} label={value ? allCountries.find(c => c.value === value)?.label || "International" : "International"} />
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-[calc(100%+8px)] left-0 w-[300px] bg-zinc-950 text-foreground border border-zinc-800 rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-100">
            <div className="border-b border-zinc-800 bg-zinc-900/50 p-2 shrink-0">
              <div className="relative flex items-center bg-black/40 border border-zinc-700/50 rounded-md overflow-hidden focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
                <Search className="w-4 h-4 absolute left-2.5 text-zinc-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search country..."
                  className="w-full bg-transparent border-none text-sm pl-8 pr-3 py-2 focus:outline-none placeholder:text-zinc-500 text-zinc-100"
                  autoFocus
                />
              </div>
            </div>
            <div className="p-1.5 overflow-y-auto max-h-[180px] flex-1 flex flex-col gap-0.5 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-sm text-center text-zinc-500">No countries found</div>
              ) : (
                filteredOptions.map((option: any) => (
                  <button
                    key={option.value || 'international'}
                    type="button"
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors text-left ${value === option.value ? 'bg-primary/20 text-primary font-medium' : 'hover:bg-zinc-800 text-zinc-300 hover:text-white'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(option.value);
                      setIsOpen(false);
                      setSearch("");
                    }}
                  >
                    <Icon country={option.value} label={option.label} />
                    <span className="truncate">{option.label}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

interface IntegrationsClientProps {
  gmailAccounts: any[];
  userPlan: string;
  whatsappOptIn: boolean;
  phoneNumber: string | null;
  telegramOptIn: boolean;
  telegramChatId: string | null;
  telegramUsername: string | null;
  notifyChannels: string[];
  hasProScopes: boolean;
  calendarAutomation: string;
}

export default function IntegrationsClient({
  gmailAccounts,
  userPlan,
  whatsappOptIn,
  phoneNumber,
  telegramOptIn,
  telegramChatId,
  telegramUsername,
  notifyChannels: initialChannels,
  hasProScopes,
  calendarAutomation,
}: IntegrationsClientProps) {
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [waLoading, setWaLoading] = useState(false);
  const [waStatus, setWaStatus] = useState<"connecting" | "connected" | "logged_out" | "available">(whatsappOptIn ? "connected" : "available");
  const [waQr, setWaQr] = useState<string | null>(null);
  const [waMeta, setWaMeta] = useState<any>(null);

  // WhatsApp OTP Flow State
  const [waMethod, setWaMethod] = useState<"OTP">("OTP");
  const [otpPhone, setOtpPhone] = useState("");
  const [otpStep, setOtpStep] = useState<"PHONE" | "VERIFY">("PHONE");
  const [waCode, setWaCode] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const [tgModalOpen, setTgModalOpen] = useState(false);
  const [tgLoading, setTgLoading] = useState(false);
  const [tgDeepLink, setTgDeepLink] = useState("");

  const [gmailModalOpen, setGmailModalOpen] = useState(false);
  const [gmailLoading, setGmailLoading] = useState(false);

  // Secondary Gmail Linking State
  const [addSecondaryGmailModalOpen, setAddSecondaryGmailModalOpen] = useState(false);
  const [secondaryGmailTarget, setSecondaryGmailTarget] = useState("");
  const [secondaryGmailRequestId, setSecondaryGmailRequestId] = useState("");
  const [primaryCode, setPrimaryCode] = useState("");
  const [secondaryCode, setSecondaryCode] = useState("");
  const [secondaryGmailStep, setSecondaryGmailStep] = useState<"EMAIL" | "CODES" | "SUCCESS">("EMAIL");
  const [secondaryGmailLoading, setSecondaryGmailLoading] = useState(false);

  // Notification channel preferences
  const [channels, setChannels] = useState<string[]>(initialChannels);
  const [channelsSaving, setChannelsSaving] = useState(false);
  const [channelsSaved, setChannelsSaved] = useState(false);

  const router = useRouter();


  // Legacy fallback or just disabled
  const handleConnectWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleDisconnectWhatsApp = async () => {
    setWaLoading(true);
    const res = await fetch("/api/integrations/whatsapp/disconnect", { method: "POST" });
    setWaLoading(false);
    if (res.ok) {
      setWaStatus("available");
      setWaMeta(null);
      // Remove WHATSAPP from channels
      const updated = channels.filter(c => c !== "WHATSAPP");
      setChannels(updated);
      await updateNotifyChannelsAction(updated);
      router.refresh();
    }
  };

  const handleConnectTelegram = async () => {
    setTgLoading(true);
    try {
      const res = await fetch("/api/integrations/telegram/link", { method: "POST" });
      const data = await res.json();
      if (data.deepLink) {
        setTgDeepLink(data.deepLink);
        window.open(data.deepLink, "_blank");
      }
    } catch (error) {
      console.error("Failed to generate Telegram link:", error);
    }
    setTgLoading(false);
  };

  const handleDisconnectTelegram = async () => {
    setTgLoading(true);
    const res = await disconnectTelegramAction();
    setTgLoading(false);
    if (res.success) {
      const updated = channels.filter(c => c !== "TELEGRAM");
      setChannels(updated);
      await updateNotifyChannelsAction(updated);
      router.refresh();
    }
  };

  const handleDisconnectGmail = async (id: string) => {
    setGmailLoading(true);
    const res = await disconnectGmailAction(id);
    setGmailLoading(false);
    if (res.success) {
      if (gmailAccounts.length === 1) {
        setGmailModalOpen(false);
      }
      router.refresh();
    }
  };

  const handleInitiateSecondaryLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secondaryGmailTarget) {
      toast.error("Please enter a valid Gmail address.");
      return;
    }
    setSecondaryGmailLoading(true);
    const res = await initiateAccountLinkAction(secondaryGmailTarget);
    setSecondaryGmailLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else if (res.success && res.requestId) {
      setSecondaryGmailRequestId(res.requestId);
      setSecondaryGmailStep("CODES");
      toast.success("Verification codes sent to both emails!");
    }
  };

  const handleVerifySecondaryCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryCode || !secondaryCode) {
      toast.error("Please enter both verification codes.");
      return;
    }
    setSecondaryGmailLoading(true);
    const res = await verifyLinkCodesAction(secondaryGmailRequestId, primaryCode, secondaryCode);
    setSecondaryGmailLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else if (res.success) {
      setSecondaryGmailStep("SUCCESS");
      toast.success("Verification successful!");
    }
  };

  const toggleChannel = async (channel: string) => {
    const updated = channels.includes(channel)
      ? channels.filter(c => c !== channel)
      : [...channels, channel];
    setChannels(updated);
    setChannelsSaving(true);
    await updateNotifyChannelsAction(updated);
    setChannelsSaving(false);
    setChannelsSaved(true);
    setTimeout(() => setChannelsSaved(false), 2000);
  };

  const handleSendOTP = async () => {
    if (!otpPhone || !isValidPhoneNumber(otpPhone)) {
      setOtpError("Please enter a valid phone number.");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    const res = await sendWhatsAppOTPAction(otpPhone);
    setOtpLoading(false);

    if (res.error) {
      setOtpError(res.error);
    } else if (res.success && res.verificationId) {
      setVerificationId(res.verificationId);
      setOtpStep("VERIFY");
      setResendCooldown(60);
    }
  };

  const handleVerifyOTP = async () => {
    if (waCode.length !== 6 || emailCode.length !== 6) {
      setOtpError("Please enter both 6-digit verification codes.");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    const res = await verifyWhatsAppOTPAction(verificationId, waCode, emailCode);
    setOtpLoading(false);

    if (res.error) {
      setOtpError(res.error);
    } else {
      toast.success("WhatsApp connected successfully!");
      setWaModalOpen(false);
      // Reset state
      setWaMethod("OTP");
      setOtpStep("PHONE");
      setOtpPhone("");
      setWaCode("");
      setEmailCode("");
      router.refresh();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-auto p-4 md:p-6 lg:p-10 z-10 relative">
      <div className="max-w-4xl mx-auto w-full space-y-6 md:space-y-8 pb-24">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Integrations</h1>
          <p className="text-muted-foreground">Connect your favorite tools to Inbox Sentinel.</p>
        </div>

        {/* Integration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <IntegrationCard
            title="Gmail"
            description="Connect your Gmail account to enable real-time AI scanning, threat detection, and automated smart drafting."
            icon={<img src="/gmail.svg" alt="Gmail" className="w-8 h-8 object-contain" />}
            status={gmailAccounts.length > 0 ? "connected" : "available"}
            onManage={() => setGmailModalOpen(true)}
            onConnect={() => window.location.href = "/api/integrations/gmail/connect"}
            healthStats={gmailAccounts.length > 0 ? {
              sync: gmailAccounts[0]?.lastSyncedAt ? formatDistanceToNow(new Date(gmailAccounts[0].lastSyncedAt), { addSuffix: true }) : 'Unknown',
              uptime: "100%"
            } : undefined}
          />
          <IntegrationCard
            title="WhatsApp"
            description="Get pinged on WhatsApp for highly critical, time-sensitive emails."
            icon={<WhatsAppIcon className="w-6 h-6 text-green-500" />}
            status={whatsappOptIn ? "connected" : "available"}
            onManage={() => setWaModalOpen(true)}
            onConnect={() => setWaModalOpen(true)}
            healthStats={whatsappOptIn ? { sync: "Live", uptime: "100%" } : undefined}
          />
          <IntegrationCard
            title="Telegram"
            description="Receive beautifully formatted AI alerts directly in Telegram."
            icon={<TelegramIcon className="w-6 h-6 text-sky-500" />}
            status={telegramOptIn ? "connected" : "available"}
            onManage={() => setTgModalOpen(true)}
            onConnect={() => { setTgModalOpen(true); handleConnectTelegram(); }}
            healthStats={telegramOptIn ? { sync: "Live", uptime: "100%" } : undefined}
          />
          <IntegrationCard
            title="Google Calendar"
            description="Automatically add detected deadlines and events to your calendar."
            icon={<img src="/google-calendar.png" alt="Google Calendar" className="w-13 h-13 object-contain drop-shadow-sm" />}
            status={hasProScopes && gmailAccounts.length > 0 ? "connected" : "available"}
            onManage={() => router.push('/settings?tab=preferences')}
            onConnect={() => {
              if (gmailAccounts.length === 0) {
                toast.error("Please connect a Gmail account first.");
              } else if (userPlan !== "PRO" && userPlan !== "ULTRA" && userPlan !== "ADMIN") {
                toast.error("Calendar integration requires a PRO or ULTRA plan.");
              } else {
                const hint = encodeURIComponent(gmailAccounts[0].emailAddress);
                window.location.href = `/api/integrations/gmail/connect?proScopes=true&login_hint=${hint}`;
              }
            }}
            isDisabled={calendarAutomation === "OFF"}
            healthStats={hasProScopes && gmailAccounts.length > 0 ? {
              sync: "Auto-sync active",
              uptime: "100%"
            } : undefined}
          />
          <IntegrationCard
            title="Slack"
            description="Receive critical alerts and daily summaries in Slack channels."
            icon={<Plug className="w-6 h-6 text-purple-500" />}
            status="coming_soon"
          />
        </div>

        {/* Notification Preferences Section */}
        {(whatsappOptIn || telegramOptIn) && (
          <Card className="bg-card/90 backdrop-blur border-border overflow-hidden">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Notification Preferences</h3>
                  <p className="text-sm text-muted-foreground">Choose where you want to receive email alerts.</p>
                </div>
                {channelsSaving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-auto" />}
                {channelsSaved && <span className="text-xs text-green-500 font-medium ml-auto flex items-center gap-1"><Check className="w-3 h-3" /> Saved</span>}
              </div>

              <div className="space-y-3">
                {whatsappOptIn && (
                  <label className="flex items-center gap-4 p-4 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={channels.includes("WHATSAPP")}
                      onChange={() => toggleChannel("WHATSAPP")}
                      className="w-5 h-5 rounded border-border accent-green-500"
                    />
                    <WhatsAppIcon className="w-5 h-5 text-green-500" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">WhatsApp</p>
                      <p className="text-xs text-muted-foreground">{waMeta?.phoneNumber || phoneNumber}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider uppercase ${channels.includes("WHATSAPP") ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-secondary text-muted-foreground"}`}>
                      {channels.includes("WHATSAPP") ? "Active" : "Paused"}
                    </span>
                  </label>
                )}
                {telegramOptIn && (
                  <label className="flex items-center gap-4 p-4 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={channels.includes("TELEGRAM")}
                      onChange={() => toggleChannel("TELEGRAM")}
                      className="w-5 h-5 rounded border-border accent-sky-500"
                    />
                    <TelegramIcon className="w-5 h-5 text-sky-500" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Telegram</p>
                      <p className="text-xs text-muted-foreground">@{telegramUsername || "Connected"}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider uppercase ${channels.includes("TELEGRAM") ? "bg-sky-500/10 text-sky-500 border border-sky-500/20" : "bg-secondary text-muted-foreground"}`}>
                      {channels.includes("TELEGRAM") ? "Active" : "Paused"}
                    </span>
                  </label>
                )}
              </div>

              {channels.length === 0 && (whatsappOptIn || telegramOptIn) && (
                <p className="text-xs text-orange-500 bg-orange-500/10 p-3 rounded-lg border border-orange-500/20">
                  ⚠️ No channels are active. You won't receive any notifications until you enable at least one channel.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* WhatsApp Modal */}
      {waModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md flex flex-col">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold text-lg flex items-center gap-2"><WhatsAppIcon className="w-5 h-5 text-green-500" /> WhatsApp Integration</h3>
              <button onClick={() => setWaModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6">
              {!whatsappOptIn ? (
                <div className="space-y-4">
                  {otpStep === "PHONE" ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Enter your WhatsApp phone number.</p>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Phone Number</label>
                        <PhoneInput
                          international
                          countryCallingCodeEditable={false}
                          defaultCountry="US"
                          value={otpPhone}
                          onChange={(val) => setOtpPhone(val as string)}
                          flagComponent={CustomFlag}
                          countrySelectComponent={CustomCountrySelect}
                          className="flex h-10 w-full rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                          numberInputProps={{
                            className: "flex-1 bg-transparent outline-none px-3 w-full h-full",
                            placeholder: "Enter phone number",
                            onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
                              if (e.key === 'Enter' && !otpLoading && otpPhone) {
                                e.preventDefault();
                                handleSendOTP();
                              }
                            }
                          }}
                        />
                      </div>
                      {otpError && <p className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-md">{otpError}</p>}
                      <Button
                        className="w-full"
                        onClick={handleSendOTP}
                        disabled={otpLoading || !otpPhone}
                      >
                        {otpLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Send Verification Code
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">A 6-digit code was sent to your WhatsApp and another to your Email.</p>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">WhatsApp Code</label>
                        <input
                          type="text"
                          maxLength={6}
                          value={waCode}
                          onChange={(e) => setWaCode(e.target.value.replace(/\D/g, ''))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !otpLoading && waCode.length === 6 && emailCode.length === 6) {
                              e.preventDefault();
                              handleVerifyOTP();
                            }
                          }}
                          placeholder="______"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xl text-center tracking-[0.5em] font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email Code</label>
                        <input
                          type="text"
                          maxLength={6}
                          value={emailCode}
                          onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ''))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !otpLoading && waCode.length === 6 && emailCode.length === 6) {
                              e.preventDefault();
                              handleVerifyOTP();
                            }
                          }}
                          placeholder="______"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xl text-center tracking-[0.5em] font-mono"
                        />
                        <p className="text-xs text-muted-foreground pt-1">
                          Didn't receive the email? Please check your spam or junk folder.
                        </p>
                      </div>
                      {otpError && <p className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-md">{otpError}</p>}
                      <Button
                        className="w-full"
                        onClick={handleVerifyOTP}
                        disabled={otpLoading || waCode.length !== 6 || emailCode.length !== 6}
                      >
                        {otpLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Verify & Connect
                      </Button>
                      <button
                        onClick={handleSendOTP}
                        disabled={otpLoading || resendCooldown > 0}
                        className={`w-full text-xs text-center transition-colors ${resendCooldown > 0 ? 'text-muted-foreground/50 cursor-not-allowed' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        {resendCooldown > 0 ? `Resend codes in ${resendCooldown}s` : 'Resend codes'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 bg-secondary/30 p-4 rounded-lg border border-border">
                    <Check className="w-6 h-6 text-green-500" />
                    <div>
                      <p className="font-medium">Connected</p>
                      <p className="text-sm text-muted-foreground">{waMeta?.phoneNumber || phoneNumber}</p>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-2">
                    <p><strong>Device:</strong> {waMeta?.deviceName || 'Personal Device'}</p>
                    <p><strong>Platform:</strong> {waMeta?.platform || 'Linked Device'}</p>
                    <p><strong>Last Connected:</strong> {waMeta?.lastConnected ? formatDistanceToNow(new Date(waMeta.lastConnected), { addSuffix: true }) : 'Live'}</p>
                    <p><strong>Delivery Method:</strong> Personal Device</p>
                  </div>

                  <Button variant="destructive" className="w-full" onClick={handleDisconnectWhatsApp} disabled={waLoading}>
                    {waLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Disconnect
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Telegram Modal */}
      {tgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md flex flex-col">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold text-lg flex items-center gap-2"><TelegramIcon className="w-5 h-5 text-sky-500" /> Telegram Integration</h3>
              <button onClick={() => setTgModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6">
              {!telegramOptIn ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Connect your Telegram to receive beautifully formatted AI-powered email alerts.</p>
                  <div className="bg-secondary/30 p-4 rounded-lg border border-border space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                      <p className="text-sm">Click the button below to open the Inbox Sentinel bot in Telegram.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                      <p className="text-sm">Press <strong>"Start"</strong> in the Telegram chat to link your account.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                      <p className="text-sm">Come back here and <strong>refresh the page</strong> to see the connection status.</p>
                    </div>
                  </div>
                  {tgDeepLink ? (
                    <div className="space-y-3">
                      <a href={tgDeepLink} target="_blank" rel="noopener noreferrer" className="block">
                        <Button className="w-full bg-sky-500 hover:bg-sky-600 text-white">
                          <Send className="w-4 h-4 mr-2" /> Open in Telegram
                        </Button>
                      </a>
                      <Button variant="outline" className="w-full" onClick={() => router.refresh()}>
                        I've clicked Start — Refresh
                      </Button>
                    </div>
                  ) : (
                    <Button className="w-full bg-sky-500 hover:bg-sky-600 text-white" onClick={handleConnectTelegram} disabled={tgLoading}>
                      {tgLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                      Connect Telegram
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 bg-secondary/30 p-4 rounded-lg border border-border">
                    <Check className="w-6 h-6 text-sky-500" />
                    <div>
                      <p className="font-medium">Connected</p>
                      <p className="text-sm text-muted-foreground">@{telegramUsername || "Telegram User"}</p>
                    </div>
                  </div>
                  <Button variant="destructive" className="w-full" onClick={handleDisconnectTelegram} disabled={tgLoading}>
                    {tgLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Disconnect
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Gmail Modal */}
      {gmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold text-lg flex items-center gap-2"><img src="/gmail.svg" alt="Gmail" className="w-5 h-5 object-contain" /> Connected Gmail Accounts</h3>
              <button onClick={() => setGmailModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto styled-scroll">
              {gmailAccounts.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground">
                  No Gmail accounts connected.
                </div>
              ) : (
                <div className="space-y-4">
                  {gmailAccounts.map((account: any) => (
                    <div key={account.id} className="p-4 bg-secondary/30 rounded-xl border border-border/50 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                            {account.emailAddress}
                            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-wider">Active</span>
                          </h4>
                          <div className="text-xs text-muted-foreground mt-2 space-y-1">
                            <p><strong>Status:</strong> {account.syncStatus}</p>
                            <p><strong>Last Sync:</strong> {account.lastSyncedAt ? formatDistanceToNow(new Date(account.lastSyncedAt), { addSuffix: true }) : 'Unknown'}</p>
                            <p><strong>Emails Synced:</strong> {account.totalEmailsSynced}</p>
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => router.push("/onboarding")}>
                            Reconnect
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDisconnectGmail(account.id)} disabled={gmailLoading}>
                            {gmailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Disconnect"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border bg-secondary/10">
              <Button
                variant="default"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={gmailAccounts.length >= 1 && userPlan !== "ULTRA" && userPlan !== "ADMIN"}
                onClick={() => setAddSecondaryGmailModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" /> Connect Another Gmail Account
              </Button>
              {gmailAccounts.length >= 1 && userPlan !== "ULTRA" && userPlan !== "ADMIN" && (
                <p className="text-[10px] text-center text-yellow-500 font-bold uppercase tracking-wider mt-3">
                  Ultra Plan Required to connect multiple accounts
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Secondary Gmail Modal */}
      {addSecondaryGmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border/50 overflow-hidden relative">
            <div className="p-6 border-b border-border/50">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Plus className="w-5 h-5" />
                {secondaryGmailStep === "EMAIL" && "Link Secondary Gmail"}
                {secondaryGmailStep === "CODES" && "Verify Ownership"}
                {secondaryGmailStep === "SUCCESS" && "Link Sent!"}
              </h3>
              <button onClick={() => setAddSecondaryGmailModalOpen(false)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              {secondaryGmailStep === "EMAIL" && (
                <form onSubmit={handleInitiateSecondaryLink} className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Enter the Gmail address you want to link. We will send verification codes to both your current email and this new email to ensure you own both.
                  </p>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Secondary Gmail Address</label>
                    <input
                      type="email"
                      value={secondaryGmailTarget}
                      onChange={(e) => setSecondaryGmailTarget(e.target.value)}
                      placeholder="e.g. your-other-email@gmail.com"
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full mt-2" disabled={secondaryGmailLoading}>
                    {secondaryGmailLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Send Codes"}
                  </Button>
                </form>
              )}

              {secondaryGmailStep === "CODES" && (
                <form onSubmit={handleVerifySecondaryCodes} className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    Check your inboxes! Enter the codes sent to your primary email and <strong>{secondaryGmailTarget}</strong>.
                  </p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Primary Verification Code</label>
                      <input
                        type="text"
                        value={primaryCode}
                        onChange={(e) => setPrimaryCode(e.target.value)}
                        placeholder="6-character code"
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        maxLength={6}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Secondary Verification Code</label>
                      <input
                        type="text"
                        value={secondaryCode}
                        onChange={(e) => setSecondaryCode(e.target.value)}
                        placeholder="6-character code"
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        maxLength={6}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={secondaryGmailLoading}>
                    {secondaryGmailLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Verify Codes"}
                  </Button>
                </form>
              )}

              {secondaryGmailStep === "SUCCESS" && (
                <div className="space-y-6 text-center py-4">
                  <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-semibold">Verification Successful</h4>
                  <p className="text-sm text-muted-foreground">
                    We have sent a final activation link to <strong>{secondaryGmailTarget}</strong>.
                    Please open that email on any device and click the link to authorize Inbox Sentinel.
                  </p>
                  <Button onClick={() => setAddSecondaryGmailModalOpen(false)} className="w-full" variant="outline">
                    Close
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function IntegrationCard({
  title,
  description,
  icon,
  status,
  onManage,
  onConnect,
  healthStats,
  isDisabled
}: {
  title: string,
  description: string,
  icon: React.ReactNode,
  status: "connected" | "available" | "coming_soon" | "sandbox",
  onManage?: () => void,
  onConnect?: () => void,
  healthStats?: { sync: string, uptime: string },
  isDisabled?: boolean
}) {
  const isConnected = status === 'connected' || status === 'sandbox';

  return (
    <Card className={`bg-card/80 backdrop-blur border-border/50 overflow-hidden relative group transition-all duration-300 hover:shadow-md ${isConnected ? 'hover:border-primary/50' : 'hover:border-border'}`}>
      {isConnected && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
      )}
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-center justify-between mb-5">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border ${isConnected ? 'bg-primary/5 border-primary/20' : 'bg-secondary border-border/50'}`}>
            {icon}
          </div>
          {status === "connected" && !isDisabled && (
            <div className="flex flex-col items-end">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-green-500 bg-green-500/10 px-2.5 py-1 rounded-md border border-green-500/20 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Healthy
              </span>
            </div>
          )}
          {status === "connected" && isDisabled && (
            <div className="flex flex-col items-end">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-secondary px-2.5 py-1 rounded-md border border-border/50 shadow-sm" title="Calendar automation is disabled. Click 'Manage Settings' below to enable it.">
                Disabled
              </span>
            </div>
          )}
          {status === "sandbox" && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-orange-500 bg-orange-500/10 px-2 py-1 rounded-md border border-orange-500/20" title="Only test numbers will receive messages in Sandbox Mode">
              <Phone className="w-3 h-3" /> Sandbox
            </span>
          )}
          {status === "coming_soon" && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-1 rounded-md border border-border/50">
              Coming Soon
            </span>
          )}
        </div>

        <h3 className="text-xl font-bold mb-2 tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6 flex-1 leading-relaxed">{description}</p>

        {isConnected && healthStats && (
          <div className="grid grid-cols-2 gap-2 mb-6 p-3 bg-secondary/30 rounded-xl border border-border/50">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Last Sync</span>
              <span className="text-xs font-medium text-foreground">{healthStats.sync}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Uptime</span>
              <span className="text-xs font-medium text-green-500">{healthStats.uptime}</span>
            </div>
          </div>
        )}

        {status === "available" && (
          <Button variant="outline" className="w-full rounded-xl hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-colors" onClick={onConnect}>
            <Plug className="w-4 h-4 mr-2" /> Connect Integration
          </Button>
        )}
        {isConnected && (
          <Button variant="secondary" className="w-full rounded-xl shadow-sm border border-border/50" onClick={onManage}>
            Manage Settings
          </Button>
        )}
        {status === "coming_soon" && (
          <Button variant="outline" disabled className="w-full rounded-xl opacity-50">
            Coming Soon
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
