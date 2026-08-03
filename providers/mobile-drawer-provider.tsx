"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface MobileDrawerContextType {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  toggle: () => void;
  close: () => void;
}

const MobileDrawerContext = createContext<MobileDrawerContextType | undefined>(undefined);

export function MobileDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  // Auto-close drawer on navigation
  useEffect(() => {
    close();
  }, [pathname]);

  return (
    <MobileDrawerContext.Provider value={{ isOpen, setIsOpen, toggle, close }}>
      {children}
    </MobileDrawerContext.Provider>
  );
}

export function useMobileDrawer() {
  const context = useContext(MobileDrawerContext);
  if (context === undefined) {
    throw new Error("useMobileDrawer must be used within a MobileDrawerProvider");
  }
  return context;
}
