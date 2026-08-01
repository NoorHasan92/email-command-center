# Inbox Sentinel Security Documentation

## 1. Authentication Architecture

- **Provider:** Auth.js (NextAuth v5)
- **Strategies:** Google OAuth, Credentials (Email + Password).
- **Flow:**
  1. Credentials registration triggers an email verification loop via Resend.
  2. Users cannot access protected routes until `emailVerified` is populated.
  3. All successful and failed authentications are tracked in the `AuditLog`.
  4. Consecutive failed authentications trigger an Account Lockout mechanism.

## 2. Threat Model & Mitigations

| Threat | Mitigation |
| -------- | ------------ |
| Brute Force / Credential Stuffing | Argon2id hashing + Account Lockout (5 attempts limits). |
| Cross-Site Scripting (XSS) | React escapes all output + Strict CSP Headers + `HttpOnly` Cookies. |
| Cross-Site Request Forgery (CSRF) | Auth.js double-submit cookie patterns + SameSite=Lax. |
| Session Hijacking | Database-backed sessions. Users can actively view and revoke devices. |
| Data Breach (Token Theft) | All OAuth access/refresh tokens and TOTP secrets are AES-GCM encrypted at rest. |

## 3. Encryption Strategy

The `services/security/encryption.ts` service acts as the central encryption authority.

- **Algorithm:** AES-256-GCM.
- **Key Management:** Uses a master `ENCRYPTION_KEY` environment variable.
- **Prisma Extension:** The application uses a Prisma client extension in `server/repositories/` to automatically encrypt sensitive strings (like `refresh_token`, `access_token`) on write, and decrypt on read, abstracting the complexity from the rest of the application.

## 4. Password Policy

- **Hashing:** Argon2id (memory-hard, resistant to GPU acceleration).
- **Complexity:** Enforced via `zxcvbn-ts` to ensure users pick mathematically complex passwords rather than just relying on generic regex rules.
- **Reset Flow:** Generates a cryptographically secure, unpredictable, short-lived (1 hour) `PasswordResetToken` that invalidates immediately upon use.

## 5. Session Management

- **Type:** Database sessions (enforced even for Credentials).
- **Metadata:** Each session parses the `User-Agent` to store user-friendly `deviceType`, `browser`, and `os` to aid the user in identifying unauthorized sessions on the Dashboard.
- **Concurrency:** Users can have multiple concurrent sessions across different devices and selectively revoke them.

## 6. Audit Logging

Every mutation related to identity is logged in the `AuditLog` table:

- `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`, `PASSWORD_CHANGED`, `PASSWORD_RESET`, `PROFILE_UPDATED`, `ACCOUNT_LOCKED`.
- Includes `ipAddress`, `userAgent`, and contextual `metadata`.

## 7. Future Security Roadmap

- **TOTP (2FA):** Database models are primed for TOTP. Future implementation will allow users to register an authenticator app.
- **Rate Limiting (Redis):** While account lockout handles identity-specific brute forcing, general API rate limiting will be integrated using Redis for IP-based protection as the platform scales.
- **Passkeys (WebAuthn):** Integration for biometric login.
