// config/env.ts
// Zod schema for environment variable validation.

import { z } from "zod";

// Auto-detect base URL from Vercel environment variables
function getDefaultAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  AUTH_SECRET: z.string().min(32).optional(), // Used by NextAuth
  ENCRYPTION_KEY: z.string().min(32).optional(), // Used for token encryption
  RESEND_API_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default(getDefaultAppUrl()),
  EMAIL_FROM: z.string().default("Inbox Sentinel <noreply@tars.homes>"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.NODE_ENV === "production") {
    if (!data.DATABASE_URL) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["DATABASE_URL"], message: "DATABASE_URL is required in production" });
    }
    if (!data.AUTH_SECRET) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["AUTH_SECRET"], message: "AUTH_SECRET is required in production" });
    }
    if (!data.ENCRYPTION_KEY) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["ENCRYPTION_KEY"], message: "ENCRYPTION_KEY is required in production" });
    }
  }
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
