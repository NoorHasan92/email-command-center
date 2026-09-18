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

  async getCapabilities() {
    const personalCaps = await this.personalProvider.getCapabilities();
    if (!this.allowFallback) {
      return personalCaps;
    }
    const platformCaps = await this.platformProvider.getCapabilities();
    return {
      webSearch: personalCaps.webSearch === "SUPPORTED" ? "SUPPORTED" : platformCaps.webSearch,
      urlContext: personalCaps.urlContext === "SUPPORTED" ? "SUPPORTED" : platformCaps.urlContext,
      customToolCalling: personalCaps.customToolCalling === "SUPPORTED" ? "SUPPORTED" : platformCaps.customToolCalling,
      structuredOutput: personalCaps.structuredOutput === "SUPPORTED" ? "SUPPORTED" : platformCaps.structuredOutput,
    };
  }

  async executeResearch(options: any) {
    try {
      const caps = await this.personalProvider.getCapabilities();
      if (caps.webSearch === "SUPPORTED" && this.personalProvider.executeResearch) {
        return await this.personalProvider.executeResearch(options);
      }
      throw new Error("Personal provider does not support web search");
    } catch (error: any) {
      if (!this.allowFallback) throw error;
      logger.info("[HYBRID_AI_PROVIDER] Falling back to platform provider for research");
      if (this.onFallbackUsed) await this.onFallbackUsed().catch(() => {});
      if (this.platformProvider.executeResearch) {
        return await this.platformProvider.executeResearch(options);
      }
      throw new Error("Platform provider does not support research execution");
    }
  }

  async synthesizeBriefing(findings: any[], userContext?: string) {
    try {
      if (this.personalProvider.synthesizeBriefing) {
        return await this.personalProvider.synthesizeBriefing(findings, userContext);
      }
      throw new Error("Personal provider does not support synthesis");
    } catch (error: any) {
      if (!this.allowFallback) throw error;
      if (this.onFallbackUsed) await this.onFallbackUsed().catch(() => {});
      if (this.platformProvider.synthesizeBriefing) {
        return await this.platformProvider.synthesizeBriefing(findings, userContext);
      }
      throw new Error("Platform provider does not support synthesis");
    }
  }

  async chatConversation(messages: any[], context?: string) {
    try {
      if (this.personalProvider.chatConversation) {
        return await this.personalProvider.chatConversation(messages, context);
      }
      throw new Error("Personal provider does not support chat");
    } catch (error: any) {
      if (!this.allowFallback) throw error;
      if (this.onFallbackUsed) await this.onFallbackUsed().catch(() => {});
      if (this.platformProvider.chatConversation) {
        return await this.platformProvider.chatConversation(messages, context);
      }
      throw new Error("Platform provider does not support chat");
    }
  }
}
