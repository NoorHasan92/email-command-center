import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[60vh] bg-transparent">
      <div className="relative flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-500">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-primary/20 blur-[50px] rounded-full animate-pulse" />
        
        <div className="relative flex items-center justify-center w-24 h-24 bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden">
          {/* Black silhouette background logo */}
          <div className="absolute inset-0 m-auto flex items-center justify-center opacity-40 grayscale brightness-0 p-4">
            <Image src="/app-logo.png" alt="Loading Background" width={64} height={64} className="object-contain" unoptimized />
          </div>
          
          {/* Silver/White animated filling logo */}
          <div className="absolute inset-0 m-auto flex items-center justify-center animate-fill-up p-4 z-10 grayscale brightness-150 contrast-125 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            <Image src="/app-logo.png" alt="Loading Fill" width={64} height={64} className="object-contain opacity-90" unoptimized />
          </div>
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
