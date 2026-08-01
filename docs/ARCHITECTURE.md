# Inbox Sentinel Architecture

## Overview
Inbox Sentinel is a Next.js (App Router) based system designed to read incoming Gmail, process it via OpenAI for decision logic (Consequence Engine), and forward critical alerts to WhatsApp via Meta Cloud API.

## Core Components
- **Webhooks**: `app/api/webhooks/` receives push notifications from Gmail Pub/Sub and WhatsApp Webhooks.
- **Jobs Engine**: `jobs/` directory houses the cron jobs for renewing watches and sweeping unprocessed emails.
- **Pipeline (`core/pipeline/`)**: The processing logic consists of 6 stages:
  1. `Collector`: Fetches raw email from Gmail.
  2. `Normalizer`: Cleans HTML into plaintext.
  3. `Prefilter`: Fast-paths newsletters and spam away from AI.
  4. `Analyzer`: OpenAI structures the email (Score, Action, Deadlines).
  5. `Decision`: Applies user learning rules.
  6. `Notifier`: Dispatches WhatsApp messages.
- **Database**: PostgreSQL (Neon) with Prisma ORM.

## Tracing & Logging
- Utilizes `pino` structured logging.
- Fully compatible with OpenTelemetry for production tracing.
