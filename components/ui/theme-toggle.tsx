"use client";

import * as React from "react";
import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const cycleTheme = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("system");
    else setTheme("dark");
  };

  if (!mounted) {
    return (
      <button className="relative h-8 w-8 rounded-full border border-border/50 bg-muted/30 flex items-center justify-center opacity-50">
        <Moon className="h-4 w-4 text-muted-foreground" />
      </button>
    );
  }

  return (
    <button
      onClick={cycleTheme}
      className="relative h-8 w-8 rounded-full border border-border/50 bg-muted/30 hover:bg-secondary transition-colors inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer overflow-hidden group"
      title={`Current Theme: ${theme}. Click to change.`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === "dark" && (
          <motion.div
            key="dark"
            initial={{ y: 20, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -20, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors"
          >
            <Moon className="h-4 w-4" />
          </motion.div>
        )}
        {theme === "light" && (
          <motion.div
            key="light"
            initial={{ y: 20, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -20, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center text-orange-500 transition-colors"
          >
            <Sun className="h-4 w-4" />
          </motion.div>
        )}
        {theme === "system" && (
          <motion.div
            key="system"
            initial={{ y: 20, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -20, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center text-blue-500 transition-colors"
          >
            <Laptop className="h-4 w-4" />
          </motion.div>
        )}
      </AnimatePresence>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
