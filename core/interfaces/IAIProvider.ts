import { EmailCategory, PriorityLevel, OpportunityType, ReminderPriority } from "@prisma/client";

export interface AIAnalysisResult {
  summary: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  requiresAction: boolean;
  reasoning: string;
  deadline: Date | null;
  actionItems: string[];
  entities: string[];
  sentiment: string | null;
  urgencyScore: number;
  estimatedReadingTime: number | null;
  suggestedNotification: boolean;

  // Telemetry
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  finishReason: string | null;
}

export interface IAIProvider {
  /**
   * Analyzes the plain text content of an email and returns structured intelligence.
   * @param emailText The sanitized plain text body of the email.
   * @param subject The subject line of the email.
   * @param metadata Additional metadata (from, date, etc.) to provide context.
   */
  analyzeEmail(
    emailText: string,
    subject: string,
    metadata?: Record<string, any>
  ): Promise<AIAnalysisResult>;
}
