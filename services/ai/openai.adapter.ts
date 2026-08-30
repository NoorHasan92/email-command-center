import OpenAI from "openai";
import { z } from "zod";
import { IAIProvider, AIAnalysisResult } from "../../core/interfaces/IAIProvider";

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
    const prompt = `Analyze this email:\nSubject: ${subject}\nContent:\n${emailText}`;
    
    const startTime = performance.now();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "email_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              category: { type: "string" },
              priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
              confidence: { type: "integer" },
              requiresAction: { type: "boolean" },
              reasoning: { type: "string" },
              deadline: { type: ["string", "null"] },
              actionItems: { type: "array", items: { type: "string" } },
              entities: { type: "array", items: { type: "string" } },
              sentiment: { type: ["string", "null"] },
              urgencyScore: { type: "integer" },
              estimatedReadingTime: { type: ["integer", "null"] },
              suggestedNotification: { type: "boolean" },
              smartDraft: { type: ["string", "null"] },
              extractedEvents: {
                type: ["array", "null"],
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    startTime: { type: "string" },
                    endTime: { type: "string" },
                    description: { type: ["string", "null"] },
                    location: { type: ["string", "null"] }
                  },
                  required: ["title", "startTime", "endTime", "description", "location"],
                  additionalProperties: false
                }
              }
            },
            required: ["summary", "category", "priority", "confidence", "requiresAction", "reasoning", "deadline", "actionItems", "entities", "sentiment", "urgencyScore", "estimatedReadingTime", "suggestedNotification", "smartDraft", "extractedEvents"],
            additionalProperties: false
          }
        }
      }
    });

    const latencyMs = Math.round(performance.now() - startTime);
    const content = response.choices[0].message.content || "{}";
    const result = JSON.parse(content);

    return {
      summary: result.summary,
      category: result.category,
      priority: result.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      confidence: result.confidence,
      requiresAction: result.requiresAction,
      reasoning: result.reasoning,
      deadline: result.deadline ? new Date(result.deadline) : null,
      actionItems: result.actionItems,
      entities: result.entities,
      sentiment: result.sentiment,
      urgencyScore: result.urgencyScore,
      estimatedReadingTime: result.estimatedReadingTime,
      suggestedNotification: result.suggestedNotification,
      smartDraft: result.smartDraft,
      extractedEvents: result.extractedEvents || undefined,
      model: "gpt-4o-mini",
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
      latencyMs: latencyMs,
      finishReason: response.choices[0].finish_reason
    };
  }
}
