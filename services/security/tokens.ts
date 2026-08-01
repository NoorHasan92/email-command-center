import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import "server-only";

/**
 * Generates a high-entropy, cryptographically secure token.
 * Suitable for password resets and email verification.
 */
export function generateSecureToken(): string {
  // Combine a UUID with 32 bytes of cryptographic randomness (hex encoded)
  return `${uuidv4()}-${crypto.randomBytes(32).toString("hex")}`;
}

export function generateSessionToken(): string {
  return crypto.randomUUID();
}
