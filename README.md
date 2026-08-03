# 🛡️ Inbox Sentinel

**Inbox Sentinel** is an advanced, AI-powered email intelligence platform and Chief of Staff. It continuously monitors your incoming emails (both Inbox and Spam), intelligently categorizes them, identifies critical opportunities, deadlines, and required actions, and actively notifies you via WhatsApp or Telegram so that you never miss a high-priority message.

Built with a premium SaaS design language, Inbox Sentinel features a modern, fluid user interface complete with micro-animations, glass-morphism, and responsive floating layouts.

---

## ✨ Core Features

- **🧠 AI-Powered Email Analysis:** Automatically parses incoming emails, extracting intent, urgency, deadlines, and required actions using advanced AI models.
- **⚡ Real-Time Notifications:** Pushes instant alerts to WhatsApp or Telegram for high-priority emails based on your custom rules.
- **🛡️ Spam & Cold Outreach Filtering:** Intelligently separates cold pitches, promotional emails, and newsletters from critical correspondence.
- **⚙️ Custom Rules Engine:** Create highly specific conditions (e.g., "If sender is CEO and contains 'urgent', send WhatsApp alert").
- **🎨 Premium SaaS Interface:** Features a stunning "floating" application shell, animated sidebars, interactive theme toggles, and beautifully designed settings panels.
- **👤 Seamless Google Integration:** Authenticate via Google OAuth, automatically sync your Google Profile Avatar, and connect your Gmail accounts securely.

---

## 🛠️ Technology Stack

**Frontend:**

- **Next.js 15 (App Router)** - React framework for server-side rendering and static generation.
- **TypeScript** - For type-safe code throughout the stack.
- **Tailwind CSS v4** - Utility-first styling with custom premium themes.
- **Framer Motion** - Fluid spring animations and layout transitions.
- **shadcn/ui** - Highly customizable, accessible React components.
- **Recharts** - Beautiful, responsive data visualization.

**Backend & Data:**

- **Prisma ORM** - Type-safe database access.
- **PostgreSQL** - Primary relational database.
- **Auth.js (NextAuth)** - Secure authentication, OAuth, and session management.
- **Zod** - Schema declaration and validation.

---

## 🏛️ Project Architecture

The repository is structured using a feature-based architecture pattern to ensure scalability and separation of concerns:

- `app/` - Next.js App Router definitions, pages, layouts, and API routes.
- `components/` - Shared UI elements, forms, and layout shells (Sidebar, Header, `UserAvatar`).
- `core/` - The heart of the application. Contains the AI pipeline logic (Collector, Analyzer, Decision engine, and Notifier).
- `features/` - Domain-specific frontend logic and React components.
- `server/` - Server Actions and database repository layers.
- `services/` - External API integrations (Gmail, WhatsApp, Telegram, AI Providers).
- `config/` - Centralized application routing, theme, and authentication configurations.
- `prisma/` - Database schema and migration files.

---

## 🔄 The AI Processing Pipeline

Inbox Sentinel operates on a highly optimized 4-step pipeline:

1. **📥 Collector:** Securely connects to the user's Gmail via OAuth and fetches unread emails via webhooks or cron jobs.
2. **🧠 Analyzer:** Passes the raw email content through an AI layer to determine intent, sentiment, urgency, and categorize it (e.g., *Meeting Request*, *Invoice*, *Cold Pitch*).
3. **⚖️ Decision Engine:** Evaluates the AI's findings against the user's custom **Rules Builder** configuration to decide if a notification is warranted.
4. **🚀 Notifier:** If the rules pass, it dispatches a highly formatted, actionable alert directly to the user's WhatsApp or Telegram.

---

## 💎 Premium UI Design System

The application utilizes a bespoke design system intended to feel like a top-tier modern SaaS product:

- **Floating Application Shell:** The main content area and sidebar float above a subtle, animated ambient background, providing breathing room and a modern aesthetic.
- **Dynamic Sidebar:** A Framer Motion-powered navigation panel that smoothly collapses and expands using spring physics, featuring hover-reveal tooltips.
- **Card-Based Settings:** A fully overhauled profile and settings dashboard utilizing glass-morphism, distinct columns, and real-time form validation via `sonner` toasts.
- **Native Avatar Syncing:** A robust `<UserAvatar />` component that synchronizes directly with Google OAuth via JWT tokens, including skeleton loading states and animated gradient fallbacks.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- PostgreSQL database (local or hosted like Supabase/Neon)
- A Google Cloud Console project (for OAuth and Gmail API)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/inbox-sentinel.git
   cd inbox-sentinel
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file and fill in your values.

   ```bash
   cp .env.example .env
   ```

   *Key variables required:*
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `AUTH_SECRET`: A secure random string for NextAuth.
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: For authentication and Gmail integration.

4. **Initialize the Database:**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the Development Server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 📜 Available Scripts

- `npm run dev`: Starts the Next.js development server with Turbopack.
- `npm run build`: Compiles and optimizes the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint to identify and fix code issues.
- `npm run db:push`: Pushes Prisma schema changes to the database.
- `npm run db:studio`: Opens the Prisma Studio visual database editor.

---

## 🤝 Contributing

Contributions are welcome! If you'd like to help improve Inbox Sentinel:

1. Fork the repository.
2. Create a new feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

*Designed and engineered for maximum email efficiency.*
