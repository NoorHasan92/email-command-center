import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/utils";
import { google } from "googleapis";
import { auth } from "@/config/auth";
import { db } from "@/server/repositories/db";
import { encrypt } from "@/services/security/encryption";
import { logSecurityEvent } from "@/services/security/audit";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const linkToken = cookieStore.get("gmail_link_token")?.value;
    
    let userId: string | undefined = undefined;
    let linkRequest: any = null;

    if (linkToken) {
      linkRequest = await db.accountLinkRequest.findUnique({ where: { linkToken } });
      if (linkRequest && linkRequest.status === "PENDING_OAUTH" && new Date() < linkRequest.expiresAt) {
        userId = linkRequest.userId;
      }
    }

    if (!userId) {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.redirect(new URL("/login", getBaseUrl()));
      }
      userId = session.user.id;
    }

    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      await logSecurityEvent("GMAIL_CONNECT_FAILED", userId, { reason: "User denied consent", error });
      return NextResponse.redirect(new URL("/settings?error=ConsentDenied", getBaseUrl()));
    }

    if (!code || !state) {
      await logSecurityEvent("GMAIL_CONNECT_FAILED", userId, { reason: "Missing code or state" });
      return NextResponse.redirect(new URL("/settings?error=InvalidCallback", getBaseUrl()));
    }

    // Requirement 3: Verify CSRF state
    const savedState = cookieStore.get("gmail_oauth_state")?.value;

    if (!savedState || state !== savedState) {
      await logSecurityEvent("GMAIL_CONNECT_FAILED", userId, { reason: "CSRF State mismatch" });
      return NextResponse.redirect(new URL("/settings?error=StateMismatch", getBaseUrl()));
    }

    // Clear state cookie
    cookieStore.delete("gmail_oauth_state");

    const clientId = process.env.AUTH_GOOGLE_ID;
    const clientSecret = process.env.AUTH_GOOGLE_SECRET;
    const baseUrl = getBaseUrl();
    const redirectUri = `${baseUrl}/api/integrations/gmail/callback`;
    console.log(`[GMAIL_CALLBACK] baseUrl=${baseUrl} redirectUri=${redirectUri}`);

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Requirement 4: Verify Gmail email matches authenticated user
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const gmailAddress = userInfo.data.email;

    if (!gmailAddress) {
      await logSecurityEvent("GMAIL_CONNECT_FAILED", userId, { reason: "Could not fetch Gmail address" });
      return NextResponse.redirect(new URL("/settings?error=NoEmailAddress", getBaseUrl()));
    }

    const activeUser = await db.user.findUnique({ where: { id: userId } });
    
    // ULTRA plan users can link multiple/different Gmail accounts.
    // Others must link the Gmail matching their login.
    const isUltra = activeUser?.plan === "ULTRA" || activeUser?.plan === "ADMIN";
    if (!activeUser || (!isUltra && activeUser.email.toLowerCase() !== gmailAddress.toLowerCase())) {
      await logSecurityEvent("GMAIL_CONNECT_FAILED", userId, { reason: "Email mismatch (Ultra required)", expected: activeUser?.email, received: gmailAddress });
      return NextResponse.redirect(new URL("/settings?error=EmailMismatchUltraRequired", getBaseUrl()));
    }

    if (!tokens.access_token) {
      await logSecurityEvent("GMAIL_CONNECT_FAILED", userId, { reason: "No access token received" });
      return NextResponse.redirect(new URL("/settings?error=NoAccessToken", getBaseUrl()));
    }

    // Requirement 6: Encrypt tokens
    const encryptedAccessToken = encrypt(tokens.access_token);
    
    // We only encrypt and store the refresh token if provided. We do not overwrite an existing one with null.
    const updateData: { accessToken: string; expiresAt: number | null; syncStatus: any; refreshToken?: string } = {
      accessToken: encryptedAccessToken as string,
      expiresAt: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
      syncStatus: "PENDING",
    };

    if (tokens.refresh_token) {
      updateData.refreshToken = encrypt(tokens.refresh_token) as string;
    }

    const providerAccountId = userInfo.data.id || gmailAddress;

    // Requirement 7: Wrap EmailAccount upsert in a Prisma transaction
    let emailAccount;
    try {
      emailAccount = await db.$transaction(async (tx) => {
        const account = await tx.emailAccount.upsert({
          where: { provider_providerAccountId: { provider: "gmail", providerAccountId } },
          create: {
            userId,
            provider: "gmail",
            providerAccountId,
            emailAddress: gmailAddress,
            accessToken: encryptedAccessToken as string,
            refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
            expiresAt: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
          },
          update: updateData,
        });

        // Ensure this account belongs to this user (in case of race conditions during upsert updates)
        if (account.userId !== userId) {
          throw new Error("Account belongs to another user");
        }

        return account;
      });
      await logSecurityEvent("GMAIL_CONNECTED", userId, { emailAddress: gmailAddress });
    } catch (e) {
      const error = e as Error;
      console.error("Database transaction failed:", error);
      await logSecurityEvent("GMAIL_CONNECT_FAILED", userId, { reason: "Database error", error: error.message });
      return NextResponse.redirect(new URL("/settings?error=DatabaseError", getBaseUrl()));
    }

    // Requirement 8: Call getProfile(), Save historyId, Register Watch()
    try {
      const gmail = google.gmail({ version: "v1", auth: oauth2Client });
      
      // Get Profile for historyId
      const profile = await gmail.users.getProfile({ userId: "me" });
      const historyId = profile.data.historyId?.toString();

      // Register Watch
      // Assuming a Pub/Sub topic is defined in env, otherwise we use a placeholder that will fail
      const topicName = process.env.GMAIL_PUBSUB_TOPIC; 
      
      let watchExpiration = null;

      if (topicName) {
        const watchRes = await gmail.users.watch({
          userId: "me",
          requestBody: {
            topicName: topicName,
            labelIds: ["INBOX"],
          },
        });
        if (watchRes.data.expiration) {
          watchExpiration = new Date(parseInt(watchRes.data.expiration, 10));
          await logSecurityEvent("GMAIL_WATCH_REGISTERED", userId, { topicName, expiration: watchExpiration });
        }
      } else {
        throw new Error("GMAIL_PUBSUB_TOPIC not configured");
      }

      await db.emailAccount.update({
        where: { id: emailAccount.id },
        data: {
          lastHistoryId: historyId,
          watchExpiration: watchExpiration,
          syncStatus: "ACTIVE",
        }
      });
    } catch (watchError) {
      const error = watchError as Error;
      console.error("Failed to register Gmail watch:", error);
      await logSecurityEvent("GMAIL_WATCH_FAILED", userId, { error: error.message });
      
      await db.emailAccount.update({
        where: { id: emailAccount.id },
        data: {
          syncStatus: "ERROR",
        }
      });
    }

    if (linkRequest) {
      await db.accountLinkRequest.update({
        where: { id: linkRequest.id },
        data: { status: "LINKED" }
      });
      cookieStore.delete("gmail_link_token");
    }

    // Determine redirect logic
    const totalAccounts = await db.emailAccount.count({ where: { userId } });
    if (totalAccounts === 1) {
      return NextResponse.redirect(new URL("/dashboard", getBaseUrl()));
    } else {
      return NextResponse.redirect(new URL("/settings?tab=integrations", getBaseUrl()));
    }

  } catch (error) {
    console.error("Error in Gmail Callback:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
