import "server-only";
import { GoogleGenAI, Type } from "@google/genai";
import { IAIProvider, AIAnalysisResult } from "../../core/interfaces/IAIProvider";
import { buildSystemPrompt, buildUserPrompt } from "./prompt-builder";
import { parseAIResponse } from "./parser";
import { logger } from "@/lib/logger";

export class PersonalGeminiAdapter implements IAIProvider {
  private ai: GoogleGenAI;
  private currentModel: string;

  constructor(apiKey: string, model: string = "gemini-2.5-flash") {
    this.ai = new GoogleGenAI({ apiKey });
    this.currentModel = model;
  }

  async analyzeEmail(
    emailText: string,
    subject: string,
    metadata?: Record<string, any>
  ): Promise<AIAnalysisResult> {
    const systemInstruction = buildSystemPrompt();
    const prompt = buildUserPrompt(emailText, subject, metadata);

    try {
      logger.info(`[PERSONAL_GEMINI_ADAPTER] Sending request to ${this.currentModel}...`);
      const startTime = Date.now();

      // 30 second timeout implementation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await this.ai.models.generateContent({
        model: this.currentModel,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              category: { type: Type.STRING },
              priority: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
              confidence: { type: Type.INTEGER },
              requiresAction: { type: Type.BOOLEAN },
              reasoning: { type: Type.STRING },
              deadline: { type: Type.STRING, nullable: true },
              actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
              entities: { type: Type.ARRAY, items: { type: Type.STRING } },
              sentiment: { type: Type.STRING, nullable: true },
              urgencyScore: { type: Type.INTEGER },
              estimatedReadingTime: { type: Type.INTEGER, nullable: true },
              suggestedNotification: { type: Type.BOOLEAN },
              smartDraft: { type: Type.STRING, nullable: true },
              extractedEvents: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    startTime: { type: Type.STRING },
                    endTime: { type: Type.STRING },
                    description: { type: Type.STRING, nullable: true },
                    location: { type: Type.STRING, nullable: true }
                  },
                  required: ["title", "startTime", "endTime"]
                },
                nullable: true
              }
            },
            required: ["summary", "category", "priority", "confidence", "requiresAction", "reasoning", "actionItems", "entities", "urgencyScore", "suggestedNotification"]
          }
        }
      });
      
      clearTimeout(timeoutId);

      const latencyMs = Date.now() - startTime;
      
      const jsonText = response.text || "{}";
      logger.info(`[PERSONAL_GEMINI_ADAPTER] Received response in ${latencyMs}ms`);

      // Validate using Zod
      const validated = parseAIResponse(jsonText);

      const promptTokens = response.usageMetadata?.promptTokenCount || 0;
      const completionTokens = response.usageMetadata?.candidatesTokenCount || 0;
      const usage = response.usageMetadata;
      const finishReason = response.candidates?.[0]?.finishReason || null;

      const parsedDeadline = validated.deadline ? new Date(validated.deadline) : null;
      const validDeadline = parsedDeadline && !isNaN(parsedDeadline.getTime()) ? parsedDeadline : null;

      const result: AIAnalysisResult & { source?: string } = {
        ...validated,
        deadline: validDeadline,
        model: this.currentModel,
        promptTokens: usage?.promptTokenCount || 0,
        completionTokens: usage?.candidatesTokenCount || 0,
        totalTokens: usage?.totalTokenCount || 0,
        latencyMs,
        finishReason: finishReason,
      };

      // Add a hidden property to indicate source
      (result as any)._source = "PERSONAL";

      return result;
    } catch (error: any) {
      const status = error.status || error.response?.status;
      
      // Map raw provider errors to safe user-friendly errors
      if (status === 400) {
        throw new Error("Invalid API key or request format.");
      } else if (status === 401 || status === 403) {
        throw new Error("API key is unauthorized or has been revoked.");
      } else if (status === 429) {
        throw new Error("Personal AI provider reached usage or rate limits.");
      }
      
      logger.error(`[PERSONAL_GEMINI_ADAPTER] Failed: ${error.message}`);
      throw error;
    }
  }
}
