import "server-only";
import { IAIProvider, AIAnalysisResult } from "../../core/interfaces/IAIProvider";
import { logger } from "@/lib/logger";

export class HybridAIProvider implements IAIProvider {
  constructor(
    private personalProvider: IAIProvider,
    private platformProvider: IAIProvider,
    private allowFallback: boolean,
    private onFallbackUsed?: () => Promise<void>
  ) {}

  async analyzeEmail(
    emailText: string,
    subject: string,
    metadata?: Record<string, any>
  ): Promise<AIAnalysisResult> {
    try {
      logger.info(`[HYBRID_AI_PROVIDER] Attempting to use personal AI provider...`);
      return await this.personalProvider.analyzeEmail(emailText, subject, metadata);
    } catch (error: any) {
      logger.warn(`[HYBRID_AI_PROVIDER] Personal provider failed: ${error.message}`);
      
      if (!this.allowFallback) {
        logger.error(`[HYBRID_AI_PROVIDER] Fallback disabled. Aborting request.`);
        throw error;
      }
      
      logger.info(`[HYBRID_AI_PROVIDER] Fallback allowed. Switching to platform AI provider...`);
      const result = await this.platformProvider.analyzeEmail(emailText, subject, metadata);
      
      // Notify the system that fallback was used to track usage
      if (this.onFallbackUsed) {
        await this.onFallbackUsed().catch(err => {
          logger.error(`[HYBRID_AI_PROVIDER] onFallbackUsed hook failed: ${err.message}`);
        });
      }
      
      return result;
    }
  }
}
