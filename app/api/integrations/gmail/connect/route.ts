import { NextResponse, NextRequest } from "next/server";
import { google } from "googleapis";
import crypto from "crypto";
import { auth } from "@/config/auth";
import { logSecurityEvent } from "@/services/security/audit";
import { cookies } from "next/headers";
import { getBaseUrl } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const isLinkFlow = req.nextUrl.searchParams.get("isLinkFlow") === "true";
    const session = await auth();
    
    if (!session?.user?.id && !isLinkFlow) {
      return NextResponse.redirect(new URL("/login", getBaseUrl()));
    }

    if (session?.user?.id) {
      await logSecurityEvent("GMAIL_CONNECT_STARTED", session.user.id);
    }

    const clientId = process.env.AUTH_GOOGLE_ID;
    const clientSecret = process.env.AUTH_GOOGLE_SECRET;
    const baseUrl = getBaseUrl();
    const redirectUri = `${baseUrl}/api/integrations/gmail/callback`;
    console.log(`[GMAIL_CONNECT] baseUrl=${baseUrl} redirectUri=${redirectUri}`);

    if (!clientId || !clientSecret) {
      console.error("Missing Google OAuth credentials");
      return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // Requirement 3: Generate a cryptographically secure state value
    const state = crypto.randomBytes(32).toString("hex");

    // Store state in a secure HttpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set("gmail_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60, // 10 minutes
      path: "/",
      sameSite: "lax",
    });

    // Generate the URL
    // Requirement 2: Request minimum required scopes
    const scopes = [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.modify", // To save smart drafts
      "https://www.googleapis.com/auth/calendar.events", // To create calendar events
      "https://www.googleapis.com/auth/userinfo.email",
      "openid",
      "email",
    ];

    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent", // Force consent to ensure a refresh token is provided
      scope: scopes,
      state: state,
    });

    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    console.error("Error initiating Gmail OAuth:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
