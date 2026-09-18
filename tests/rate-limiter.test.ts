import assert from "assert";
import { DistributedRateLimiter } from "../services/security/rate-limiter.service";
import { db } from "../server/repositories/db";

export async function runRateLimiterTests() {
  console.log("▶ [TEST] Starting Distributed Rate Limiter Tests...");

  const testKey = `test_rate_${Date.now()}`;

  try {
    // 1. Initial request under limit of 3
    const res1 = await DistributedRateLimiter.checkLimit(testKey, 3, 5000);
    assert.strictEqual(res1.success, true);
    assert.strictEqual(res1.remaining, 2);

    const res2 = await DistributedRateLimiter.checkLimit(testKey, 3, 5000);
    assert.strictEqual(res2.success, true);
    assert.strictEqual(res2.remaining, 1);

    const res3 = await DistributedRateLimiter.checkLimit(testKey, 3, 5000);
    assert.strictEqual(res3.success, true);
    assert.strictEqual(res3.remaining, 0);

    // 4th request must be rejected
    const res4 = await DistributedRateLimiter.checkLimit(testKey, 3, 5000);
    assert.strictEqual(res4.success, false, "Request exceeding limit must be rejected");
    assert.strictEqual(res4.remaining, 0);
    console.log("  ✔ Distributed rate limit threshold enforced across instances");

  } finally {
    await db.rateLimitEntry.deleteMany({ where: { key: testKey } });
  }

  console.log("✅ [TEST] Distributed Rate Limiter Tests PASSED!\n");
}
