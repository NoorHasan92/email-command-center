"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plug, Activity } from "lucide-react";
import { QRCode } from "react-qrcode-logo";
import { toast } from "sonner";

export function IntegrationsClient({ initialWaMeta, telegramBotUsername }: { initialWaMeta?: any, telegramBotUsername?: string | null }) {
  // System WhatsApp State
  const [waStatus, setWaStatus] = useState<"connecting" | "connected" | "logged_out" | "available">(
    initialWaMeta?.phoneNumber ? "connected" : "available"
  );
  const [waQr, setWaQr] = useState<string | null>(null);
  const [waMeta, setWaMeta] = useState<any>(initialWaMeta || null);
  const [isWaLoading, setIsWaLoading] = useState(false);

  useEffect(() => {
    let es: EventSource | null = null;
    
    if (waStatus === "connecting") {
      setWaQr(null);
      es = new EventSource("/api/admin/whatsapp/sse");
      
      es.addEventListener('qr', (event) => {
        const data = JSON.parse(event.data);
        setWaQr(data.qr);
        setWaStatus("connecting");
      });

      es.addEventListener('status', (event) => {
        const data = JSON.parse(event.data);
        if (data.status === 'connected') {
            setWaStatus("connected");
            setWaMeta(data);
            setWaQr(null);
            toast.success("System Sender Connected", {
              description: "Inbox Sentinel is now ready to send messages via Baileys."
            });
        } else if (data.status === 'logged_out') {
          setWaStatus("available");
          setWaQr(null);
        } else if (data.status === 'connecting') {
          setWaStatus("connecting");
        }
      });
    }
    
    return () => {
      if (es) es.close();
    };
  }, [waStatus]);

  const handleDisconnectWhatsApp = async () => {
    setIsWaLoading(true);
    const res = await fetch("/api/admin/whatsapp/disconnect", { method: "POST" });
    setIsWaLoading(false);
    if (res.ok) {
      setWaStatus("available");
      setWaMeta(null);
      toast.success("System Sender Disconnected");
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      <div>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-white">
          <Plug className="w-8 h-8 text-indigo-500" />
          System Integrations
        </h1>
        <p className="text-slate-400 mt-2 font-medium">Manage core notification platforms and 3rd party connections.</p>
      </div>

      <div className="flex flex-col space-y-6">
        {/* WhatsApp System Integration */}
        <div className="bg-[#0f0f0f] p-6 rounded-2xl border border-border/10 shadow-inner">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight mb-2 text-white">Centralized System Sender</h2>
              <p className="text-slate-400 text-sm max-w-xl">
                Link the official Inbox Sentinel WhatsApp number. This number will be used to send OTP verification codes and alerts to all users.
              </p>
            </div>
            
            <div className="shrink-0 flex items-center justify-center bg-black/40 p-4 rounded-xl border border-border/10 min-w-[250px] min-h-[250px]">
              {waStatus === "available" && (
                <Button onClick={() => setWaStatus("connecting")} className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white border-0">
                  Connect System WhatsApp
                </Button>
              )}
              
              {waStatus === "connecting" && !waQr && (
                <div className="text-center text-slate-400">
                  <Activity className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-400" />
                  <p>Generating QR Code...</p>
                </div>
              )}
              
              {waStatus === "connecting" && waQr && (
                <div className="bg-white p-3 rounded-xl shadow-inner text-center">
                  <QRCode
                    value={waQr}
                    size={180}
                    logoImage="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                    logoWidth={50}
                    logoHeight={50}
                    quietZone={10}
                    eyeRadius={5}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                  <p className="text-xs text-slate-500 mt-2 font-medium">Scan with System WhatsApp</p>
                </div>
              )}
              
              {waStatus === "connected" && (
                <div className="text-center w-full">
                  <div className="w-16 h-16 bg-[#25D366]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#25D366]/30">
                    <svg className="w-8 h-8 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                  </div>
                  <h3 className="font-semibold mb-1 text-white">System Connected</h3>
                  <p className="text-sm text-slate-400 mb-4">{waMeta?.phoneNumber || "Ready to send"}</p>
                  <Button 
                    variant="destructive" 
                    className="w-full bg-red-500/20 text-red-400 hover:bg-red-500/30 border-0" 
                    onClick={handleDisconnectWhatsApp}
                    disabled={isWaLoading}
                  >
                    {isWaLoading ? "Disconnecting..." : "Disconnect"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Telegram System Integration */}
        <div className="bg-[#0f0f0f] p-6 rounded-2xl border border-border/10 shadow-inner flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mt-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight mb-2 text-white">Telegram Bot Integration</h2>
            <p className="text-slate-400 text-sm max-w-xl mb-4">
              The official Telegram bot used for routing notifications. Change the bot token in your <code className="bg-white/10 px-1 py-0.5 rounded text-xs text-white">.env</code> file to switch bots.
            </p>
            
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-[#229ED9]/20 flex items-center justify-center rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 text-[#229ED9]" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-0.5">Current Bot</div>
                <div className="text-sm font-semibold text-white">@{telegramBotUsername || "Not Configured"}</div>
              </div>
            </div>
          </div>
          
          <div className="shrink-0">
            <Badge variant={telegramBotUsername ? "default" : "destructive"} className={telegramBotUsername ? "bg-sky-500/10 text-sky-400 hover:bg-sky-500/20" : ""}>
              {telegramBotUsername ? "Active" : "Missing Configuration"}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
