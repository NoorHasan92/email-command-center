export type AICapabilityStatus = "SUPPORTED" | "UNAVAILABLE" | "UNKNOWN";

export interface AICapabilities {
  webSearch: AICapabilityStatus;
  urlContext: AICapabilityStatus;
  customToolCalling: AICapabilityStatus;
  structuredOutput: AICapabilityStatus;
}

export interface ResearchGenerationOptions {
  query: string;
  context?: string;
  targetUrls?: string[];
  maxSources?: number;
  correlationId?: string;
}

export interface RawResearchSource {
  url: string;
  title: string;
  domain: string;
  accessedAt: string;
  snippet?: string;
  isPrimary?: boolean;
}

export type EpistemicVerificationStatus =
  | "DIRECTLY_CONFIRMED_BY_SOURCE"
  | "CORROBORATED"
  | "PARTIALLY_CORROBORATED"
  | "UNVERIFIED"
  | "CONFLICTING"
  | "UNABLE_TO_VERIFY";

export interface RawResearchFinding {
  claim: string;
  evidenceSnippet: string;
  verificationStatus: EpistemicVerificationStatus;
  confidenceScore: number;
  relevance: "HIGH" | "MEDIUM" | "LOW";
  isPrimarySource: boolean;
  sources: RawResearchSource[];
}

export interface ResearchExecutionResult {
  summary: string;
  epistemicConclusion: string;
  findings: RawResearchFinding[];
  telemetry: {
    provider: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    latencyMs: number;
    searchQueriesCount?: number;
  };
}

export interface BriefingSynthesisResult {
  briefingMarkdown: string;
  epistemicConclusion: string;
  telemetry: {
    provider: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    latencyMs: number;
  };
}
