import { logger } from "./logger";

const requiredSecrets = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "GMAIL_CLIENT_ID",
  "GMAIL_CLIENT_SECRET",
  "GMAIL_REDIRECT_URI",
  "WHATSAPP_PHONE_ID",
  "WHATSAPP_ACCESS_TOKEN",
  "OPENAI_API_KEY"
];

export function validateSecrets() {
  const missing = [];
  const defaultPlaceholders = ["your_secret_here", "placeholder", "xxx"];

  for (const secret of requiredSecrets) {
    const val = process.env[secret];
    if (!val) {
      missing.push(secret);
      continue;
    }

    if (defaultPlaceholders.some(p => val.toLowerCase().includes(p))) {
      missing.push(`${secret} (using placeholder)`);
    }
  }

  if (missing.length > 0) {
    logger.fatal({ missing }, "CRITICAL: Missing or invalid required environment variables.");
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Startup failed due to missing secrets: ${missing.join(", ")}`);
    }
  } else {
    logger.info("All required secrets validated successfully.");
  }
}
