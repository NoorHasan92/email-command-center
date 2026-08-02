// config/auth.config.ts
// Edge-compatible NextAuth configuration (providers & callbacks).

import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;
      
      const isPublicRoute = 
        path === "/" || 
        path.startsWith("/login") || 
        path.startsWith("/register") || 
        path.startsWith("/verify") ||
        path.startsWith("/api/auth"); // NextAuth routes must be public

      if (!isPublicRoute && !path.startsWith("/api/")) {
        // Any non-public, non-API route requires login
        if (isLoggedIn) return true;
        return false; // Redirect to signIn page
      } else if (isLoggedIn && (path.startsWith("/login") || path.startsWith("/register"))) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
