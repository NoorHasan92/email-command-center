export type IntentType = "RESEARCH" | "STATUS" | "EMAIL_QUERY" | "HELP" | "CHAT";

export interface ClassifiedIntent {
  type: IntentType;
  query?: string;
  targetEmailId?: string;
  targetIndex?: number;
  isReferential?: boolean;
}

export class IntentClassifier {
  /**
   * Fast, deterministic intent classifier for inbound assistant messages.
   */
  static classify(text: string): ClassifiedIntent {
    const trimmed = text.trim();
    const lower = trimmed.toLowerCase();

    // 0. Numeric selection reply (e.g. "1", "#1", "research 1", "research #2")
    const indexMatch = lower.match(/^(?:research\s+|check\s+)?#?([1-9])$/i);
    if (indexMatch) {
      return {
        type: "RESEARCH",
        query: "",
        targetIndex: parseInt(indexMatch[1], 10),
        isReferential: true,
      };
    }

    // 1. Referential research requests (e.g. "Research this mail", "deep research this company", "verify this")
    const referentialPatterns = [
      /^(\/research|research:|investigate:|deep research|cross check|cross-check|verify)\s*$/i,
      /^(research|deep research|investigate|cross check|cross-check|verify|check)\s+(this|the)\s+(email|mail|company|sender|message|link|source|attachment)/i,
      /^(can you\s+)?(research|investigate|verify|cross check|cross-check)\s+(this|the)\s+(email|mail|company|sender|message)/i,
      /^(look up|find out about)\s+(this|the)\s+(company|sender|email|mail)/i,
      /^(verify|investigate|cross check|cross-check|research)\s+this$/i,
    ];

    for (const pattern of referentialPatterns) {
      if (pattern.test(lower)) {
        return { type: "RESEARCH", query: "", isReferential: true };
      }
    }

    // 2. Explicit /research command or research request with specific query
    if (lower.startsWith("/research") || lower.startsWith("research:") || lower.startsWith("investigate:") || lower.startsWith("research ")) {
      const query = trimmed.replace(/^(\/research|research:|investigate:|research)\s*/i, "").trim();
      const isRef = /^(this|the)\s+(email|mail|company|sender|message)$/i.test(query) || !query;
      return { type: "RESEARCH", query: isRef ? "" : query, isReferential: isRef };
    }

    // Natural language research requests with query
    if (
      lower.startsWith("look up ") ||
      lower.startsWith("search for ") ||
      lower.startsWith("can you research ") ||
      lower.startsWith("deep research ") ||
      lower.startsWith("find out about ")
    ) {
      const query = trimmed.replace(/^(look up|search for|can you research|deep research|find out about)\s+/i, "").trim();
      const isRef = /^(this|the)\s+(email|mail|company|sender|message)$/i.test(query) || !query;
      return { type: "RESEARCH", query: isRef ? "" : query, isReferential: isRef };
    }

    // 3. Status / Quota checks
    if (
      lower === "/status" ||
      lower === "status" ||
      lower.includes("quota") ||
      lower.includes("usage") ||
      lower.includes("how many research")
    ) {
      return { type: "STATUS" };
    }

    // 4. Help command
    if (lower === "/help" || lower === "help" || lower === "commands") {
      return { type: "HELP" };
    }

    // 5. Email query
    if (
      lower.includes("this email") ||
      lower.includes("unread") ||
      lower.includes("recent email") ||
      lower.includes("inbox")
    ) {
      return { type: "EMAIL_QUERY", query: trimmed };
    }

    // 6. Default conversational chat
    return { type: "CHAT", query: trimmed };
  }
}
