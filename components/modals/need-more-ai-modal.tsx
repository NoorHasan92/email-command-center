"use client";

import { Button } from "@/components/ui/button";
import { Sparkles, KeyRound, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

interface NeedMoreAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: string;
}

export function NeedMoreAiModal({ isOpen, onClose, plan }: NeedMoreAiModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-2xl border border-border/50 shadow-2xl p-6 flex flex-col gap-4 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Need more AI capacity?
          </h2>
          <p className="pt-2 text-muted-foreground text-sm">
            You are reaching the limits of your current plan's AI capacity. To keep analyzing emails, you have a few options.
          </p>
        </div>

        <div className="flex flex-col gap-4 mt-4">
          
          {/* UPGRADE PLAN CARD */}
          {(plan === "FREE" || plan === "PRO") && (
            <div className="bg-black/20 p-4 rounded-xl border border-white/5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                  <Zap className="w-4 h-4" /> Upgrade Plan
                </div>
                <p className="text-sm text-muted-foreground">
                  {plan === "FREE" 
                    ? "Upgrade to PRO for 2,000 monthly analyses, AI drafting, and more."
                    : "Upgrade to ULTRA for 5,000 monthly analyses and priority support."}
                </p>
                <Button 
                  className="w-full mt-2 bg-indigo-500 hover:bg-indigo-600 text-white"
                  onClick={() => {
                    onClose();
                    router.push("/settings/billing");
                  }}
                >
                  View Plans
                </Button>
              </div>
            </div>
          )}

          {/* BYOK CARD */}
          <div className="bg-black/20 p-4 rounded-xl border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <KeyRound className="w-4 h-4" /> Bring Your Own AI
              </div>
              <p className="text-sm text-muted-foreground">
                Connect your personal Google Gemini API key to use your own AI provider quota without paying us for usage.
              </p>
              <Button 
                variant="outline"
                className="w-full mt-2 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                onClick={() => {
                  onClose();
                  router.push("/settings?tab=ai");
                }}
              >
                Configure BYOK
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
