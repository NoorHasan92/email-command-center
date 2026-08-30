"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type FontContextType = {
  font: string;
  setFont: (font: string) => void;
};

const FontContext = createContext<FontContextType | undefined>(undefined);

export function FontProvider({ 
  children,
  defaultFont = "font-geist"
}: { 
  children: React.ReactNode;
  defaultFont?: string;
}) {
  const [font, setFontState] = useState<string>(defaultFont);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedFont = localStorage.getItem("workspace-font");
    if (savedFont) {
      setFontState(savedFont);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;
    // Remove existing font classes
    root.classList.remove("font-geist", "font-inter", "font-outfit", "font-playfair", "font-roboto", "font-jakarta", "font-fira", "font-lora", "font-poppins", "font-montserrat", "font-nunito", "font-merriweather");
    
    if (font) {
      root.classList.add(font);
    }
  }, [font, mounted]);

  const setFont = (newFont: string) => {
    setFontState(newFont);
    localStorage.setItem("workspace-font", newFont);
  };

  return (
    <FontContext.Provider value={{ font, setFont }}>
      {children}
    </FontContext.Provider>
  );
}

export const useFont = () => {
  const context = useContext(FontContext);
  if (context === undefined) {
    throw new Error("useFont must be used within a FontProvider");
  }
  return context;
};
