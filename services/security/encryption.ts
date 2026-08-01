// services/security/encryption.ts
// AES-256-GCM symmetric encryption utility.

import crypto from "crypto";
import "server-only";
import { env } from "@/config/env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

function getKey(salt: Buffer) {
  if (!env.ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is not defined in environment variables");
  }
  return crypto.pbkdf2Sync(env.ENCRYPTION_KEY, salt, 100000, 32, "sha256");
}

/**
 * Encrypts a plaintext string using AES-256-GCM
 */
export function encrypt(text: string | null | undefined): string | null {
  if (!text) return null;

  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = getKey(salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Buffer format: SALT (64) + IV (16) + AUTH_TAG (16) + CIPHERTEXT
  const result = Buffer.concat([salt, iv, tag, encrypted]);

  return result.toString("base64");
}

/**
 * Decrypts a previously encrypted base64 string
 */
export function decrypt(encryptedData: string | null | undefined): string | null {
  if (!encryptedData) return null;

  try {
    const buffer = Buffer.from(encryptedData, "base64");

    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, TAG_POSITION);
    const tag = buffer.subarray(TAG_POSITION, ENCRYPTED_POSITION);
    const encrypted = buffer.subarray(ENCRYPTED_POSITION);

    const key = getKey(salt);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    return decipher.update(encrypted) + decipher.final("utf8");
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Decryption failed");
  }
}
