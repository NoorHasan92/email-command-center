import { aiAnalysisSchema, AIAnalysisOutput } from "./schema";
import { logger } from "@/lib/logger";

export function parseAIResponse(jsonString: string): AIAnalysisOutput {
  try {
    const parsed = JSON.parse(jsonString);
    const validated = aiAnalysisSchema.parse(parsed);
    return validated;
  } catch (error: any) {
    logger.error(`[AI_PARSER] Validation failed: ${error.message}`);
    throw new Error(`AI output validation failed: ${error.message}`);
  }
}
