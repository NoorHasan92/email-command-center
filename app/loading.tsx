import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Loading Inbox Sentinel...
        </p>
      </div>
    </div>
  );
}
