# 🛡️ Inbox Sentinel — Full Architectural Analysis

## Executive Summary

**Inbox Sentinel** is a production-grade, AI-powered email intelligence platform built as a Next.js 15 monolith. It monitors Gmail inboxes in real-time, runs every incoming email through a 6-stage AI pipeline (Gemini/OpenAI), and dispatches actionable alerts to WhatsApp and Telegram. The codebase demonstrates advanced full-stack engineering across authentication, security, AI orchestration, and external integrations.

**Maturity Level:** Beta / High-End MVP — ready for early users, not yet for 1,000+ concurrent users.

---

## 1. Architecture Overview

```
Gmail Inbox
  → Pub/Sub Webhook → POST /api/webhooks/gmail
  → Queue to DB → WebhookEvent Table
  → Background Job → webhook-processor.ts
  → Gmail API Sync → GmailAdapter.syncAccount
  → Ingest → EmailIngestionService
  → Insert → Email Table (status: SYNCED)
  → Trigger → email-processor.ts

6-Stage AI Pipeline:
  01 Collector → 02 Normalizer → 03 Prefilter → 04 Analyzer (Gemini AI) → 05 Decision Engine → 06 Notifier
                                       ↓ (skip)
                                    SKIPPED

Notifier outputs → WhatsApp (Meta API / Baileys) + Telegram Bot API
```

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15.5.22 (App Router, Turbopack) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS v4, shadcn/ui, Framer Motion, Recharts |
| Database | PostgreSQL (Neon Serverless) via Prisma ORM v5.22 |
| Auth | NextAuth v5 (beta) — Google OAuth + Credentials |
| AI | Google GenAI SDK (gemini-3.5-flash primary, 6 fallback models), OpenAI (gpt-4o-mini) |
| Notifications | WhatsApp Cloud API (Meta), Baileys (WA Web socket), Telegram Bot API, Resend (email) |
| Security | AES-256 token encryption, Argon2 password hashing, CSP headers, audit logging |
| Deployment | Vercel (serverless) |

---

## 3. Core Pipeline Deep-Dive

### Stage 1: Collector (core/pipeline/01-collector.ts)
- Persists raw email into DB via upsert (idempotent)
- Unique constraint on [emailAccountId, providerMessageId] prevents duplicates
- Tracks per-stage latency metrics in pipelineMetrics JSON column

### Stage 2: Normalizer (core/pipeline/02-normalizer.ts)
- HTML → plain text via html-to-text
- Token-safe truncation (30k char limit ≈ 8k tokens)
- Custom cleanEmailText() strips tracking URLs

### Stage 3: Prefilter (core/pipeline/03-prefilter.ts)
- Heuristic filter: unsubscribe, no-reply@, marketing@, newsletter@
- Saves AI token costs by skipping obvious junk

### Stage 4: Analyzer (core/pipeline/04-analyzer.ts)
- AI-powered: summary, category, urgency score, action items, sentiment
- Idempotent: checks for existing EmailAnalysis before calling AI
- Smart truncation: first 2,000 + last 1,000 chars for long emails
- Full telemetry: model, tokens, latency, finish reason, prompt version

### Stage 5: Decision Engine (core/pipeline/05-decision.ts)
- Evaluates AI results against user NotificationRule thresholds
- Logic: score ≥ threshold OR (action required AND threshold ≤ 80)
- Fail-safe: returns empty array on error

### Stage 6: Notifier (core/pipeline/06-notifier.ts)
- Dispatches to WhatsApp/Telegram
- Idempotent: checks NotificationLog before sending
- Pluggable provider registry: Record<string, INotificationProvider>

---

## 4. Key Architectural Patterns

### Interface-Driven Design (core/interfaces/)
- IAIProvider → GeminiAdapter, OpenAIAdapter
- IEmailProvider → GmailAdapter
- INotificationProvider → WhatsAppAdapter, TelegramAdapter, BaileysAdapter

### Transparent Encryption (server/repositories/db.ts)
- Prisma Client Extensions auto-encrypt/decrypt OAuth tokens on every DB operation
- Applied to Account and EmailAccount models

### Resilience
- Exponential backoff in Gmail, WhatsApp, Telegram adapters
- 7-model fallback chain in GeminiAdapter
- 3-retry limit on email processing and webhook events
- Dead-letter queue via WebhookEvent table
- In-memory concurrency lock (isProcessing flag)

### WhatsApp Dual-Engine (services/whatsapp/whatsapp.provider.ts)
- Priority: Baileys (free) → Meta Cloud API (paid) failover
- Custom Postgres session store bypasses Vercel read-only FS

### Security
- CSP: frame-ancestors 'none', object-src 'none', HSTS
- Account lockout: 5 failures → 15-min lock
- Audit trail for all auth events
- Argon2 password hashing
- Zod validation on AI outputs

---

## 5. Database Schema (prisma/schema.prisma)

16 models, 12 enums, 494 lines:
- User / Account / Session: NextAuth identity
- EmailAccount: Encrypted Gmail OAuth tokens + sync state
- WebhookEvent: Dead-letter queue for Pub/Sub payloads
- Email: Core entity (status tracked via EmailStatus enum)
- EmailAnalysis: 1:1 with Email — AI results + telemetry
- NotificationRule: User threshold config per channel
- NotificationLog: Delivery receipts with retry counts
- SenderProfile: Per-sender reputation tracking
- UserLearningRule: User feedback rules
- AIEvalRun/AIEvalResult: Built-in AI benchmarking framework
- WhatsAppSession: Baileys auth state in Postgres
- AuditLog: Security event tracking

---

## 6. Background Jobs (jobs/)

- email-processor.ts: Sweeps SYNCED emails → runs through 6-stage pipeline
- webhook-processor.ts: Sweeps PENDING webhook events → syncs via Gmail API → ingests
- watch-renewer.ts: Renews Gmail push watches before 7-day expiration (with jitter)

---

## 7. API Routes (app/api/)

- POST /api/webhooks/gmail — validates Google JWTs, queues payload
- POST /api/webhooks/telegram — bot commands + account linking
- POST /api/webhooks/whatsapp — Meta webhook receipts
- GET /api/integrations/whatsapp/sse — real-time QR code for Baileys
- Various auth, health, feedback, rules routes

---

## 8. Known Critical Bugs

1. **Decision Engine field mismatch** (05-decision.ts:48): Uses `analysis.score` and `analysis.isActionRequired` but model has `urgencyScore` and `requiresAction`. Runtime crash.

2. **PENDING status not in enum** (01-collector.ts:42): Sets status: "PENDING" but EmailStatus enum doesn't include PENDING. Prisma validation error.

3. **Double encryption** (gmail.adapter.ts:73-91): persistTokens() manually encrypts, Prisma extension also auto-encrypts. Tokens get double-encrypted.

4. **OpenAI adapter incompatible** (openai.adapter.ts): Returns different shape than GeminiAdapter. Imports non-existent types from IAIProvider. Unusable with current pipeline.

---

## 9. Technical Debt

- No dedicated message queue (in-memory locks won't scale across serverless instances)
- Prefilter too aggressive ("unsubscribe" in body skips legitimate emails)
- withRetry utility duplicated 3 times across adapters
- Hardcoded AI provider string in analyzer
- WhatsApp API version v19.0 is outdated
- watch-renewer uses console.log instead of pino logger
- ESLint/TS errors ignored in build config
- No E2E tests

---

## 10. Feature Status

- ✅ Google OAuth + Credentials Auth (with linking, lockout, verification)
- ✅ Gmail Sync (push + history API, incremental + resumable)
- ✅ AI Analysis — Gemini (telemetry, fallbacks, Zod validation)
- ⚠️ AI Analysis — OpenAI (interface mismatch, broken)
- ✅ WhatsApp Notifications (dual-engine Baileys + Meta)
- ✅ Telegram Notifications (MarkdownV2 formatted)
- ✅ Custom Notification Rules
- ✅ Dashboard + Inbox UI
- ⚠️ Analytics (partial — token cost viz)
- ⚠️ Learning Engine (schema only, no feedback loop)
- ❌ Billing/Subscriptions (no Stripe)
- ❌ E2E Tests

---

## 11. Key File Map

| Purpose | Path |
|---|---|
| Pipeline stages | core/pipeline/01-collector.ts through 06-notifier.ts |
| Interfaces | core/interfaces/IAIProvider.ts, IEmailProvider.ts, INotificationProvider.ts |
| Gemini AI | services/ai/gemini.adapter.ts |
| OpenAI | services/ai/openai.adapter.ts |
| AI prompt | services/ai/prompt-builder.ts |
| AI schema | services/ai/schema.ts |
| Gmail sync | services/email/gmail.adapter.ts |
| Email ingestion | services/email/email-ingestion.service.ts |
| WhatsApp | services/whatsapp/whatsapp.provider.ts, whatsapp.adapter.ts, baileys.adapter.ts |
| Telegram | services/telegram/telegram.adapter.ts |
| DB + encryption | server/repositories/db.ts |
| Auth | config/auth.ts, config/auth.config.ts |
| Jobs | jobs/email-processor.ts, webhook-processor.ts, watch-renewer.ts |
| DB schema | prisma/schema.prisma |
| Security | services/security/encryption.ts, password.ts, audit.ts |
| Middleware | middleware.ts |
| Config | next.config.ts, config/env.ts, config/routes.ts |
