"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Application Error:", error);
  }, [error]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
      <div className="flex max-w-md flex-col items-center text-center space-y-4 p-8 border border-border rounded-lg bg-card">
        <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred. Our team has been notified.
        </p>
        <div className="text-xs text-muted-foreground font-mono bg-secondary/50 p-2 rounded w-full overflow-hidden text-ellipsis whitespace-nowrap">
          {error.digest ? `Request ID: ${error.digest}` : error.message}
        </div>
        <Button onClick={() => reset()} variant="default" className="mt-4">
          Try again
        </Button>
      </div>
    </div>
  );
}
