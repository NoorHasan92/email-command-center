"use client";

import React, { createContext, useContext, useState } from "react";
import { Loader2 } from "lucide-react";

interface GlobalLoaderContextType {
  isSwitchingAccount: boolean;
  setSwitchingAccount: (val: boolean) => void;
}

const GlobalLoaderContext = createContext<GlobalLoaderContextType>({
  isSwitchingAccount: false,
  setSwitchingAccount: () => {},
});

export function GlobalLoaderProvider({ children }: { children: React.ReactNode }) {
  const [isSwitchingAccount, setSwitchingAccount] = useState(false);

  return (
    <GlobalLoaderContext.Provider value={{ isSwitchingAccount, setSwitchingAccount }}>
      {children}
      
      {/* The actual loader UI overlay targeting the main content area */}
      {isSwitchingAccount && (
        <div className="absolute inset-x-4 inset-y-4 md:inset-x-8 md:inset-y-8 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm rounded-[24px] animate-in fade-in duration-200">
          <div className="bg-card border border-border/50 shadow-2xl p-6 rounded-2xl flex flex-col items-center gap-4">
             <Loader2 className="h-8 w-8 text-primary animate-spin" />
             <span className="font-medium text-sm text-foreground">Syncing workspace...</span>
          </div>
        </div>
      )}
    </GlobalLoaderContext.Provider>
  );
}

export const useGlobalLoader = () => useContext(GlobalLoaderContext);
