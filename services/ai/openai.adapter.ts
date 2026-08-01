import OpenAI from "openai";
import { z } from "zod";
import { IAIProvider, AIAnalysisResult, ExtractedDeadline, DeadlineType } from "../../core/interfaces/IAIProvider";
import { EmailCategory, PriorityLevel, OpportunityType, ReminderPriority } from "@prisma/client";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class OpenAIAdapter implements IAIProvider {
  async analyzeEmail(
    emailText: string,
    subject: string,
    metadata?: Record<string, any>,
    context?: {
      senderProfile?: any;
      learningRules?: any[];
      threadContext?: string[];
    }
  ): Promise<AIAnalysisResult> {
    
    // Injecting dynamic context to influence the AI
    let contextPrompt = "";
    if (context) {
      contextPrompt += `\n\n--- DYNAMIC CONTEXT (HIGH PRIORITY) ---\n`;
      
      if (context.senderProfile) {
        contextPrompt += `Sender Reputation: ${context.senderProfile.reputation}\n`;
        contextPrompt += `Interaction stats: Ignored ${context.senderProfile.ignoredCount} times, Acted ${context.senderProfile.actionsTaken} times.\n`;
      }

      if (context.learningRules && context.learningRules.length > 0) {
        contextPrompt += `\nUSER LEARNING RULES (MUST OBEY):\n`;
        context.learningRules.forEach(rule => {
          contextPrompt += `- [Weight: ${rule.weight}, RuleType: ${rule.ruleType}, ID: ${rule.id}]: User marked this pattern "${rule.pattern}" as ${rule.feedbackType}.\n`;
        });
      }

      if (context.threadContext && context.threadContext.length > 0) {
        contextPrompt += `\nTHREAD HISTORY (Previous messages for context):\n`;
        context.threadContext.forEach((msg, idx) => {
          contextPrompt += `[Message -${context.threadContext!.length - idx}]: ${msg}\n`;
        });
      }
      
      contextPrompt += `---------------------------------------\n`;
    }

    const prompt = `
      Analyze the following email.
      Subject: ${subject}
      From: ${metadata?.from || "Unknown"}
      Date: ${metadata?.date || "Unknown"}

      Content:
      ${emailText}
      ${contextPrompt}
    `;

    const startTime = performance.now();
    const modelVersion = "gpt-4o-mini";
    const promptVersion = "3.0-learning";
    
    const response = await openai.chat.completions.create({
      model: modelVersion,
      messages: [
        {
          role: "system",
          content: "You are the 'Consequence Engine'. Your primary job is to answer: 'If the user ignores this email, what is the likely consequence?'. Do NOT summarize the email. Output ONLY valid JSON matching the exact schema requested. Do not invent fabricated deadlines; use null if uncertain. Pay extremely close attention to the DYNAMIC CONTEXT (Sender Reputation, Learning Rules). If a learning rule says ALWAYS_NOTIFY, boost the score significantly and note it in appliedRules. If a rule says NEVER_NOTIFY, drop the score. Return the IDs of the rules you applied in 'appliedRules'.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "email_analysis_consequence",
          strict: true,
          schema: {
            type: "object",
            properties: {
              score: { type: "integer", description: "Importance Score from 0 to 100" },
              confidence: { type: "integer", description: "Confidence in your assessment from 0 to 100" },
              category: { 
                type: "string", 
                enum: ["SPAM", "NEWSLETTER", "NOTIFICATION", "DIRECT_MESSAGE", "URGENT", "OTHER"] 
              },
              isActionRequired: { type: "boolean" },
              actionSummary: { type: ["string", "null"], description: "1 sentence describing the action" },
              consequence: { type: ["string", "null"], description: "1-2 sentences on what happens if ignored" },
              extractedDeadlines: { 
                type: "array", 
                items: { 
                  type: "object",
                  properties: {
                    date: { type: "string" },
                    type: { type: "string", enum: ["HARD", "SOFT", "EVENT", "REMINDER"] },
                    description: { type: "string" }
                  },
                  required: ["date", "type", "description"],
                  additionalProperties: false
                } 
              },
              opportunityDetected: { type: "boolean" },
              opportunityType: { 
                type: "string", 
                enum: [
                  "INTERNSHIP", "JOB", "HACKATHON", "SCHOLARSHIP", 
                  "COMPETITION", "COLLEGE_NOTICE", "EXAM", "INTERVIEW", 
                  "PAYMENT", "SECURITY_ALERT", "NONE"
                ] 
              },
              priority: { 
                type: "string", 
                enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] 
              },
              explanation: { type: "string", description: "Short human-readable reason for score" },
              suggestedNextStep: { type: ["string", "null"] },
              estimatedReadTime: { type: ["integer", "null"], description: "In minutes" },
              reminderSuggested: { type: "boolean" },
              reminderReason: { type: ["string", "null"] },
              reminderPriority: { 
                type: ["string", "null"], 
                enum: ["LOW", "MEDIUM", "HIGH", null] 
              },
              reminderWindow: { type: ["string", "null"], description: "e.g., 'today', 'tomorrow', 'this week', '24h before deadline'" },
              appliedRules: {
                type: "array",
                items: { type: "string" },
                description: "Array of learning rule IDs that influenced this decision."
              }
            },
            required: [
              "score", "confidence", "category", "isActionRequired", "actionSummary", 
              "consequence", "extractedDeadlines", "opportunityDetected", "opportunityType",
              "priority", "explanation", "suggestedNextStep", "estimatedReadTime",
              "reminderSuggested", "reminderReason", "reminderPriority", "reminderWindow",
              "appliedRules"
            ],
            additionalProperties: false
          }
        },
      },
    });

    const latencyMs = Math.round(performance.now() - startTime);

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("OpenAI failed to return structured data.");
    }

    const result = JSON.parse(content);
    
    // Configurable threshold for human review
    const requiresHumanReview = result.confidence < 70;
    
    const promptTokens = response.usage?.prompt_tokens || 0;
    const completionTokens = response.usage?.completion_tokens || 0;
    const totalTokens = response.usage?.total_tokens || 0;
    
    const estimatedCost = (promptTokens * 0.15 / 1000000) + (completionTokens * 0.60 / 1000000);

    return {
      score: result.score,
      confidence: result.confidence,
      category: result.category as EmailCategory,
      isActionRequired: result.isActionRequired,
      actionSummary: result.actionSummary,
      consequence: result.consequence,
      extractedDeadlines: (result.extractedDeadlines || []).map((d: any) => ({
        date: new Date(d.date),
        type: d.type as DeadlineType,
        description: d.description
      })),
      opportunityDetected: result.opportunityDetected,
      opportunityType: result.opportunityType as OpportunityType,
      priority: result.priority as PriorityLevel,
      explanation: result.explanation,
      suggestedNextStep: result.suggestedNextStep,
      estimatedReadTime: result.estimatedReadTime,
      reminderSuggested: result.reminderSuggested,
      reminderReason: result.reminderReason,
      reminderPriority: result.reminderPriority as ReminderPriority | null,
      reminderWindow: result.reminderWindow,
      requiresHumanReview,
      aiVersion: `${promptVersion}-${modelVersion}`,
      appliedRules: result.appliedRules || [],
      
      model: response.model || modelVersion,
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCost,
      latencyMs,
    };
  }
}
