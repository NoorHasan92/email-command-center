# Inbox Sentinel

Inbox Sentinel is an AI-powered email intelligence platform that continuously analyzes incoming emails (Inbox and Spam), identifies important opportunities, deadlines, required actions, and risks, then notifies the user through WhatsApp so that no critical email is ever missed.

## Tech Stack
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Prisma ORM
- PostgreSQL
- Zod & React Hook Form

## Getting Started

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Copy `.env.example` to `.env` and configure your `DATABASE_URL`.
4. Run `npm run dev` to start the development server.

## Architecture

This project follows a feature-based architecture pattern for scalability:
- `app/`: Next.js App Router pages and layouts.
- `components/`: Global UI and layout components.
- `features/`: Feature-specific logic (e.g. email processing, notifications).
- `core/`: The main processing pipeline (Collector, Analyzer, Decision, Notifications).
- `services/`: External integrations (Gmail, WhatsApp, AI).
- `server/`: Server Actions and Data queries.
- `config/`: Centralized application configuration.

## Available Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint to check for code issues.
