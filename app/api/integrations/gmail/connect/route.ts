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
      return NextResponse.redirect(new URL("/login", getBaseUrl(req)));
    }

    if (session?.user?.id) {
      await logSecurityEvent("GMAIL_CONNECT_STARTED", session.user.id);
    }

    const clientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;
    const baseUrl = getBaseUrl(req);
    const redirectUri = `${baseUrl}/api/integrations/gmail/callback`;
    console.log(`[GMAIL_CONNECT] baseUrl=${baseUrl} redirectUri=${redirectUri}`);

    if (!clientId || !clientSecret) {
      console.error("Missing Google OAuth credentials");
      return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // Requirement 3: Generate a cryptographically secure, signed state value
    const secret = process.env.AUTH_SECRET || "inbox_sentinel_secret";
    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(16).toString("hex");
    const targetUserId = session?.user?.id || (isLinkFlow ? "link" : "anonymous");
    const payload = `${targetUserId}:${timestamp}:${randomHex}`;
    const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    const state = Buffer.from(JSON.stringify({ p: payload, s: signature })).toString("base64url");

    // Store state in a secure HttpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set("gmail_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60, // 15 minutes
      path: "/",
      sameSite: "lax",
    });

    // Generate the URL
    // Requirement 2: Request minimum required scopes
    const isProScopes = req.nextUrl.searchParams.get("proScopes") === "true";
    const loginHint = req.nextUrl.searchParams.get("login_hint");
    
    const scopes = [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
      "openid",
      "email",
    ];

    if (isProScopes) {
      scopes.push("https://www.googleapis.com/auth/gmail.modify"); // To save smart drafts
      scopes.push("https://www.googleapis.com/auth/calendar.events"); // To create calendar events
    }

    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent", // Force consent to ensure a refresh token is provided
      scope: scopes,
      state: state,
      ...(loginHint && { login_hint: loginHint }),
    });

    const res = NextResponse.redirect(authorizationUrl);
    res.cookies.set("gmail_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60,
      path: "/",
      sameSite: "lax",
    });

    return res;
  } catch (error) {
    console.error("Error initiating Gmail OAuth:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
