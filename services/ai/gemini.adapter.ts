import { GoogleGenAI, Type } from "@google/genai";
import { IAIProvider, AIAnalysisResult } from "../../core/interfaces/IAIProvider";
import { buildSystemPrompt, buildUserPrompt } from "./prompt-builder";
import { parseAIResponse } from "./parser";
import { logger } from "@/lib/logger";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const FALLBACK_MODELS = [
  "gemini-3.5-flash", 
  "gemini-2.5-flash", 
  "gemini-2.5-flash-lite", 
  "gemini-3-flash", 
  "gemini-3.6-flash", 
  "gemini-3.1-flash-lite", 
  "gemma-4-31b"
];

export class GeminiAdapter implements IAIProvider {
  async analyzeEmail(
    emailText: string,
    subject: string,
    metadata?: Record<string, any>
  ): Promise<AIAnalysisResult> {
    const systemInstruction = buildSystemPrompt();
    const prompt = buildUserPrompt(emailText, subject, metadata);

    const maxRetries = FALLBACK_MODELS.length; // Try every model in the list
    let attempt = 0;
    let lastError = null;

    while (attempt < maxRetries) {
      const currentModel = FALLBACK_MODELS[attempt];
      attempt++;
      try {
        logger.info(`[GEMINI_ADAPTER] Attempt ${attempt} - Sending request to ${currentModel}...`);
        const startTime = Date.now();

        // 30 second timeout implementation
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await ai.models.generateContent({
          model: currentModel,
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
                sentiment: { type: Type.STRING },
                urgencyScore: { type: Type.INTEGER },
                estimatedReadingTime: { type: Type.INTEGER },
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
              required: ["summary", "category", "priority", "confidence", "requiresAction", "reasoning", "actionItems", "entities", "sentiment", "urgencyScore", "estimatedReadingTime", "suggestedNotification"]
            }
          }
        });
        
        clearTimeout(timeoutId);

        const latencyMs = Date.now() - startTime;
        
        const jsonText = response.text || "{}";
        logger.info(`[GEMINI_ADAPTER] Received response in ${latencyMs}ms`);

        // Validate using Zod
        const validated = parseAIResponse(jsonText);

        const promptTokens = response.usageMetadata?.promptTokenCount || 0;
        const completionTokens = response.usageMetadata?.candidatesTokenCount || 0;
        const usage = response.usageMetadata;
        const finishReason = response.candidates?.[0]?.finishReason || null;

        const parsedDeadline = validated.deadline ? new Date(validated.deadline) : null;
        const validDeadline = parsedDeadline && !isNaN(parsedDeadline.getTime()) ? parsedDeadline : null;

        const result: AIAnalysisResult = {
          ...validated,
          deadline: validDeadline,
          model: currentModel,
          promptTokens: usage?.promptTokenCount || 0,
          completionTokens: usage?.candidatesTokenCount || 0,
          totalTokens: usage?.totalTokenCount || 0,
          latencyMs,
          finishReason: finishReason,
        };

        return result;
      } catch (error: any) {
        lastError = error;
        const status = error.status || error.response?.status;
        
        // Non-retryable errors
        if (status && [400, 401, 403, 404].includes(status)) {
          logger.error(`[GEMINI_ADAPTER] Permanent failure (HTTP ${status}): ${error.message}`);
          throw error;
        }

        logger.warn(`[GEMINI_ADAPTER] Retryable error on attempt ${attempt} with ${currentModel}: ${error.message}`);
        
        if (attempt >= maxRetries) {
          logger.error(`[GEMINI_ADAPTER] Exhausted all ${maxRetries} fallback models.`);
          break;
        }

        // Exponential backoff before next model
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }

    throw new Error(`AI Analysis failed after trying ${maxRetries} models. Last Error: ${lastError?.message}`);
  }
}
