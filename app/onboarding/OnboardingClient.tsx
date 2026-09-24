"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, CheckCircle2, Loader2, ArrowRight, Shield, Zap, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OnboardingClient({ userName }: { userName: string }) {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const [step, setStep] = useState(urlError ? 2 : 1);
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const router = useRouter();

  const getErrorMessage = (err: string | null) => {
    if (!err) return null;
    switch (err) {
      case "EmailMismatchUltraRequired":
        return "The connected Gmail does not match your account email. Please connect the Gmail account you signed up with, or upgrade to Ultra.";
      case "ConsentDenied":
        return "Google authorization was not granted. Please approve permissions to connect your inbox.";
      case "StateMismatch":
        return "Connection session expired or was interrupted. Please tap Connect Gmail again.";
      case "NoAccessToken":
        return "Unable to retrieve access credentials from Google. Please try again.";
      case "DatabaseError":
        return "A database error occurred while saving your inbox. Please try again.";
      case "InvalidCallback":
        return "Invalid response received from Google. Please try again.";
      default:
        return "An error occurred while connecting your inbox. Please try again.";
    }
  };

  const errorMessage = getErrorMessage(urlError);

  const handleConnectGmail = () => {
    setIsConnecting(true);
    window.location.href = "/api/integrations/gmail/connect";
  };

  const finishOnboarding = () => {
    router.push("/dashboard");
  };


  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-lg z-10 relative">
        <div className="mb-8 flex justify-center">
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={`h-1.5 w-12 rounded-full transition-colors duration-500 ${step >= i ? "bg-primary" : "bg-secondary"}`}
              />
            ))}
          </div>
        </div>

        <div className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden min-h-[400px] relative">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-10 flex flex-col h-full"
              >
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight mb-3">Welcome, {userName.split(" ")[0]}</h2>
                <p className="text-muted-foreground leading-relaxed mb-8">
                  Inbox Sentinel is ready to transform how you handle email. We'll extract deadlines, flag important updates, and protect your focus.
                </p>
                <div className="mt-auto">
                  <Button onClick={() => setStep(2)} className="w-full h-12 text-base group">
                    Continue <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-10 flex flex-col h-full items-center text-center"
              >
                {!isConnecting ? (
                  <>
                    <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 mt-4">
                      <Mail className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight mb-3">Connect your Inbox</h2>
                    <p className="text-muted-foreground mb-6">
                      We need access to your Gmail to start analyzing your emails. We use read-only permissions and never sell your data.
                    </p>

                    {errorMessage && (
                      <div className="w-full mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3 text-left">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-destructive" />
                        <div className="flex-1">
                          <div className="font-semibold mb-0.5">Connection Failed</div>
                          <div className="text-xs text-muted-foreground leading-relaxed">{errorMessage}</div>
                        </div>
                      </div>
                    )}

                    <div className="mt-auto w-full">
                      <Button onClick={handleConnectGmail} className="w-full h-12 text-base bg-foreground text-background hover:bg-foreground/90">
                        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Connect Gmail
                      </Button>
                      <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground mt-4 underline-offset-4 hover:underline">
                        Back
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full w-full py-12">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
                    <h3 className="text-xl font-semibold mb-2">Syncing your inbox</h3>
                    <p className="text-sm text-muted-foreground mb-8">This might take a moment...</p>
                    
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                      <motion.div 
                        className="bg-primary h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${syncProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 font-mono">{syncProgress}% Complete</p>
                  </div>
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-10 flex flex-col h-full items-center text-center"
              >
                <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6 mt-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight mb-3">You're all set!</h2>
                <p className="text-muted-foreground mb-8">
                  We've successfully connected your account and analyzed your recent emails.
                </p>
                <div className="mt-auto w-full">
                  <Button onClick={finishOnboarding} className="w-full h-12 text-base">
                    Go to Dashboard <Zap className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
