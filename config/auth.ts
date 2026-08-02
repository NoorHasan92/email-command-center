// config/auth.ts
// Main NextAuth configuration with Prisma adapter.

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/server/repositories/db";
import { authConfig } from "./auth.config";
import { verifyPassword } from "@/services/security/password";
import { logSecurityEvent } from "@/services/security/audit";
import { getToken } from "next-auth/jwt";
import { cookies, headers } from "next/headers";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.toString().toLowerCase();
        const user = await db.user.findUnique({ where: { email } });

        if (!user || user.isDeleted || !user.passwordHash) {
          await logSecurityEvent("LOGIN_FAILED", user?.id, { reason: "Invalid credentials or account deleted" });
          return null;
        }

        // Respect account lockout
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error("Account is locked. Please try again later.");
        }

        const isValid = await verifyPassword(user.passwordHash, credentials.password.toString());

        if (!isValid) {
          // Increment failed login attempts
          const attempts = user.failedLoginAttempts + 1;
          const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
          
          await db.user.update({
            where: { id: user.id },
            data: { 
              failedLoginAttempts: attempts,
              lockedUntil,
              lastFailedLoginAt: new Date()
            }
          });

          if (lockedUntil) {
            await logSecurityEvent("ACCOUNT_LOCKED", user.id);
            throw new Error("Too many failed attempts. Account locked for 15 minutes.");
          }
          await logSecurityEvent("LOGIN_FAILED", user.id, { reason: "Invalid password" });
          throw new Error("Invalid email or password.");
        }

        // Reject unverified users
        if (!user.emailVerified) {
          throw new Error("Please verify your email address before logging in.");
        }

        // Reset failed attempts on success
        await db.user.update({
          where: { id: user.id },
          data: { 
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date()
          }
        });
        
        await logSecurityEvent("LOGIN_SUCCESS", user.id);

        return user;
      }
    })
  ],
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (account && account.provider === "google") {
        const cookiesStore = await cookies();
        const headersStore = await headers();
        
        const req = {
          cookies: Object.fromEntries(cookiesStore.getAll().map(c => [c.name, c.value])),
          headers: Object.fromEntries(headersStore.entries()),
        } as any;
        
        // This resolves the token without importing `auth()` to prevent circular deps.
        // It correctly handles both development and production cookie names.
        const token = await getToken({ 
          req, 
          secret: process.env.AUTH_SECRET as string,
          secureCookie: process.env.NODE_ENV === "production",
          cookieName: process.env.NODE_ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token"
        });

        if (token && token.id) {
          const activeUserId = token.id as string;
          const googleEmail = profile?.email || user?.email;

          // Requirement 2: Verify Google profile email EXACTLY matches the authenticated user's email.
          const activeUser = await db.user.findUnique({ where: { id: activeUserId } });
          
          if (!activeUser || !googleEmail || activeUser.email.toLowerCase() !== googleEmail.toLowerCase()) {
            await logSecurityEvent("ACCOUNT_LINK_FAILED_EMAIL_MISMATCH", activeUserId, { provider: account.provider, googleEmail });
            return "/settings?error=EmailMismatch";
          }

          // Requirement 3: Verify providerAccountId is not already linked (Pre-check)
          const existingAccount = await db.account.findUnique({
            where: { provider_providerAccountId: { provider: account.provider, providerAccountId: account.providerAccountId } }
          });

          if (existingAccount) {
            await logSecurityEvent("ACCOUNT_LINK_FAILED_ALREADY_LINKED", activeUserId, { provider: account.provider });
            return "/settings?error=AccountAlreadyLinked";
          }

          // Return true so NextAuth continues its native lifecycle and fires events.linkAccount
          return true;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // @ts-expect-error - role is not typed
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        // @ts-expect-error - role is not typed
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  events: {
    async linkAccount(message) {
      // Triggered by NextAuth automatically after a successful linking operation in the adapter
      await logSecurityEvent("ACCOUNT_LINK_SUCCESS", message.user.id, { provider: message.account.provider });
    }
  }
});
