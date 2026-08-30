import { z } from "zod";

export const aiAnalysisSchema = z.object({
  summary: z.string().describe("A concise 1-3 sentence summary of the email."),
  category: z.string().describe("Categorize the email (e.g. SPAM, NEWSLETTER, WORK, NOTIFICATION, PERSONAL)."),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).describe("The priority level of the email."),
  confidence: z.number().min(0).max(100).describe("Confidence score (0-100) of your analysis."),
  requiresAction: z.boolean().describe("True if the user needs to reply, click a link, or perform an action."),
  reasoning: z.string().describe("Brief reasoning for the chosen priority and category."),
  deadline: z.string().nullable().describe("ISO 8601 string if a deadline is mentioned, null otherwise."),
  actionItems: z.array(z.string()).describe("A list of specific action items extracted from the email."),
  entities: z.array(z.string()).describe("Key entities (people, companies, locations) mentioned."),
  sentiment: z.string().nullable().describe("Overall sentiment of the email (e.g. POSITIVE, NEUTRAL, URGENT, ANGRY)."),
  urgencyScore: z.number().min(0).max(100).describe("How urgent this email is (0-100)."),
  estimatedReadingTime: z.number().nullable().describe("Estimated reading time in seconds."),
  suggestedNotification: z.boolean().describe("Whether this email is important enough to trigger an immediate push notification."),
  smartDraft: z.string().nullable().optional().describe("A fully drafted, professional reply to the email if it requires an actionable response. Write the draft as if you are the user replying. Null if no reply is needed."),
  extractedEvents: z.array(z.object({
    title: z.string().describe("Title of the event or meeting."),
    startTime: z.string().describe("ISO 8601 start time."),
    endTime: z.string().describe("ISO 8601 end time."),
    description: z.string().nullable().describe("Optional description of the event."),
    location: z.string().nullable().describe("Optional location (physical or virtual).")
  })).optional().describe("Any calendar events, flights, or meetings mentioned in the email.")
});

export type AIAnalysisOutput = z.infer<typeof aiAnalysisSchema>;
