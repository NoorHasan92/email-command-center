export type IntentType = "RESEARCH" | "STATUS" | "EMAIL_QUERY" | "HELP" | "CHAT";

export interface ClassifiedIntent {
  type: IntentType;
  query?: string;
  targetEmailId?: string;
}

export class IntentClassifier {
  /**
   * Fast, deterministic intent classifier for inbound assistant messages.
   */
  static classify(text: string): ClassifiedIntent {
    const trimmed = text.trim();
    const lower = trimmed.toLowerCase();

    // 1. Explicit /research command or research request
    if (lower.startsWith("/research") || lower.startsWith("research:") || lower.startsWith("investigate:")) {
      const query = trimmed.replace(/^(\/research|research:|investigate:)\s*/i, "").trim();
      return { type: "RESEARCH", query };
    }

    // Natural language research requests
    if (
      lower.startsWith("look up ") ||
      lower.startsWith("search for ") ||
      lower.startsWith("can you research ") ||
      lower.startsWith("deep research ") ||
      lower.startsWith("find out about ")
    ) {
      const query = trimmed.replace(/^(look up|search for|can you research|deep research|find out about)\s+/i, "").trim();
      return { type: "RESEARCH", query };
    }

    // 2. Status / Quota checks
    if (
      lower === "/status" ||
      lower === "status" ||
      lower.includes("quota") ||
      lower.includes("usage") ||
      lower.includes("how many research")
    ) {
      return { type: "STATUS" };
    }

    // 3. Help command
    if (lower === "/help" || lower === "help" || lower === "commands") {
      return { type: "HELP" };
    }

    // 4. Email query
    if (
      lower.includes("this email") ||
      lower.includes("unread") ||
      lower.includes("recent email") ||
      lower.includes("inbox")
    ) {
      return { type: "EMAIL_QUERY", query: trimmed };
    }

    // 5. Default conversational chat
    return { type: "CHAT", query: trimmed };
  }
}
