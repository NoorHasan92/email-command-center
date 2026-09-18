import assert from "assert";
import { db } from "../server/repositories/db";
import { ResearchQuotaService } from "../services/research/research-quota.service";

export async function runResearchQuotaTests() {
  console.log("▶ [TEST] Starting Research Quota & Idempotency Tests...");

  // Setup mock user
  const testEmail = `test_quota_${Date.now()}@example.com`;
  const user = await db.user.create({
    data: {
      email: testEmail,
      plan: "ULTRA",
    },
  });

  const testSessionId = `test_sess_${Date.now()}`;
  const session = await db.researchSession.create({
    data: {
      id: testSessionId,
      userId: user.id,
      query: "Test quantum computing",
      status: "PENDING",
    },
  });

  try {
    // 1. Test initial usage
    const initialUsage = await ResearchQuotaService.getUsage(user.id);
    assert.strictEqual(initialUsage.baseLimit, 50, "ULTRA plan must have 50 base research requests");
    assert.strictEqual(initialUsage.completedCount, 0);
    assert.strictEqual(initialUsage.reservedCount, 0);
    assert.strictEqual(initialUsage.remaining, 50);
    console.log("  ✔ Initial quota verified (50 available)");

    // 2. Test Reservation
    const reservation1 = await ResearchQuotaService.reserveQuota(user.id, session.id);
    assert.ok(reservation1?.reservationId, "Quota reservation should succeed");

    const reservedUsage = await ResearchQuotaService.getUsage(user.id);
    assert.strictEqual(reservedUsage.reservedCount, 1, "Reserved count should increment to 1");
    assert.strictEqual(reservedUsage.completedCount, 0, "Completed count should remain 0");
    assert.strictEqual(reservedUsage.remaining, 49, "Remaining quota should decrease to 49");
    console.log("  ✔ Quota atomically reserved (1 reserved, 49 remaining)");

    // 3. Test Idempotency on Retry: Same session reservation
    const reservationRetry = await ResearchQuotaService.reserveQuota(user.id, session.id);
    assert.strictEqual(reservationRetry?.reservationId, reservation1?.reservationId, "Retry must reuse existing reservation");

    const retryUsage = await ResearchQuotaService.getUsage(user.id);
    assert.strictEqual(retryUsage.reservedCount, 1, "Retry of same session must NOT double-reserve");
    console.log("  ✔ Worker retry idempotency verified (zero double-charging)");

    // 4. Test Commit Quota on Success
    const commitSuccess = await ResearchQuotaService.commitQuota(session.id);
    assert.strictEqual(commitSuccess, true, "Commit should succeed");

    const committedUsage = await ResearchQuotaService.getUsage(user.id);
    assert.strictEqual(committedUsage.completedCount, 1, "Completed count should be 1");
    assert.strictEqual(committedUsage.reservedCount, 0, "Reserved count should return to 0");
    assert.strictEqual(committedUsage.remaining, 49, "Remaining should be 49");
    console.log("  ✔ Quota committed on research success (1 completed, 0 reserved)");

    // 5. Test Repeated Commit Idempotency
    const commitAgain = await ResearchQuotaService.commitQuota(session.id);
    assert.strictEqual(commitAgain, true, "Second commit must be idempotent");
    const repeatCommittedUsage = await ResearchQuotaService.getUsage(user.id);
    assert.strictEqual(repeatCommittedUsage.completedCount, 1, "Completed count must NOT double-increment");
    console.log("  ✔ Repeated commit idempotency verified");

    // 6. Test Failed Attempt & Release
    const failSessionId = `test_sess_fail_${Date.now()}`;
    const failSession = await db.researchSession.create({
      data: {
        id: failSessionId,
        userId: user.id,
        query: "Failing query",
        status: "PENDING",
      },
    });

    await ResearchQuotaService.reserveQuota(user.id, failSession.id);
    const preFailUsage = await ResearchQuotaService.getUsage(user.id);
    assert.strictEqual(preFailUsage.reservedCount, 1);

    // Release on failure
    const released = await ResearchQuotaService.releaseQuota(failSession.id, "Provider timeout");
    assert.strictEqual(released, true);

    const postFailUsage = await ResearchQuotaService.getUsage(user.id);
    assert.strictEqual(postFailUsage.completedCount, 1, "Failed attempt must NOT consume completed count");
    assert.strictEqual(postFailUsage.reservedCount, 0, "Failed attempt must restore reserved count");
    assert.strictEqual(postFailUsage.remaining, 49, "Remaining balance must be restored");
    console.log("  ✔ Failure release verified (failed attempt does not consume completed quota)");

  } finally {
    // Cleanup
    await db.researchFinding.deleteMany({ where: { researchSessionId: { in: [testSessionId] } } });
    await db.researchQuotaReservation.deleteMany({ where: { userId: user.id } });
    await db.researchSession.deleteMany({ where: { userId: user.id } });
    await db.userResearchUsage.deleteMany({ where: { userId: user.id } });
    await db.user.delete({ where: { id: user.id } });
  }

  console.log("✅ [TEST] Research Quota & Idempotency Tests PASSED!\n");
}
