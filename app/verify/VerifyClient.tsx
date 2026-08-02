"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield, Loader2, CheckCircle, XCircle } from "lucide-react";
import { APP_CONFIG } from "@/config/app";
import { verifyEmailAction } from "@/server/actions/auth.actions";

export default function VerifyClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const hasVerified = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Missing verification token.");
      return;
    }

    if (hasVerified.current) return;
    hasVerified.current = true;

    async function verify() {
      try {
        const res = await verifyEmailAction(token as string);
        if (res?.error) {
          setStatus("error");
          setErrorMessage(res.error);
        } else if (res?.success) {
          setStatus("success");
        }
      } catch (err: unknown) {
        setStatus("error");
        setErrorMessage("An unexpected error occurred.");
      }
    }

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <div className="w-full max-w-[400px] flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2 mb-2">
          <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-xl mb-2 border border-primary/20">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Email Verification</h1>
          <p className="text-sm text-muted-foreground">
            {APP_CONFIG.name} Security
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-2xl relative overflow-hidden text-center">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          {status === "loading" && (
            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-medium">Verifying your email...</p>
              <p className="text-xs text-muted-foreground">Please wait while we validate your token.</p>
            </div>
          )}

          {status === "success" && (
            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center border border-green-500/20">
                <CheckCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium">Email verified successfully!</p>
              <p className="text-xs text-muted-foreground">Your account is now fully active.</p>
              <Link href="/login" className="w-full mt-4 bg-primary text-primary-foreground font-medium text-sm py-2 rounded-md hover:bg-primary/90 transition-all flex items-center justify-center h-10">
                Continue to Login
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center border border-destructive/20">
                <XCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium">Verification Failed</p>
              <p className="text-xs text-muted-foreground">{errorMessage}</p>
              <Link href="/login" className="text-primary hover:underline text-sm font-medium mt-4">
                Return to Login
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
