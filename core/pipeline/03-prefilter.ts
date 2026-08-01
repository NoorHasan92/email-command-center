// core/pipeline/03-prefilter.ts
// This file is responsible for prefiltering emails using heuristic rules.

import { db } from "@/server/repositories/db";
import { Email } from "@prisma/client";
import { logger } from "@/lib/logger";


// Simple heuristic rules to detect newsletters or automated spam
const SKIP_PATTERNS = [
  /unsubscribe/i,
  /view in browser/i,
  /no-reply@/i,
  /noreply@/i,
  /marketing@/i,
  /newsletter@/i,
  /do not reply/i,
];

/**
 * Stage 3: PreFilter
 * Responsibilities:
 * - Cheap heuristic rules-engine to discard automated emails/newsletters.
 * - Saves expensive AI tokens.
 */
export async function prefilterEmail(email: Email): Promise<boolean> {
  logger.info(`[STAGE 03 - PREFILTER] [STARTED] [ID: ${email.id}]`);

  // Idempotency: If it's already SKIPPED, return true
  if (email.status === "SKIPPED") {
    logger.info(`[STAGE 03 - PREFILTER] [SKIPPED] [ID: ${email.id}] | Already marked as SKIPPED.`);
    return true;
  }

  let shouldSkip = false;
  let reason = "";

  // Check sender
  if (SKIP_PATTERNS.some((pattern) => pattern.test(email.from))) {
    shouldSkip = true;
    reason = "Sender matched automated pattern";
  }

  // Check body for unsubscribe links (common in marketing)
  if (!shouldSkip && email.plainText && SKIP_PATTERNS.some((pattern) => pattern.test(email.plainText!))) {
    shouldSkip = true;
    reason = "Body contains automated/marketing keywords";
  }

  if (shouldSkip) {
    logger.info(`[STAGE 03 - PREFILTER] [SKIPPED] [ID: ${email.id}] | metadata={"reason": "${reason}"}`);
    await db.email.update({
      where: { id: email.id },
      data: { status: "SKIPPED" },
    });
    return true;
  }

  logger.info(`[STAGE 03 - PREFILTER] [SUCCESS] [ID: ${email.id}] | Passed heuristic checks.`);
  return false;
}
