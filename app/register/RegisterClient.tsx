"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield, Loader2, CheckCircle } from "lucide-react";
import { APP_CONFIG } from "@/config/app";
import { registerAction } from "@/server/actions/auth.actions";

export default function RegisterClient() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData(e.currentTarget);
      const res = await registerAction(formData);

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else if (res?.success) {
        setSuccess(true);
      }
    } catch (_err) {
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    signIn("google", { callbackUrl });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <div className="w-full max-w-[400px] flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2 mb-2">
          <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-xl mb-2 border border-primary/20">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
          <p className="text-sm text-muted-foreground">
            Join {APP_CONFIG.name} to get started
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          {error && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center font-medium">
              {error}
            </div>
          )}

          {success ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center border border-green-500/20">
                <CheckCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium">Account created successfully!</p>
              <p className="text-xs text-muted-foreground">Please check your email for a verification link to activate your account.</p>
              <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-primary hover:underline text-sm font-medium mt-2">
                Go to Login
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</label>
                  <input 
                    type="text"
                    name="name"
                    required
                    className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    placeholder="Jane Doe"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</label>
                  <input 
                    type="email"
                    name="email"
                    required
                    className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password</label>
                  <input 
                    type="password"
                    name="password"
                    required
                    className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    placeholder="••••••••"
                  />
                  <p className="text-[10px] text-muted-foreground pt-1">Must be strong (e.g. use multiple words or special characters).</p>
                </div>

                <button 
                  type="submit" 
                  disabled={loading || googleLoading}
                  className="mt-2 w-full bg-primary text-primary-foreground font-medium text-sm py-2 rounded-md hover:bg-primary/90 transition-all flex items-center justify-center h-10 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign Up"}
                </button>
              </form>

              <div className="relative flex items-center py-6">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink-0 mx-4 text-xs text-muted-foreground uppercase tracking-widest font-semibold">Or</span>
                <div className="flex-grow border-t border-border"></div>
              </div>

              <button 
                onClick={handleGoogleLogin}
                disabled={loading || googleLoading}
                className="w-full bg-secondary text-foreground font-medium text-sm py-2 rounded-md hover:bg-secondary/80 border border-border transition-all flex items-center justify-center gap-2 h-10 disabled:opacity-50"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Continue with Google
              </button>
            </>
          )}

        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}
