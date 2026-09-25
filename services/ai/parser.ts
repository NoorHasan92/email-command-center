import { aiAnalysisSchema, AIAnalysisOutput } from "./schema";
import { logger } from "@/lib/logger";

export function parseAIResponse(jsonString: string): AIAnalysisOutput {
  try {
    let clean = jsonString.trim();
    if (clean.startsWith("```json")) {
      clean = clean.slice(7);
    } else if (clean.startsWith("```")) {
      clean = clean.slice(3);
    }
    if (clean.endsWith("```")) {
      clean = clean.slice(0, -3);
    }
    clean = clean.trim();

    const parsed = JSON.parse(clean);
    const validated = aiAnalysisSchema.parse(parsed);
    return validated;
  } catch (error: any) {
    logger.error(`[AI_PARSER] Validation failed: ${error.message}`);
    throw new Error(`AI output validation failed: ${error.message}`);
  }
}
