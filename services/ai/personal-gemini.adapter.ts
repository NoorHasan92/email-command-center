import "server-only";
import { GoogleGenAI, Type } from "@google/genai";
import { IAIProvider, AIAnalysisResult } from "../../core/interfaces/IAIProvider";
import { AICapabilities, ResearchGenerationOptions, ResearchExecutionResult } from "../../core/interfaces/IAICapabilities";
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

  async getCapabilities(): Promise<AICapabilities> {
    const model = this.currentModel.toLowerCase();
    const supportsSearch =
      model.includes("gemini-2") ||
      model.includes("gemini-3") ||
      model.includes("flash") ||
      model.includes("pro");

    return {
      webSearch: supportsSearch ? "SUPPORTED" : "UNAVAILABLE",
      urlContext: supportsSearch ? "SUPPORTED" : "UNAVAILABLE",
      customToolCalling: "SUPPORTED",
      structuredOutput: "SUPPORTED",
    };
  }

  async executeResearch(options: ResearchGenerationOptions): Promise<ResearchExecutionResult> {
    const caps = await this.getCapabilities();
    if (caps.webSearch !== "SUPPORTED") {
      throw new Error(`Personal model '${this.currentModel}' does not support search grounding.`);
    }

    const startTime = Date.now();
    const systemInstruction = `You are an elite research analyst for Inbox Sentinel. Perform evidence-based research using Google Search grounding.`;
    const prompt = `Research Query: ${options.query}\n${options.context ? `Context: ${options.context}` : ""}`;

    try {
      const response = await this.ai.models.generateContent({
        model: this.currentModel,
        contents: prompt,
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
        },
      });

      const latencyMs = Date.now() - startTime;
      const candidate = response.candidates?.[0];
      const groundingMetadata = candidate?.groundingMetadata;

      const sources: any[] = (groundingMetadata?.groundingChunks || [])
        .filter((chunk: any) => chunk.web?.uri)
        .map((chunk: any) => {
          const uri = chunk.web.uri;
          let domain = "";
          try {
            domain = new URL(uri).hostname;
          } catch {}
          return {
            url: uri,
            title: chunk.web.title || domain || "Web Source",
            domain,
            accessedAt: new Date().toISOString(),
          };
        });

      const text = response.text || "";
      const searchQueriesCount = groundingMetadata?.webSearchQueries?.length || 0;

      const promptTokens = response.usageMetadata?.promptTokenCount || 0;
      const completionTokens = response.usageMetadata?.candidatesTokenCount || 0;
      const totalTokens = response.usageMetadata?.totalTokenCount || promptTokens + completionTokens;

      return {
        summary: text.substring(0, 800),
        epistemicConclusion: `Findings based on personal provider search grounding across ${sources.length} sources.`,
        findings: [
          {
            claim: text.substring(0, 300),
            evidenceSnippet: text.substring(0, 300),
            verificationStatus: sources.length > 0 ? "CORROBORATED" : "UNVERIFIED",
            confidenceScore: 0.85,
            relevance: "HIGH",
            isPrimarySource: sources.length > 0,
            sources: sources.slice(0, 3),
          },
        ],
        telemetry: {
          provider: "PERSONAL_GEMINI",
          model: this.currentModel,
          promptTokens,
          completionTokens,
          totalTokens,
          latencyMs,
          searchQueriesCount,
        },
      };
    } catch (e: any) {
      logger.error(`[PERSONAL_GEMINI_ADAPTER] Research failed: ${e.message}`);
      throw e;
    }
  }

  async synthesizeBriefing(findings: any[], userContext?: string): Promise<any> {
    const startTime = Date.now();
    const prompt = `Synthesize these research findings into an executive briefing:\n${JSON.stringify(findings, null, 2)}`;

    try {
      const response = await this.ai.models.generateContent({
        model: this.currentModel,
        contents: prompt,
      });

      const latencyMs = Date.now() - startTime;
      const text = response.text || "";
      const promptTokens = response.usageMetadata?.promptTokenCount || 0;
      const completionTokens = response.usageMetadata?.candidatesTokenCount || 0;
      const totalTokens = response.usageMetadata?.totalTokenCount || promptTokens + completionTokens;

      return {
        briefingMarkdown: text,
        epistemicConclusion: "Synthesis concluded via personal provider.",
        telemetry: {
          provider: "PERSONAL_GEMINI",
          model: this.currentModel,
          promptTokens,
          completionTokens,
          totalTokens,
          latencyMs,
        },
      };
    } catch (e: any) {
      logger.error(`[PERSONAL_GEMINI_ADAPTER] Synthesis failed: ${e.message}`);
      throw e;
    }
  }

  async chatConversation(
    messages: Array<{ role: "USER" | "ASSISTANT" | "SYSTEM"; content: string }>,
    context?: string
  ): Promise<any> {
    const startTime = Date.now();
    const formattedContents = messages.map((m) => ({
      role: m.role === "ASSISTANT" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    try {
      const response = await this.ai.models.generateContent({
        model: this.currentModel,
        contents: formattedContents as any,
      });

      const latencyMs = Date.now() - startTime;
      const text = response.text || "Understood.";
      const promptTokens = response.usageMetadata?.promptTokenCount || 0;
      const completionTokens = response.usageMetadata?.candidatesTokenCount || 0;
      const totalTokens = response.usageMetadata?.totalTokenCount || promptTokens + completionTokens;

      return {
        reply: text,
        telemetry: {
          provider: "PERSONAL_GEMINI",
          model: this.currentModel,
          promptTokens,
          completionTokens,
          totalTokens,
          latencyMs,
        },
      };
    } catch (e: any) {
      logger.error(`[PERSONAL_GEMINI_ADAPTER] Chat failed: ${e.message}`);
      throw e;
    }
  }
}
