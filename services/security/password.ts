import * as argon2 from "argon2";
import zxcvbn from "zxcvbn";
import "server-only";

/**
 * Hashes a password using Argon2id with recommended OWASP settings
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4,
  });
}

/**
 * Verifies a plain text password against an Argon2 hash
 */
export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch (error) {
    return false;
  }
}

/**
 * Evaluates password strength using zxcvbn
 * @returns { score: number (0-4), feedback: object, isStrongEnough: boolean }
 */
export function validatePasswordStrength(password: string, userInputs: string[] = []) {
  const result = zxcvbn(password, userInputs);
  return {
    score: result.score,
    feedback: result.feedback,
    // Require a minimum score of 3 for production SaaS
    isStrongEnough: result.score >= 3,
  };
}
