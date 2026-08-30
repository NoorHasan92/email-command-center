import { db } from "@/server/repositories/db";
import { Email, EmailAnalysis } from "@prisma/client";
import { logger } from "@/lib/logger";
import { google } from "googleapis";
import { decrypt, encrypt } from "@/services/security/encryption";
import { getBaseUrl } from "@/lib/utils";

/**
 * Stage 5: Pro/Ultra Features Execution
 * Handles creating calendar events and saving smart drafts automatically or for review.
 */
export async function executeProActions(email: Email, analysis: EmailAnalysis) {
  logger.info(`[STAGE 05 - ACTIONS] [STARTED] [ID: ${email.id}]`);
  
  try {
    const emailAccount = await db.emailAccount.findUnique({
      where: { id: email.emailAccountId },
      include: { user: true }
    });

    if (!emailAccount || !emailAccount.user) {
      logger.warn(`[STAGE 05 - ACTIONS] [SKIPPED] [ID: ${email.id}] - No valid account/user`);
      return;
    }

    const user = emailAccount.user;
    const preferences: any = user.appPreferences || {};

    // 1. Google Calendar Automation
    if (analysis.extractedEvents && Array.isArray(analysis.extractedEvents) && analysis.extractedEvents.length > 0) {
      if (preferences.calendarAutomation === "AUTO") {
        logger.info(`[STAGE 05 - ACTIONS] [CALENDAR] Auto-adding ${analysis.extractedEvents.length} events...`);
        await createGoogleCalendarEvents(emailAccount, analysis.extractedEvents);
        logger.info(`[STAGE 05 - ACTIONS] [CALENDAR] Events added successfully.`);
      } else {
        logger.info(`[STAGE 05 - ACTIONS] [CALENDAR] User preference is ASK. Events stored for manual review.`);
      }
    }

    // 2. Smart Drafts
    if (analysis.smartDraft && preferences.smartDrafts === true) {
      logger.info(`[STAGE 05 - ACTIONS] [DRAFT] Saving smart draft...`);
      await createGmailDraft(email, emailAccount, analysis.smartDraft);
      logger.info(`[STAGE 05 - ACTIONS] [DRAFT] Draft saved successfully.`);
    }

  } catch (error: any) {
    logger.error(`[STAGE 05 - ACTIONS] [FAILED] [ID: ${email.id}] | error=${error.message}`);
    // We don't throw here to avoid failing the whole pipeline if an action fails.
    // The analysis is still valid and notifications should still fire.
  }
}

/**
 * Creates events in Google Calendar
 */
async function createGoogleCalendarEvents(emailAccount: any, events: any[]) {
  const oauth2Client = getOAuth2Client(emailAccount);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  for (const ev of events) {
    if (!ev.title || !ev.startTime || !ev.endTime) continue;

    try {
      await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: ev.title,
          location: ev.location || undefined,
          description: ev.description || "Added by AI Email Sentinel",
          start: { dateTime: new Date(ev.startTime).toISOString() },
          end: { dateTime: new Date(ev.endTime).toISOString() },
        }
      });
    } catch (err: any) {
      if (err.code === 403 || err.message?.toLowerCase().includes("insufficient permission")) {
        logger.warn(`[STAGE 05 - ACTIONS] [CALENDAR] Missing Calendar Scope for event '${ev.title}'. User must re-authenticate with Pro scopes.`);
      } else {
        logger.error(`[STAGE 05 - ACTIONS] [CALENDAR] Failed to create event '${ev.title}': ${err.message}`);
      }
    }
  }
}

/**
 * Creates a Draft in Gmail
 */
async function createGmailDraft(email: Email, emailAccount: any, draftText: string) {
  const oauth2Client = getOAuth2Client(emailAccount);
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  // Construct RFC 2822 email message
  const toMatch = email.from.match(/<([^>]+)>/) || [null, email.from];
  const to = toMatch[1] || email.from;
  const rawSubject = email.subject || "No Subject";
  const subject = rawSubject.startsWith("Re:") ? rawSubject : `Re: ${rawSubject}`;
  
  const messageParts = [
    `To: ${to}`,
    `Subject: ${subject}`,
    `In-Reply-To: ${email.providerMessageId}`,
    `References: ${email.providerMessageId}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'MIME-Version: 1.0',
    '',
    draftText
  ];
  
  const rawMessage = messageParts.join('\n');
  const encodedMessage = Buffer.from(rawMessage).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  try {
    await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw: encodedMessage,
          threadId: email.threadId || undefined
        }
      }
    });
  } catch (err: any) {
    if (err.code === 403 || err.message?.toLowerCase().includes("insufficient permission")) {
      logger.warn(`[STAGE 05 - ACTIONS] [DRAFT] Missing Gmail Modify Scope. User must re-authenticate with Pro scopes.`);
    } else {
      logger.error(`[STAGE 05 - ACTIONS] [DRAFT] Failed to create draft: ${err.message}`);
    }
  }
}

function getOAuth2Client(emailAccount: any) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID,
    process.env.AUTH_GOOGLE_SECRET,
    `${getBaseUrl()}/api/auth/callback/google`
  );

  const decryptedAccess = emailAccount.accessToken ? decrypt(emailAccount.accessToken) : null;
  const decryptedRefresh = emailAccount.refreshToken ? decrypt(emailAccount.refreshToken) : null;

  oauth2Client.setCredentials({
    access_token: decryptedAccess,
    refresh_token: decryptedRefresh,
    expiry_date: emailAccount.expiresAt ? emailAccount.expiresAt * 1000 : undefined
  });

  // Automatically save refreshed tokens
  oauth2Client.on('tokens', async (tokens) => {
    logger.info(`[STAGE 05 - ACTIONS] Refreshing Google OAuth tokens for ${emailAccount.emailAddress}`);
    const data: any = {};
    if (tokens.access_token) data.accessToken = encrypt(tokens.access_token);
    if (tokens.refresh_token) data.refreshToken = encrypt(tokens.refresh_token);
    if (tokens.expiry_date) data.expiresAt = Math.floor(tokens.expiry_date / 1000);

    await db.emailAccount.update({
      where: { id: emailAccount.id },
      data
    });
  });

  return oauth2Client;
}
