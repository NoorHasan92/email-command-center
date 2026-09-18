import assert from "assert";
import { db } from "../server/repositories/db";
import { ConversationService } from "../services/assistant/conversation.service";

export async function runConversationContextTests() {
  console.log("▶ [TEST] Starting Conversation Context & Security Isolation Tests...");

  const user1 = await db.user.create({
    data: {
      email: `test_user1_${Date.now()}@example.com`,
      plan: "ULTRA",
    },
  });

  const user2 = await db.user.create({
    data: {
      email: `test_user2_${Date.now()}@example.com`,
      plan: "ULTRA",
    },
  });

  // Create email for user2
  const emailAccount2 = await db.emailAccount.create({
    data: {
      userId: user2.id,
      emailAddress: user2.email,
      provider: "gmail",
      providerAccountId: `acc_${Date.now()}`,
      accessToken: "mock_token",
    },
  });

  const email2 = await db.email.create({
    data: {
      emailAccountId: emailAccount2.id,
      providerMessageId: `msg_${Date.now()}`,
      from: "boss@acme.com",
      to: user2.email,
      date: new Date(),
      subject: "User 2 Confidential Email",
    },
  });

  try {
    // 1. Get or create conversation for user 1
    const conv1 = await ConversationService.getOrCreateConversation(user1.id, "WHATSAPP", "1234567890");
    assert.ok(conv1.id);
    assert.strictEqual(conv1.userId, user1.id);
    console.log("  ✔ Scoped conversation created for user 1");

    // 2. User 1 tries to bind User 2's email as activeEmailId
    await ConversationService.updateActiveContext(conv1.id, user1.id, {
      activeEmailId: email2.id,
    });

    const convAfterUnauthorized = await db.assistantConversation.findUnique({
      where: { id: conv1.id },
    });

    assert.strictEqual(
      convAfterUnauthorized?.activeEmailId,
      null,
      "Unauthorized email context must NOT be bound to user 1 conversation"
    );
    console.log("  ✔ Cross-user email reference strictly rejected");

    // 3. User 1 binds own research session
    const research1 = await db.researchSession.create({
      data: {
        userId: user1.id,
        query: "Own research",
        status: "COMPLETED",
      },
    });

    await ConversationService.updateActiveContext(conv1.id, user1.id, {
      activeResearchId: research1.id,
    });

    const convAfterOwn = await db.assistantConversation.findUnique({
      where: { id: conv1.id },
    });

    assert.strictEqual(
      convAfterOwn?.activeResearchId,
      research1.id,
      "Own research context should bind cleanly"
    );
    console.log("  ✔ Authorized context correctly bound");

  } finally {
    await db.assistantMessage.deleteMany({ where: { conversation: { userId: user1.id } } });
    await db.assistantConversation.deleteMany({ where: { userId: user1.id } });
    await db.researchSession.deleteMany({ where: { userId: user1.id } });
    await db.email.deleteMany({ where: { id: email2.id } });
    await db.emailAccount.deleteMany({ where: { id: emailAccount2.id } });
    await db.user.deleteMany({ where: { id: { in: [user1.id, user2.id] } } });
  }

  console.log("✅ [TEST] Conversation Context & Security Isolation Tests PASSED!\n");
}
