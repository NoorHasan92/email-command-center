// scripts/send-test-email.ts
const Module = require("module");
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "server-only") {
    return {};
  }
  return originalLoad.apply(this, arguments);
};

require("dotenv").config();

async function main() {
  const recipient = "anonymousluci758@gmail.com";
  console.log(`[TEST EMAIL] Initiating test welcome email dispatch to: ${recipient}...`);

  const { sendTestWelcomeEmail } = await import("../services/transactional-email/email.service");
  
  const result = await sendTestWelcomeEmail(recipient, "Noor");
  console.log("[TEST EMAIL] Result:", JSON.stringify(result, null, 2));

  if (result.success) {
    console.log(`✅ Test email successfully dispatched to ${recipient}! Message ID: ${result.messageId}`);
  } else {
    console.error(`❌ Failed to send test email:`, result.error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
