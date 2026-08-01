import { EmailCategory, PriorityLevel, OpportunityType, ReminderPriority } from "@prisma/client";

export type DeadlineType = "HARD" | "SOFT" | "EVENT" | "REMINDER";

export interface ExtractedDeadline {
  date: Date;
  type: DeadlineType;
  description: string;
}

export interface AIAnalysisResult {
  score: number; // 0-100
  explanation: string;
  isActionRequired: boolean;
  extractedDeadlines: ExtractedDeadline[];
  
  // New Milestone 7 Fields
  confidence: number;
  category: EmailCategory;
  actionSummary: string | null;
  consequence: string | null;
  opportunityDetected: boolean;
  opportunityType: OpportunityType;
  priority: PriorityLevel;
  suggestedNextStep: string | null;
  estimatedReadTime: number | null;
  reminderSuggested: boolean;
  reminderReason: string | null;
  reminderPriority: ReminderPriority | null;
  reminderWindow: string | null;
  requiresHumanReview: boolean;
  aiVersion: string;
  appliedRules: string[];

  // Telemetry
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  latencyMs: number;
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
    metadata?: Record<string, any>,
    context?: {
      senderProfile?: any;
      learningRules?: any[];
      threadContext?: string[];
    }
  ): Promise<AIAnalysisResult>;
}
