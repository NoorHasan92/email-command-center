import { Brain, Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[60vh] bg-transparent">
      <div className="relative flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-500">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-primary/20 blur-[50px] rounded-full animate-pulse" />
        
        <div className="relative flex items-center justify-center w-20 h-20 bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl shadow-primary/10">
          <Loader2 className="w-8 h-8 text-primary animate-spin absolute" />
          <Brain className="w-4 h-4 text-primary/80 animate-pulse" />
        </div>
        
        <div className="mt-8 flex flex-col items-center gap-2">
          <h3 className="font-bold text-lg tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
            Loading Workspace
          </h3>
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Gathering AI insights...
          </p>
        </div>
      </div>
    </div>
  );
}
