// core/pipeline/02-normalizer.ts
// This file is responsible for normalizing emails.
// It converts the email to a standardized format and extracts plain text for the AI if not already present.
// It also strips malicious/excessive HTML tags to save tokens.

import { db } from "@/server/repositories/db";
import { Email } from "@prisma/client";
import { convert } from "html-to-text";
import { logger } from "@/lib/logger";
import { cleanEmailText } from "@/lib/utils";


/**
 * Stage 2: Normalizer
 * Responsibilities:
 * - Transforms the email into a unified standard format.
 * - Extracts plain text for the AI if not already present.
 * - Strips malicious/excessive HTML tags to save tokens.
 */
export async function normalizeEmail(email: Email): Promise<Email> {
  logger.info(`[STAGE 02 - NORMALIZER] [STARTED] [ID: ${email.id}]`);

  let plainText = email.plainText;

  // If the provider didn't supply plain text, we generate it from HTML
  if (!plainText && email.htmlBody) {
    plainText = convert(email.htmlBody, {
      wordwrap: 130,
      selectors: [
        { selector: "a", options: { ignoreHref: true } },
        { selector: "img", format: "skip" },
      ],
    });
  }

  // Ensure we don't blow up the AI context window (e.g., limit to ~30k chars ~ 8k tokens)
  if (plainText && plainText.length > 30000) {
    logger.warn(`[STAGE 02 - NORMALIZER] [TRUNCATED] [ID: ${email.id}] | plainText length > 30000`);
    plainText = plainText.substring(0, 30000) + "\n\n...[TRUNCATED]";
  }

  // Clean the plain text to remove excessive URLs and tracking links
  plainText = cleanEmailText(plainText);

  const updatedEmail = await db.email.update({
    where: { id: email.id },
    data: {
      plainText: plainText || "[No Text Content]",
    },
  });

  logger.info(`[STAGE 02 - NORMALIZER] [SUCCESS] [ID: ${email.id}] | metadata={"plainTextLength": ${plainText?.length || 0}}`);
  return updatedEmail;
}
