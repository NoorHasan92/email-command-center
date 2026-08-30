// lib/utils.ts
// Utility functions for merging Tailwind classes.

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
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
