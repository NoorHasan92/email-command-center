// config/auth.ts
// Main NextAuth configuration with Prisma adapter.

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/server/repositories/db";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        // Extend session with role
        // @ts-expect-error - role is not typed in default Session
        session.user.role = user.role;
      }
      return session;
    },
  },
});
