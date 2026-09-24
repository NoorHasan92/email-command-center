"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface AdminTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  title?: React.ReactNode;
  side?: "top" | "bottom";
  className?: string;
}

export function AdminTooltip({
  children,
  content,
  title,
  side = "top",
  className = "",
}: AdminTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placement: "top" | "bottom" } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 280;

    let targetLeft = rect.left + rect.width / 2;
    // Boundary clamp: keep at least 16px from viewport sides
    const minLeft = tooltipWidth / 2 + 16;
    const maxLeft = window.innerWidth - tooltipWidth / 2 - 16;
    targetLeft = Math.max(minLeft, Math.min(targetLeft, maxLeft));

    let placement = side;
    let targetTop = rect.top - 8;

    // If positioned at top but too close to window top, flip to bottom
    if (side === "top" && rect.top < 120) {
      placement = "bottom";
      targetTop = rect.bottom + 8;
    } else if (side === "bottom" && rect.bottom > window.innerHeight - 120) {
      placement = "top";
      targetTop = rect.top - 8;
    }

    setCoords({
      top: targetTop,
      left: targetLeft,
      placement,
    });
  }, [side]);

  const handleMouseEnter = () => {
    updatePosition();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`inline-block ${className}`}
      >
        {children}
      </div>

      {mounted &&
        isOpen &&
        coords &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              transform: coords.placement === "bottom" ? "translate(-50%, 0)" : "translate(-50%, -100%)",
              zIndex: 999999,
              pointerEvents: "none",
            }}
            className="w-72 p-3 bg-[#0a0a0a]/95 border border-white/20 text-slate-200 text-xs rounded-xl shadow-[0_10px_38px_-10px_rgba(0,0,0,0.8),0_10px_20px_-15px_rgba(0,0,0,0.7)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 text-left"
          >
            {title && (
              <div className="font-semibold text-white mb-1 flex items-center gap-1.5 text-[12px]">
                {title}
              </div>
            )}
            <div className="text-[11px] leading-relaxed text-slate-300">
              {content}
            </div>
            {/* Pointer arrow caret */}
            <div
              className={`absolute left-1/2 -translate-x-1/2 border-4 border-transparent ${
                coords.placement === "bottom"
                  ? "bottom-full border-b-[#0a0a0a]"
                  : "top-full border-t-[#0a0a0a]"
              }`}
            />
          </div>,
          document.body
        )}
    </>
  );
}
