// Mock server-only package for CLI test execution outside Next.js bundler
try {
  const serverOnlyPath = require.resolve("server-only");
  require.cache[serverOnlyPath] = {
    id: serverOnlyPath,
    filename: serverOnlyPath,
    loaded: true,
    exports: {},
  } as any;
} catch {}

import { runResearchQuotaTests } from "./research-quota.test";
import { runDeduplicationAndSecurityTests } from "./deduplication-and-security.test";
import { runRateLimiterTests } from "./rate-limiter.test";
import { runProfileProvenanceTests } from "./profile-provenance.test";
import { runConversationContextTests } from "./conversation-context.test";
import { runProductionAuditTests } from "./production-audit.test";

async function main() {
  console.log("=================================================");
  console.log("  INBOX SENTINEL AUTOMATED TEST SUITE");
  console.log("  Verifying Architectural Invariants & Safety");
  console.log("=================================================\n");

  const startTime = Date.now();

  try {
    await runResearchQuotaTests();
    await runDeduplicationAndSecurityTests();
    await runRateLimiterTests();
    await runProfileProvenanceTests();
    await runConversationContextTests();
    await runProductionAuditTests();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("=================================================");
    console.log(`🎉 ALL 6 TEST SUITES (15 INVARIANTS) PASSED SUCCESSFULLY IN ${duration}s!`);
    console.log("=================================================");
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ TEST SUITE FAILED:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
