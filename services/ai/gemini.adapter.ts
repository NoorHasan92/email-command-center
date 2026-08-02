import { GoogleGenAI, Type } from "@google/genai";
import { IAIProvider, AIAnalysisResult } from "../../core/interfaces/IAIProvider";
import { buildSystemPrompt, buildUserPrompt } from "./prompt-builder";
import { parseAIResponse } from "./parser";
import { logger } from "@/lib/logger";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = "gemini-3.5-flash";

export class GeminiAdapter implements IAIProvider {
  async analyzeEmail(
    emailText: string,
    subject: string,
    metadata?: Record<string, any>
  ): Promise<AIAnalysisResult> {
    const systemInstruction = buildSystemPrompt();
    const prompt = buildUserPrompt(emailText, subject, metadata);

    const maxRetries = 1; // Retry once if validation fails or 5xx occurs
    let attempt = 0;

    while (attempt <= maxRetries) {
      attempt++;
      try {
        logger.info(`[GEMINI_ADAPTER] Attempt ${attempt} - Sending request to ${MODEL}...`);
        const startTime = Date.now();

        // 30 second timeout implementation
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await ai.models.generateContent({
          model: MODEL,
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
                suggestedNotification: { type: Type.BOOLEAN }
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

        const parsedDeadline = validated.deadline ? new Date(validated.deadline) : null;
        const validDeadline = parsedDeadline && !isNaN(parsedDeadline.getTime()) ? parsedDeadline : null;

        return {
          ...validated,
          deadline: validDeadline,
          model: MODEL,
          promptTokens,
          completionTokens,
          totalTokens: response.usageMetadata?.totalTokenCount || 0,
          latencyMs,
          finishReason: response.candidates?.[0]?.finishReason || null
        };

      } catch (error: any) {
        // Abort error
        if (error.name === 'AbortError') {
          logger.error(`[GEMINI_ADAPTER] Timeout error on attempt ${attempt}`);
          if (attempt > maxRetries) throw new Error("Gemini API timeout after retries");
          continue;
        }

        const status = error.status || error.response?.status;
        
        // Non-retryable errors
        if (status && [400, 401, 403, 404].includes(status)) {
          logger.error(`[GEMINI_ADAPTER] Permanent failure (HTTP ${status}): ${error.message}`);
          throw error;
        }

        // Retryable errors (validation errors or 5xx)
        logger.warn(`[GEMINI_ADAPTER] Retryable error on attempt ${attempt}: ${error.message}`);
        
        if (attempt > maxRetries) {
          logger.error(`[GEMINI_ADAPTER] Max retries reached. AI analysis failed.`);
          throw error;
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      }
    }

    throw new Error("Unexpected failure in GeminiAdapter");
  }
}
