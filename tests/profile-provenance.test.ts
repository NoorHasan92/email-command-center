import assert from "assert";
import { db } from "../server/repositories/db";
import { PersonalProfileService } from "../services/intelligence/profile.service";

export async function runProfileProvenanceTests() {
  console.log("▶ [TEST] Starting Profile Provenance & Approval Workflow Tests...");

  const testEmail = `test_prof_${Date.now()}@example.com`;
  const user = await db.user.create({
    data: {
      email: testEmail,
      plan: "ULTRA",
    },
  });

  try {
    // 1. User entered item -> Immediately ACTIVE
    const userItem = await PersonalProfileService.addUserItem(user.id, {
      category: "PROJECTS_PRIORITIES",
      key: "Project Phoenix",
      value: "Leading core architecture redesign",
      provenance: "USER_ENTERED",
    });
    assert.strictEqual(userItem.status, "ACTIVE", "User entered item must be immediately ACTIVE");
    assert.strictEqual(userItem.provenance, "USER_ENTERED");
    console.log("  ✔ User-entered profile item immediately ACTIVE");

    // 2. AI inferred item -> Must be PENDING_APPROVAL
    const aiItem = await PersonalProfileService.addAIInferredItem(
      user.id,
      "KEY_RELATIONSHIPS",
      "Alice Smith",
      "Key enterprise customer sponsor",
      0.9,
      "email:msg_123"
    );
    assert.strictEqual(aiItem.status, "PENDING_APPROVAL", "AI inferred item must be PENDING_APPROVAL until accepted");
    assert.strictEqual(aiItem.provenance, "AI_INFERRED");
    console.log("  ✔ AI-inferred observation staged as PENDING_APPROVAL");

    // 3. Active context must ONLY include ACTIVE items
    const contextPreApproval = await PersonalProfileService.buildActiveProfileContext(user.id);
    assert.ok(contextPreApproval?.includes("Project Phoenix"), "Active items must appear in context");
    assert.ok(!contextPreApproval?.includes("Alice Smith"), "Pending items must NOT appear in active context");
    console.log("  ✔ Prompt context strictly excludes unapproved items");

    // 4. Approve AI inferred item
    const approvedItem = await PersonalProfileService.approveItem(user.id, aiItem.id);
    assert.strictEqual(approvedItem.status, "ACTIVE");

    const contextPostApproval = await PersonalProfileService.buildActiveProfileContext(user.id);
    assert.ok(contextPostApproval?.includes("Alice Smith"), "Approved items must now appear in active context");
    console.log("  ✔ Explicit user approval activates observation");

    // 5. Reject AI inferred item
    const aiItem2 = await PersonalProfileService.addAIInferredItem(
      user.id,
      "COMMUNICATION_PREFERENCES",
      "No meetings Friday",
      "Strict policy",
      0.7,
      "email:msg_456"
    );
    const rejectedItem = await PersonalProfileService.rejectItem(user.id, aiItem2.id);
    assert.strictEqual(rejectedItem.status, "REJECTED");
    console.log("  ✔ User rejection marks status as REJECTED");

  } finally {
    const prof = await db.personalProfile.findUnique({ where: { userId: user.id } });
    if (prof) {
      await db.profileItem.deleteMany({ where: { profileId: prof.id } });
      await db.personalProfile.delete({ where: { id: prof.id } });
    }
    await db.user.delete({ where: { id: user.id } });
  }

  console.log("✅ [TEST] Profile Provenance & Approval Workflow Tests PASSED!\n");
}
