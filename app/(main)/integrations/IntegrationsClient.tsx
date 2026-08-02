"use client";

import { useState } from "react";
import { Plug, Plus, Check, Phone, Loader2, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toggleWhatsAppAction, disconnectGmailAction } from "@/server/actions/integrations.actions";
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

export default function IntegrationsClient({
  gmailAccount,
  whatsappOptIn,
  phoneNumber
}: {
  gmailAccount: any;
  whatsappOptIn: boolean;
  phoneNumber: string | null;
}) {
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [waLoading, setWaLoading] = useState(false);
  const [waPhone, setWaPhone] = useState(phoneNumber || "");
  const [waError, setWaError] = useState("");

  const [gmailModalOpen, setGmailModalOpen] = useState(false);
  const [gmailLoading, setGmailLoading] = useState(false);

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
      router.refresh();
    }
  };

  const handleDisconnectWhatsApp = async () => {
    setWaLoading(true);
    const res = await toggleWhatsAppAction(null);
    setWaLoading(false);
    if (res.success) {
      setWaPhone("");
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
      router.refresh(); // This might redirect to onboarding since 0 accounts remain
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-auto p-6 lg:p-10 z-10 relative">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Integrations</h1>
          <p className="text-muted-foreground">Connect your favorite tools to Inbox Sentinel.</p>
        </div>

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
            status={whatsappOptIn ? (process.env.NODE_ENV === "development" ? "sandbox" : "connected") : "available"}
            onManage={() => setWaModalOpen(true)}
            onConnect={() => setWaModalOpen(true)}
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
                      <p className="font-medium">{process.env.NODE_ENV === "development" ? "Sandbox Mode" : "Connected"}</p>
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
