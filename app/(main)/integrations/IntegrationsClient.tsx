"use client";

import { useState, useEffect } from "react";
import { Plug, Plus, Check, Phone, Loader2, Mail, X, Send, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toggleWhatsAppAction, disconnectGmailAction, disconnectTelegramAction, updateNotifyChannelsAction } from "@/server/actions/integrations.actions";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import * as Flags from 'country-flag-icons/react/3x2';

const CustomFlag = ({ country, countryName }: { country: string, countryName: string }) => {
  const Flag = Flags[country as keyof typeof Flags];
  if (!Flag) return <div className="w-5 h-4 bg-muted rounded-sm border border-border" title={countryName} />;
  return <Flag title={countryName} className="w-5 h-4 object-cover rounded-sm border border-border" />;
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
  gmailAccount: any;
  whatsappOptIn: boolean;
  phoneNumber: string | null;
  telegramOptIn: boolean;
  telegramChatId: string | null;
  telegramUsername: string | null;
  notifyChannels: string[];
}

export default function IntegrationsClient({
  gmailAccount,
  whatsappOptIn,
  phoneNumber,
  telegramOptIn,
  telegramChatId,
  telegramUsername,
  notifyChannels: initialChannels,
}: IntegrationsClientProps) {
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [waLoading, setWaLoading] = useState(false);
  const [waPhone, setWaPhone] = useState(phoneNumber || "");
  const [waError, setWaError] = useState("");

  const [tgModalOpen, setTgModalOpen] = useState(false);
  const [tgLoading, setTgLoading] = useState(false);
  const [tgDeepLink, setTgDeepLink] = useState("");

  const [gmailModalOpen, setGmailModalOpen] = useState(false);
  const [gmailLoading, setGmailLoading] = useState(false);

  // Notification channel preferences
  const [channels, setChannels] = useState<string[]>(initialChannels);
  const [channelsSaving, setChannelsSaving] = useState(false);
  const [channelsSaved, setChannelsSaved] = useState(false);

  const router = useRouter();

  const handleConnectWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waPhone || !isValidPhoneNumber(waPhone)) {
      setWaError("Please enter a valid phone number for the selected country.");
      return;
    }

    setWaLoading(true);
    const res = await toggleWhatsAppAction(waPhone);
    setWaLoading(false);
    if (res.success) {
      setWaModalOpen(false);
      // Auto-enable WHATSAPP channel
      const updated = [...new Set([...channels, "WHATSAPP"])];
      setChannels(updated);
      await updateNotifyChannelsAction(updated);
      router.refresh();
    }
  };

  const handleDisconnectWhatsApp = async () => {
    setWaLoading(true);
    const res = await toggleWhatsAppAction(null);
    setWaLoading(false);
    if (res.success) {
      setWaPhone("");
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

  const handleDisconnectGmail = async () => {
    if (!gmailAccount?.id) return;
    setGmailLoading(true);
    const res = await disconnectGmailAction(gmailAccount.id);
    setGmailLoading(false);
    if (res.success) {
      setGmailModalOpen(false);
      router.refresh();
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

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-auto p-6 lg:p-10 z-10 relative">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Integrations</h1>
          <p className="text-muted-foreground">Connect your favorite tools to Inbox Sentinel.</p>
        </div>

        {/* Integration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <IntegrationCard
            title="Gmail"
            description="Sync your inbox, extract deadlines, and manage emails automatically."
            icon={<img src="/gmail.svg" alt="Gmail" className="w-6 h-6 object-contain" />}
            status={gmailAccount ? "connected" : "available"}
            onManage={() => setGmailModalOpen(true)}
            onConnect={() => { window.location.href = "/api/integrations/gmail/connect"; }}
          />
          <IntegrationCard
            title="WhatsApp"
            description="Get pinged on WhatsApp for highly critical, time-sensitive emails."
            icon={<WhatsAppIcon className="w-6 h-6 text-green-500" />}
            status={whatsappOptIn ? "connected" : "available"}
            onManage={() => setWaModalOpen(true)}
            onConnect={() => setWaModalOpen(true)}
          />
          <IntegrationCard
            title="Telegram"
            description="Receive beautifully formatted AI alerts directly in Telegram."
            icon={<TelegramIcon className="w-6 h-6 text-sky-500" />}
            status={telegramOptIn ? "connected" : "available"}
            onManage={() => setTgModalOpen(true)}
            onConnect={() => { setTgModalOpen(true); handleConnectTelegram(); }}
          />
          <IntegrationCard
            title="Google Calendar"
            description="Automatically add detected deadlines and events to your calendar."
            icon={<Plug className="w-6 h-6 text-blue-500" />}
            status="coming_soon"
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
                      <p className="text-xs text-muted-foreground">{phoneNumber}</p>
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
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold text-lg flex items-center gap-2"><WhatsAppIcon className="w-5 h-5 text-green-500" /> WhatsApp Integration</h3>
              <button onClick={() => setWaModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6">
              {!whatsappOptIn ? (
                <form onSubmit={handleConnectWhatsApp} className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">Enter your phone number to receive critical alerts directly on WhatsApp.</p>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone Number</label>
                    <div className="flex w-full rounded-md border border-border bg-secondary/50 focus-within:ring-1 focus-within:ring-ring overflow-hidden items-center px-3 py-2">
                      <PhoneInput
                        international
                        defaultCountry="US"
                        flagComponent={CustomFlag}
                        value={waPhone}
                        onChange={(value) => {
                          setWaPhone(value || "");
                          if (waError) setWaError("");
                        }}
                        className="w-full text-sm outline-none bg-transparent custom-phone-input"
                      />
                    </div>
                    {waError && <p className="text-xs text-destructive mt-1">{waError}</p>}
                  </div>
                  <Button type="submit" className="w-full" disabled={waLoading}>
                    {waLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Connect WhatsApp
                  </Button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 bg-secondary/30 p-4 rounded-lg border border-border">
                    <Check className="w-6 h-6 text-green-500" />
                    <div>
                      <p className="font-medium">Connected</p>
                      <p className="text-sm text-muted-foreground">{phoneNumber}</p>
                    </div>
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
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
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
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold text-lg flex items-center gap-2"><img src="/gmail.svg" alt="Gmail" className="w-5 h-5 object-contain" /> Gmail Integration</h3>
              <button onClick={() => setGmailModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4 bg-secondary/30 p-4 rounded-lg border border-border">
                <Check className="w-6 h-6 text-green-500" />
                <div>
                  <p className="font-medium">Connected</p>
                  <p className="text-sm text-muted-foreground">{gmailAccount?.emailAddress}</p>
                </div>
              </div>

              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Status:</strong> {gmailAccount?.syncStatus}</p>
                <p><strong>Last Sync:</strong> {gmailAccount?.lastSyncedAt ? formatDistanceToNow(new Date(gmailAccount.lastSyncedAt), { addSuffix: true }) : 'Unknown'}</p>
                <p><strong>Emails Synced:</strong> {gmailAccount?.totalEmailsSynced}</p>
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Button variant="outline" className="w-full" onClick={() => router.push("/onboarding")}>
                  Reconnect
                </Button>
                <Button variant="destructive" className="w-full" onClick={handleDisconnectGmail} disabled={gmailLoading}>
                  {gmailLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Disconnect
                </Button>
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  Warning: Disconnecting will pause syncing. If this is your only account, you will be redirected to onboarding.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function IntegrationCard({ title, description, icon, status, onManage, onConnect }: { title: string, description: string, icon: React.ReactNode, status: "connected" | "available" | "coming_soon" | "sandbox", onManage?: () => void, onConnect?: () => void }) {
  return (
    <Card className={`bg-card/90 backdrop-blur border-border overflow-hidden ${(status === 'connected' || status === 'sandbox') ? 'bg-secondary/20 border-primary/30' : ''} transition-all hover:shadow-sm`}>
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
            {icon}
          </div>
          {status === "connected" && (
            <span className="flex items-center gap-1 text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
              <Check className="w-3 h-3" /> Connected
            </span>
          )}
          {status === "sandbox" && (
            <span className="flex items-center gap-1 text-xs font-medium text-orange-500 bg-orange-500/10 px-2 py-1 rounded-full border border-orange-500/20" title="Only test numbers will receive messages in Sandbox Mode">
              <Phone className="w-3 h-3" /> Sandbox Mode
            </span>
          )}
          {status === "coming_soon" && (
            <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-full">
              Coming Soon
            </span>
          )}
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6 flex-1 leading-relaxed">{description}</p>

        {status === "available" && (
          <Button variant="outline" className="w-full" onClick={onConnect}>
            <Plus className="w-4 h-4 mr-2" /> Connect
          </Button>
        )}
        {(status === "connected" || status === "sandbox") && (
          <Button variant="secondary" className="w-full" onClick={onManage}>
            Manage
          </Button>
        )}
        {status === "coming_soon" && (
          <Button variant="outline" disabled className="w-full">
            Waitlist
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
