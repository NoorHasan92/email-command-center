export const PRODUCTS = {
  PLAN_PRO: {
    type: "PLAN_PRO",
    name: "Pro Plan",
    description: "Unlock advanced AI analysis and productivity tools.",
    price: 114500, // 1145 INR in paise (approx $11.99)
    currency: "INR",
    aiLimit: 200,
    features: [
      "200 AI Email Analyses per month",
      "Action item and deadline extraction",
      "Opportunity surfacing",
      "WhatsApp & Telegram notifications"
    ]
  },
  PLAN_ULTRA: {
    type: "PLAN_ULTRA",
    name: "Ultra Plan",
    description: "Maximum AI limits for power users.",
    price: 238500, // 2385 INR in paise (approx $24.99)
    currency: "INR",
    aiLimit: 500,
    features: [
      "500 AI Email Analyses per month",
      "Action item and deadline extraction",
      "Opportunity surfacing",
      "WhatsApp & Telegram notifications",
      "Priority AI processing"
    ]
  },
  ADDON_BYOK: {
    type: "ADDON_BYOK",
    name: "BYOK Add-on",
    description: "Bring Your Own Key for custom AI integration.",
    price: 50000, // 500 INR
    currency: "INR",
    aiLimit: 0, // Unlocked limits using own key
    features: [
      "Connect your personal Gemini API key",
      "Uncapped AI usage based on your provider",
      "Access to Personal & Hybrid processing modes"
    ]
  },
  ADDON_RESEARCH_PACK: {
    type: "ADDON_RESEARCH_PACK",
    name: "Research Pack (50 Deep Inquiries)",
    description: "Additional deep research allowance for complex inquiries.",
    price: 99900, // 999 INR in paise
    currency: "INR",
    aiLimit: 0,
    features: [
      "50 Deep Web & Evidence Research Requests",
      "Primary-source evidence citation",
      "Executive synthesized briefings delivered to WhatsApp/Telegram"
    ]
  }
};
