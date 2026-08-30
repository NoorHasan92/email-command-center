import { aiAnalysisSchema } from "./schema";

export function buildSystemPrompt(): string {
  return `You are an expert executive assistant and email analyzer.
Your task is to analyze incoming emails and extract structured intelligence based on the exact JSON schema provided.

Rules:
1. Always output strictly valid JSON matching the schema.
2. The "deadline" field must be an ISO 8601 string if one exists, otherwise null.
3. Be brutally honest with the "priority" and "urgencyScore". Don't classify everything as HIGH.
4. "requiresAction" should only be true if the user must actively do something (reply, sign, click, pay).
5. "priority" and "urgencyScore" MUST align. If Priority is HIGH/CRITICAL, urgencyScore must be >= 70. If Priority is LOW, urgencyScore must be < 40.
6. If the email requires a reply, generate a highly professional, concise, and helpful "smartDraft" in the tone of the user. Otherwise set to null.
7. If the email mentions a meeting, flight, reservation, or appointment, extract the details into "extractedEvents". Use ISO 8601 format for dates/times. If no year is provided, assume the current year.`;
}

export function buildUserPrompt(emailText: string, subject: string, metadata?: Record<string, any>): string {
  let prompt = `Analyze the following email.\n\n`;
  if (metadata?.from) prompt += `Sender: ${metadata.from}\n`;
  if (metadata?.date) prompt += `Date: ${metadata.date}\n`;
  prompt += `Subject: ${subject}\n\n`;
  prompt += `Body:\n${emailText}`;
  return prompt;
}
