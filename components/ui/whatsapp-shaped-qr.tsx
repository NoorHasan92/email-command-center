"use client";

import { useEffect, useRef, useState } from "react";
import QRCodeLib from "qrcode";

// WhatsApp logo SVG path (outer silhouette only — the chat bubble shape)
const WHATSAPP_PATH = "M12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413A11.815 11.815 0 0 0 12.05 0Z";

// WhatsApp phone handset icon (the inner phone receiver from the logo)
const PHONE_HANDSET_PATH = "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347Z";

interface WhatsAppQRProps {
  value: string;
  size?: number;
  dotColor?: string;
  bgColor?: string;
}

export default function WhatsAppShapedQR({
  value,
  size = 280,
  dotColor = "#16a34a",
  bgColor = "transparent",
}: WhatsAppQRProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!value || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High-DPI scaling
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    // 1. Generate the QR matrix
    const qr = QRCodeLib.create(value, { errorCorrectionLevel: "H" });
    const modules = qr.modules;
    const moduleCount = modules.size;
    const moduleData = modules.data;

    // 2. Build the shape mask on an offscreen canvas
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = size;
    maskCanvas.height = size;
    const maskCtx = maskCanvas.getContext("2d");
    if (!maskCtx) return;

    const padding = size * 0.02;
    const shapeScale = (size - padding * 2) / 24;

    maskCtx.save();
    maskCtx.translate(padding, padding);
    maskCtx.scale(shapeScale, shapeScale);
    const path = new Path2D(WHATSAPP_PATH);
    maskCtx.fillStyle = "black";
    maskCtx.fill(path);
    maskCtx.restore();

    const maskImageData = maskCtx.getImageData(0, 0, size, size);
    const maskPixels = maskImageData.data;

    function isInsideShape(x: number, y: number): boolean {
      const px = Math.round(x);
      const py = Math.round(y);
      if (px < 0 || px >= size || py < 0 || py >= size) return false;
      const idx = (py * size + px) * 4;
      return maskPixels[idx + 3] > 128;
    }

    // 3. Clear canvas
    ctx.clearRect(0, 0, size, size);
    if (bgColor !== "transparent") {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, size, size);
    }

    // 4. Calculate QR layout — make QR SMALLER so it fits entirely inside the shape
    // The WhatsApp bubble is roughly circular. We shrink the QR to ~60% of canvas
    // so ALL modules (including all 3 finder patterns) are fully inside the bubble.
    const qrRenderSize = size * 0.58;
    const dotSize = qrRenderSize / moduleCount;
    // Center the QR grid in the bubble's visual center (slightly above geometric center)
    const offsetX = (size - qrRenderSize) / 2;
    const offsetY = (size - qrRenderSize) / 2 - size * 0.02;

    // 5. Render ALL QR modules — every single one, no shape filtering
    // This guarantees the QR code is 100% scannable.
    ctx.fillStyle = dotColor;

    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        const isDark = moduleData[row * moduleCount + col];
        if (!isDark) continue;

        const cx = offsetX + col * dotSize + dotSize / 2;
        const cy = offsetY + row * dotSize + dotSize / 2;

        // Determine if this module is part of a finder pattern
        const isFinderPattern =
          (row < 7 && col < 7) ||
          (row < 7 && col >= moduleCount - 7) ||
          (row >= moduleCount - 7 && col < 7);

        if (isFinderPattern) {
          ctx.fillRect(
            offsetX + col * dotSize,
            offsetY + row * dotSize,
            dotSize,
            dotSize
          );
        } else {
          const radius = dotSize * 0.4;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 6. Fill the WhatsApp shape OUTSIDE the QR grid with decorative noise dots
    // This creates the visual silhouette of the WhatsApp logo around the QR code.
    const decorRadius = dotSize * 0.35;
    const step = dotSize;

    // Use a seeded pseudo-random for consistent rendering across re-renders
    let seed = 42;
    function seededRandom() {
      seed = (seed * 16807 + 0) % 2147483647;
      return seed / 2147483647;
    }

    // QR grid bounding box (with a small margin so decorative dots don't touch QR)
    const qrLeft = offsetX - dotSize * 0.5;
    const qrRight = offsetX + qrRenderSize + dotSize * 0.5;
    const qrTop = offsetY - dotSize * 0.5;
    const qrBottom = offsetY + qrRenderSize + dotSize * 0.5;

    for (let y = 0; y < size; y += step) {
      for (let x = 0; x < size; x += step) {
        const cx = x + step / 2;
        const cy = y + step / 2;

        // Skip if inside QR grid area
        if (cx >= qrLeft && cx <= qrRight && cy >= qrTop && cy <= qrBottom) continue;

        // Only draw if inside the WhatsApp shape
        if (!isInsideShape(cx, cy)) continue;

        // ~55% fill for decorative dots
        if (seededRandom() > 0.45) {
          ctx.beginPath();
          ctx.arc(cx, cy, decorRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 7. Draw the phone handset icon in the center
    // Clear a circular area behind the icon
    const centerX = size / 2;
    const centerY = size / 2 - size * 0.02;
    const clearRadius = size * 0.09;

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, clearRadius, 0, Math.PI * 2);
    ctx.clip();
    ctx.clearRect(centerX - clearRadius, centerY - clearRadius, clearRadius * 2, clearRadius * 2);
    ctx.restore();

    // Draw the phone handset
    const iconScale = (size - padding * 2) / 24;
    ctx.save();
    ctx.translate(padding, padding);
    ctx.scale(iconScale, iconScale);
    const phonePath = new Path2D(PHONE_HANDSET_PATH);
    ctx.fillStyle = dotColor;
    ctx.fill(phonePath);
    ctx.restore();

    setReady(true);
  }, [value, size, dotColor, bgColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}
      style={{ width: size, height: size }}
    />
  );
}
