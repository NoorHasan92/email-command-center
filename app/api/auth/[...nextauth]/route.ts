// app/api/auth/[...nextauth]/route.ts
// Handles NextAuth GET/POST requests for authentication.

import { handlers } from "@/config/auth";
export const { GET, POST } = handlers;
