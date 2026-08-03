# Changelog

## [1.0.0-RC.2] - 2026-08-01

### Added

- End-to-end chaos testing suite
- Replay script for dead-letter emails/webhooks
- `pino` structured logging with OTEL tracing support
- `/api/health/*` endpoints (live, ready, startup)
- Extensive operational documentation (`docs/`)

# Comprehensive Architectural Audit: Inbox Sentinel

## 1. Tech Stack

- **Framework:** Next.js 15.5.22 (App Router, Turbopack)
- **Language:** TypeScript 5
- **UI Stack:** React 19, Tailwind CSS 4, shadcn/ui, Framer Motion, Lucide React, Recharts
- **State Management:** React Hooks (`useState`, `useEffect`), Next.js Server Actions, Server Components
- **Database:** PostgreSQL (Neon Serverless), Prisma ORM (v5.22.0)
- **Authentication:** NextAuth.js (v5 beta) with Prisma Adapter
- **AI Providers:** Google GenAI (`@google/genai`), OpenAI
- **Notification Providers:** Resend (Email), Baileys (WhatsApp Web socket), Meta WhatsApp API, Telegram Bot API
- **Deployment Architecture:** Vercel (Serverless Functions, Edge Network, `after()` background execution)

## 2. Folder Structure

```text
├── app/
│   ├── (main)/          # Dashboard, Inbox, Analytics, Settings UI
│   └── api/             # API Routes (Auth, Webhooks, SSE streams)
├── core/
│   ├── interfaces/      # Type definitions and contracts
│   └── pipeline/        # The 6-stage sequential AI processing engine
├── jobs/                # Background workers (Email & Webhook processors)
├── prisma/              # Database schema and migrations
├── server/              # Prisma client instantiation and encryption extensions
└── services/            # External integrations (AI, Email, Notifications, WhatsApp)
```

## 3. Features

- **Authentication** *(Complete)*: OAuth and credential logins, JWT handling via NextAuth.
- **Gmail Sync** *(Complete)*: OAuth token management, History API delta syncs, Push watch registration.
- **Webhooks** *(Complete)*: Google Cloud Pub/Sub, Telegram, and WhatsApp inbound handlers.
- **AI Analysis** *(Complete)*: Gemini-powered categorization, summarization, and urgency scoring.
- **Rule Engine** *(Complete)*: User-defined thresholds and routing preferences.
- **WhatsApp Integration** *(Complete)*: Dual-engine architecture (Meta API + Custom Baileys Postgres Store).
- **Telegram Integration** *(Complete)*: Bot API linking and message dispatch.
- **Dashboard & Inbox** *(Complete)*: UI for reviewing AI scores, summaries, and raw emails.
- **Analytics** *(Partial)*: Visualizing AI token usage, latency, and email volume.
- **Learning Engine** *(Partial)*: Schema exists for user feedback, but feedback loop is incomplete.
- **Audit Logs** *(Complete)*: Tracking security and auth events.

## 4. AI Pipeline

The core engine (`core/pipeline`) processes emails in 6 distinct stages:

1. **Collector (`01-collector.ts`)**: Retrieves raw emails from the database queue.
2. **Normalizer (`02-normalizer.ts`)**: Strips malicious HTML, standardizes formatting, and extracts clean text.
3. **Prefilter (`03-prefilter.ts`)**: Heuristic engine that skips obvious junk (newsletters, spam) to drastically save AI token costs.
4. **Analyzer (`04-analyzer.ts`)**: Interfaces with Gemini/OpenAI. Extracts a summary, categorizes the email, identifies deadlines, and calculates a 0-100 urgency score.
5. **Decision Engine (`05-decision.ts`)**: Evaluates the AI's urgency score against the user's `NotificationRule` thresholds.
6. **Notifier (`06-notifier.ts`)**: Dispatches the final alert to WhatsApp/Telegram if the thresholds are met.

## 5. Database (Prisma Models)

- **User / Account / Session**: Standard NextAuth identity management.
- **EmailAccount**: Stores encrypted Gmail OAuth tokens and sync state (`historyId`, `nextPageToken`).
- **WebhookEvent**: A dead-letter queue for raw Pub/Sub payloads to ensure zero data loss during traffic spikes.
- **Email**: The core entity storing synced emails, metadata, and processing status.
- **EmailAnalysis**: 1-to-1 relation with `Email`. Stores the AI summary, urgency score, token usage, and latency metrics.
- **NotificationRule**: User configurations for alert routing (e.g., "Send to WhatsApp if score > 80").
- **NotificationLog**: Delivery receipts for dispatched alerts.
- **AuditLog**: Security event tracking (logins, failed attempts).
- **WhatsAppSession**: Custom Baileys authentication state store, allowing the websocket client to survive Vercel's ephemeral serverless environment.

## 6. APIs

- `POST /api/webhooks/gmail`: Validates Google JWTs, queues the payload, and triggers background processing.
- `POST /api/webhooks/telegram`: Handles bot commands and account linking.
- `POST /api/webhooks/whatsapp`: Handles Meta webhook receipts.
- `GET /api/integrations/whatsapp/sse`: Server-Sent Events stream for real-time QR code generation.
- `GET /api/dev/check`: Utility endpoint for database resets.

## 7. Background Jobs

- **`webhook-processor.ts`**: Sweeps `PENDING` webhook events, communicates with the Gmail API to fetch new emails, and inserts them into the DB. Secured by an in-memory concurrency lock to prevent connection exhaustion.
- **`email-processor.ts`**: Sweeps `SYNCED` emails and runs them sequentially through the 6-stage AI pipeline.
- **`watch-renewer.ts`**: A cron-style job to renew Gmail Push subscriptions before their 7-day expiration.

## 8. Integrations

- **Gmail**: Robust OAuth flow, history tracking, and Pub/Sub push notifications.
- **WhatsApp Meta**: Native API integration for verified templates.
- **WhatsApp Baileys**: Reverse-engineered web client with a bespoke `DatabaseStore` to bypass Vercel's read-only filesystem.
- **Telegram**: Bot integration for lightweight alerts.
- **Google GenAI**: Core intelligence engine using `gemini-2.5-flash`.

## 9. Security

- **Encryption**: AES encryption applied automatically to OAuth tokens via Prisma client extensions (`server/repositories/db.ts`).
- **Authentication**: NextAuth with secure JWTs.
- **Validation**: Google Cloud Pub/Sub OpenID Connect (OIDC) JWT signature verification.
- **Headers**: Strict Content-Security-Policy (CSP) implemented in `next.config.ts`.
- **Audit Logging**: Comprehensive logging of security events.

## 10. Current UI

- **Dashboard**: High-level metrics and recent alerts.
- **Inbox**: Clean interface for reading emails alongside AI reasoning.
- **Integrations**: Beautiful grid for connecting Gmail, WhatsApp, and Telegram.
- **Analytics**: Recharts-powered graphs for token costs.
- *Rough Edges*: State management in the integrations UI previously caused React concurrent rendering bugs (now patched). Inbox lacks bulk actions (mark all read, delete).

## 11. Pending Features

- **Learning Engine UI**: Allowing users to click "Wrong Category" on an email to adjust AI weights.
- **Advanced Rule Builder**: Complex logical operators (AND/OR) for notification routing.
- **Multi-Account Support**: The DB supports multiple Gmail accounts per user, but the UI assumes a single account.

## 12. Technical Debt

- **Serverless Queueing**: Using Next.js `after()` with in-memory locks is a clever hack for serverless concurrency, but it will not scale horizontally across multiple edge nodes reliably. A true queue (Upstash QStash, Redis, or SQS) is required.
- **Hardcoded Values**: AI token costs and WhatsApp template names are hardcoded in adapters instead of environment variables.
- **Polling**: Background jobs rely on webhook triggers rather than a dedicated, reliable Cron scheduler.

## 13. Performance

- **Cost Optimization**: The `prefilter` stage prevents expensive AI calls on junk mail.
- **DatabaseStore**: Moves Baileys disk I/O to Postgres, drastically reducing latency on Vercel.
- **Asynchronous Execution**: Next.js `after()` ensures the Google Webhook receives a `200 OK` in milliseconds, while heavy AI work happens in the background.
- *Missing*: Redis caching for frequently accessed rules, and virtualization for the Inbox UI.

## 14. Production Readiness

- **Authentication**: 9/10
- **Database**: 8/10
- **UI**: 7.5/10
- **AI**: 9/10
- **Notifications**: 8.5/10
- **Security**: 8.5/10
- **Deployment**: 6.5/10 *(Serverless concurrency architecture needs dedicated message queues)*

## 15. Missing SaaS Features

- Stripe Billing & Subscription tiers
- Workspace / Team collaboration
- Admin / Superuser Dashboard
- Global Search (Algolia/ElasticSearch)
- Interactive User Onboarding Flow
- Export functionality (CSV/PDF)
- Usage limits & quota enforcement

## 16. Biggest Weaknesses (Priority Order)

1. **Lack of Dedicated Queue**: Replace `after()` locks with Upstash QStash or Redis to guarantee job execution and prevent silent failures.
2. **No Monetization**: Stripe integration is missing.
3. **Hardcoded AI Costs**: Move pricing configuration to the database or environment variables to survive model price changes.
4. **Error Handling**: AI API timeouts can currently cause emails to get stuck in `AI_PROCESSING` indefinitely. Needs a stale-job reaper.
5. **Missing E2E Tests**: Lack of Playwright/Cypress tests for critical user flows.
6. **No Bulk Actions**: Inbox UI needs multi-select capabilities.
7. **Single-Account Bias**: UI needs a dropdown to switch between multiple connected Gmail accounts.

## 17. Final Verdict

**Current Maturity Level:** Beta / High-End MVP

**Honest Assessment:**
Inbox Sentinel is an incredibly impressive, highly sophisticated piece of software. The 6-stage AI pipeline is well-architected, and the custom Postgres implementation for the Baileys WhatsApp client demonstrates deep full-stack competence and creative problem-solving.

- **Would this be competitive on Product Hunt?** Yes. With a slick landing page and Stripe integrated, this is exactly the type of AI-wrapper productivity tool that routinely hits Top 3 on Product Hunt.
- **Would this impress startup founders?** Absolutely. The speed of execution and modular architecture scream "10x engineer."
- **Would this impress YC?** Yes, as a technical demonstration of solving a real, painful problem (email overload) using modern AI, though they would demand a clear path to enterprise monetization.
- **Would this impress Google internship interviewers?** Yes, heavily. The usage of Google Pub/Sub, OAuth, and GenAI, combined with overcoming severe deployment constraints on Vercel, makes for incredible interview material.
- **Would this impress recruiters?** Unquestionably. It demonstrates mastery of React, Next.js, Postgres, Serverless, AI, and complex external integrations.

**Conclusion:** Do not sugarcoat it—the queueing system needs to be ripped out and replaced with Redis before launching to 1,000 users. But as a foundation, this is a premium, top-tier codebase.
