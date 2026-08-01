// middleware.ts
// Edge middleware for protecting authenticated routes.

import NextAuth from "next-auth";
import { authConfig } from "@/config/auth.config";

// Use the official Auth.js middleware approach
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
