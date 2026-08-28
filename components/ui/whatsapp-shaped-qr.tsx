"use client";

import { useEffect, useRef, useState } from "react";
import QRCodeLib from "qrcode";

// WhatsApp logo SVG path (outer silhouette only — the chat bubble shape)
const WHATSAPP_PATH = "M12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413A11.815 11.815 0 0 0 12.05 0Z";

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

    // The WhatsApp SVG path is defined in a 24x24 viewBox.
    // Scale it to fill our canvas size with some padding.
    const padding = size * 0.02;
    const shapeScale = (size - padding * 2) / 24;

    maskCtx.save();
    maskCtx.translate(padding, padding);
    maskCtx.scale(shapeScale, shapeScale);
    const path = new Path2D(WHATSAPP_PATH);
    maskCtx.fillStyle = "black";
    maskCtx.fill(path);
    maskCtx.restore();

    // Read the mask pixel data for hit-testing
    const maskImageData = maskCtx.getImageData(0, 0, size, size);
    const maskPixels = maskImageData.data;

    function isInsideShape(x: number, y: number): boolean {
      // Check if a pixel coordinate falls inside the WhatsApp shape
      const px = Math.round(x);
      const py = Math.round(y);
      if (px < 0 || px >= size || py < 0 || py >= size) return false;
      const idx = (py * size + px) * 4;
      return maskPixels[idx + 3] > 128; // Alpha > 50%
    }

    // 3. Clear canvas
    ctx.clearRect(0, 0, size, size);
    if (bgColor !== "transparent") {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, size, size);
    }

    // 4. Calculate dot layout
    // We need the QR modules to fit INSIDE the WhatsApp shape.
    // The WhatsApp bubble's main circular body spans roughly from
    // x: 0.5 to 23.5, y: 0 to 21.5 in the 24x24 viewBox.
    // We'll center the QR grid within the shape.
    const qrPadding = size * 0.08; // padding from shape edges
    const qrAreaSize = size - qrPadding * 2;
    const dotSize = qrAreaSize / moduleCount;
    const offsetX = qrPadding;
    const offsetY = qrPadding;

    // 5. Render each QR module as a dot, but ONLY if it's inside the shape
    ctx.fillStyle = dotColor;

    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        const isDark = moduleData[row * moduleCount + col];
        if (!isDark) continue;

        const cx = offsetX + col * dotSize + dotSize / 2;
        const cy = offsetY + row * dotSize + dotSize / 2;

        // Check if the center of this dot is inside the WhatsApp shape
        if (!isInsideShape(cx, cy)) continue;

        // Determine if this module is part of a finder pattern
        const isFinderPattern =
          (row < 7 && col < 7) || // top-left
          (row < 7 && col >= moduleCount - 7) || // top-right
          (row >= moduleCount - 7 && col < 7); // bottom-left

        if (isFinderPattern) {
          // Draw finder pattern modules as solid squares for reliable scanning
          ctx.fillRect(
            offsetX + col * dotSize,
            offsetY + row * dotSize,
            dotSize,
            dotSize
          );
        } else {
          // Draw regular modules as rounded dots
          const radius = dotSize * 0.38;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 6. Also render the "quiet" dots outside QR data to fill the shape
    // These are random decorative dots that make the shape more visible
    // but won't interfere with scanning (they're outside the QR grid)
    const decorDotSize = dotSize * 0.35;
    const gridStep = dotSize;

    for (let y = 0; y < size; y += gridStep) {
      for (let x = 0; x < size; x += gridStep) {
        // Skip the QR data area
        if (
          x >= offsetX &&
          x <= offsetX + qrAreaSize &&
          y >= offsetY &&
          y <= offsetY + qrAreaSize
        ) {
          continue;
        }

        const cx = x + gridStep / 2;
        const cy = y + gridStep / 2;

        if (!isInsideShape(cx, cy)) continue;

        // Random 50% fill for decorative dots
        if (Math.random() > 0.5) {
          ctx.beginPath();
          ctx.arc(cx, cy, decorDotSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

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
