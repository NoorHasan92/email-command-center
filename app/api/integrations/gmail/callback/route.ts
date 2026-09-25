import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/utils";
import { google } from "googleapis";
import { auth } from "@/config/auth";
import { db } from "@/server/repositories/db";
import { encrypt } from "@/services/security/encryption";
import { logSecurityEvent } from "@/services/security/audit";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

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
        return NextResponse.redirect(new URL("/login", getBaseUrl(request)));
      }
      userId = session.user.id;
    }

    const existingAccounts = userId ? await db.emailAccount.count({ where: { userId } }) : 0;
    const errorRedirect = (err: string) => {
      const baseUrl = getBaseUrl(request);
      if (existingAccounts === 0) {
        return NextResponse.redirect(new URL(`/onboarding?error=${encodeURIComponent(err)}`, baseUrl));
      }
      return NextResponse.redirect(new URL(`/settings?error=${encodeURIComponent(err)}`, baseUrl));
    };

    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      await logSecurityEvent("GMAIL_CONNECT_FAILED", userId, { reason: "User denied consent", error });
      return errorRedirect("ConsentDenied");
    }

    if (!code || !state) {
      await logSecurityEvent("GMAIL_CONNECT_FAILED", userId, { reason: "Missing code or state" });
      return errorRedirect("InvalidCallback");
    }

    // Requirement 3: Verify CSRF state: either matching cookie OR verified HMAC signature
    let isStateValid = false;
    const savedState = cookieStore.get("gmail_oauth_state")?.value;

    if (savedState && savedState === state) {
      isStateValid = true;
    } else {
      // Fallback: Verify cryptographic HMAC signature for mobile browsers that drop Lax cookies
      try {
        const secret = process.env.AUTH_SECRET || "inbox_sentinel_secret";
        const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
        const { p: payload, s: signature } = decoded;
        const expectedSig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
        if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
          const [stateUserId, timestampStr] = payload.split(":");
          const ts = parseInt(timestampStr, 10);
          if (Date.now() - ts <= 15 * 60 * 1000) {
            if (stateUserId === userId || stateUserId === "link" || stateUserId === "anonymous") {
              isStateValid = true;
            }
          }
        }
      } catch {
        isStateValid = false;
      }
    }

    if (!isStateValid) {
      await logSecurityEvent("GMAIL_CONNECT_FAILED", userId, { reason: "CSRF State mismatch" });
      return errorRedirect("StateMismatch");
    }

    // Clear state cookie
    cookieStore.delete("gmail_oauth_state");

    const clientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;
    const baseUrl = getBaseUrl(request);
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
      return errorRedirect("NoEmailAddress");
    }

    const activeUser = await db.user.findUnique({ where: { id: userId } });
    if (!activeUser) {
      return errorRedirect("UserNotFound");
    }

    // Automatically sync profile picture from connected Gmail if available
    if (userInfo.data.picture && (!activeUser.image || activeUser.image !== userInfo.data.picture)) {
      await db.user.update({
        where: { id: userId },
        data: { image: userInfo.data.picture }
      }).catch(err => console.error("Failed to sync profile picture from connected Gmail:", err));
    }

    const isUltra = activeUser.plan === "ULTRA" || activeUser.plan === "ADMIN";
    const isFirstAccount = existingAccounts === 0;
    const isEmailMismatch = activeUser.email.toLowerCase() !== gmailAddress.toLowerCase();

    if (isEmailMismatch) {
      if (isFirstAccount) {
        // The user is onboarding with their first inbox and selected a Gmail different from their initial registration.
        // Check if another user already owns this email in the database
        const existingTargetUser = await db.user.findUnique({
          where: { email: gmailAddress.toLowerCase() }
        });

        if (existingTargetUser && existingTargetUser.id !== userId) {
          await logSecurityEvent("GMAIL_CONNECT_FAILED", userId, { 
            reason: "Account already registered", 
            targetEmail: gmailAddress 
          });
          const baseUrl = getBaseUrl(request);
          return NextResponse.redirect(new URL(`/onboarding?error=AccountAlreadyRegistered&targetEmail=${encodeURIComponent(gmailAddress)}`, baseUrl));
        }

        // Adopt this Gmail as the primary account email
        await db.user.update({
          where: { id: userId },
          data: {
            email: gmailAddress.toLowerCase(),
            name: userInfo.data.name || activeUser.name,
            image: userInfo.data.picture || activeUser.image,
            emailVerified: new Date(),
          }
        });
        
        await logSecurityEvent("PROFILE_UPDATED", userId, { 
          note: "Adopted connected Gmail during initial onboarding",
          previousEmail: activeUser.email,
          newEmail: gmailAddress.toLowerCase()
        });
      } else if (!isUltra) {
        await logSecurityEvent("GMAIL_CONNECT_FAILED", userId, { 
          reason: "Email mismatch (Ultra required)", 
          expected: activeUser.email, 
          received: gmailAddress 
        });
        return errorRedirect("EmailMismatchUltraRequired");
      }
    }

    if (!tokens.access_token) {
      await logSecurityEvent("GMAIL_CONNECT_FAILED", userId, { reason: "No access token received" });
      return errorRedirect("NoAccessToken");
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
      
      if (tokens.scope && tokens.scope.includes("calendar.events")) {
        const appPrefs = activeUser?.appPreferences ? (typeof activeUser.appPreferences === 'object' ? activeUser.appPreferences : JSON.parse(activeUser.appPreferences as string)) : {};
        await db.user.update({
          where: { id: userId },
          data: {
            appPreferences: {
              ...appPrefs,
              hasCalendarScope: true
            }
          }
        });
      }

      await logSecurityEvent("GMAIL_CONNECTED", userId, { emailAddress: gmailAddress });
    } catch (e) {
      const error = e as Error;
      console.error("Database transaction failed:", error);
      await logSecurityEvent("GMAIL_CONNECT_FAILED", userId, { reason: "Database error", error: error.message });
      return errorRedirect("DatabaseError");
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

    // Revalidate paths to prevent stale layouts or cached redirects
    revalidatePath("/", "layout");
    revalidatePath("/dashboard");
    revalidatePath("/onboarding");
    revalidatePath("/settings");
    revalidatePath("/integrations");

    // Determine redirect logic
    const totalAccounts = await db.emailAccount.count({ where: { userId } });
    
    // If we just granted calendar scopes, take them to the preferences tab to manage it
    if (tokens.scope && tokens.scope.includes("calendar.events")) {
      return NextResponse.redirect(new URL("/settings?tab=preferences", getBaseUrl(request)));
    }

    const targetUrl = totalAccounts === 1 ? "/dashboard" : "/integrations";
    const redirectResponse = NextResponse.redirect(new URL(targetUrl, getBaseUrl(request)));

    // Ensure selected account cookie is set so the header switcher is in sync
    redirectResponse.cookies.set("selected_account_id", emailAccount.id, {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60,
    });

    return redirectResponse;

  } catch (error) {
    console.error("Error in Gmail Callback:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
