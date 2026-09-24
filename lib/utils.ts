// lib/utils.ts
// Utility functions for merging Tailwind classes.

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBaseUrl(req?: Request | { headers: Headers | Map<string, string> | Record<string, string | string[] | undefined> } | null): string {
  if (req) {
    let host: string | null = null;
    let proto: string | null = null;

    if ("headers" in req && typeof (req as any).headers?.get === "function") {
      const h = (req as any).headers;
      host = h.get("x-forwarded-host") || h.get("host");
      proto = h.get("x-forwarded-proto");
    } else if ("headers" in req && (req as any).headers) {
      const h = (req as any).headers;
      host = (h["x-forwarded-host"] || h["host"]) as string;
      proto = h["x-forwarded-proto"] as string;
    }

    if (host) {
      const cleanHost = host.split(",")[0].trim();
      const cleanProto = proto?.split(",")[0].trim() || (cleanHost.includes("localhost") || cleanHost.includes("127.0.0.1") ? "http" : "https");
      return `${cleanProto}://${cleanHost}`;
    }
  }

  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.NODE_ENV === "production") return "https://mail.tars.homes";
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}


/**
 * Cleans up raw plain text emails by stripping out massive URLs, 
 * especially those injected by html-to-text or tracking link wrappers.
 * E.g., `( https://ablink... )` or `< https://... >`
 */
export function cleanEmailText(text: string | null | undefined): string {
  if (!text) return "";
  
  let cleaned = text;

  // 1. Remove URLs wrapped in parentheses or brackets (common from html-to-text)
  // e.g. ( https://something... ) or [ http://something... ] or < http://something... >
  cleaned = cleaned.replace(/[([<]\s*https?:\/\/[^\s)\]>]+[\s)\]>]/gi, '');

  // 2. Remove standalone massive URLs (longer than 100 chars)
  cleaned = cleaned.replace(/https?:\/\/\S{100,}/gi, '[TRUNCATED_URL]');

  // 3. Clean up multiple empty lines left behind
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');

  return cleaned.trim();
}

/**
 * Calculates the estimated cost of an AI generation.
 */
export function calculateEstimatedCost(promptTokens: number, completionTokens: number, model: string): number {
  let promptCostPer1k = 0;
  let completionCostPer1k = 0;

  if (model.includes("flash")) {
    promptCostPer1k = 0.000075;
    completionCostPer1k = 0.0003;
  } else if (model.includes("pro")) {
    promptCostPer1k = 0.00125;
    completionCostPer1k = 0.005;
  }

  const promptCost = (promptTokens / 1000) * promptCostPer1k;
  const completionCost = (completionTokens / 1000) * completionCostPer1k;
  
  return promptCost + completionCost;
}
