"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  disableAnimation?: boolean;
}

export function UserAvatar({ src, name, size = "md", className, disableAnimation = false }: UserAvatarProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Standard sizes mapping
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-xl",
    xl: "w-20 h-20 md:w-24 md:h-24 text-3xl",
  };

  const getInitials = (name?: string | null) => {
    if (!name) return null;
    const parts = name.split(" ").filter(Boolean);
    if (parts.length === 0) return null;
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const fallbackContent = getInitials(name) || <UserIcon className="w-1/2 h-1/2 opacity-70" />;

  return (
    <div className={cn(
      "relative group shrink-0", 
      !disableAnimation && "hover:scale-[1.03] transition-all duration-300", 
      sizeClasses[size],
      className
    )}>
      {/* Soft Glow */}
      {!disableAnimation && (
        <div className="absolute inset-0 bg-gradient-to-tr from-primary to-purple-500 rounded-full blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none" />
      )}
      
      <Avatar className={cn(
        "relative w-full h-full border border-border/30 shadow-sm bg-card overflow-hidden !size-full after:hidden"
      )}>
        {src && !error ? (
          <AvatarImage 
            src={src} 
            alt={name || "User Avatar"} 
            className="object-cover w-full h-full"
            onLoadingStatusChange={(status) => {
              if (status === "error") setError(true);
            }}
          />
        ) : null}

        {/* Fallback Initials */}
        <AvatarFallback className="bg-primary/10 text-primary font-bold w-full h-full flex items-center justify-center">
          {fallbackContent}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}
