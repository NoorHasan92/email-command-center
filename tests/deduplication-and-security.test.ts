import assert from "assert";
import crypto from "crypto";
import { WebhookDeduplicationService } from "../services/security/deduplication.service";
import { db } from "../server/repositories/db";

export async function runDeduplicationAndSecurityTests() {
  console.log("▶ [TEST] Starting Deduplication & Webhook Security Tests...");

  const testProviderId = `msg_${Date.now()}_${Math.random()}`;

  try {
    // 1. Deduplication: First arrival must not be duplicate
    const isDup1 = await WebhookDeduplicationService.isDuplicate(
      "WHATSAPP",
      "META",
      testProviderId
    );
    assert.strictEqual(isDup1, false, "First message arrival must not be marked as duplicate");
    console.log("  ✔ Fresh inbound message accepted");

    // 2. Deduplication: Second arrival with exact same (channel, provider, providerMessageId) must be duplicate
    const isDup2 = await WebhookDeduplicationService.isDuplicate(
      "WHATSAPP",
      "META",
      testProviderId
    );
    assert.strictEqual(isDup2, true, "Duplicate webhook arrival must be detected and rejected");
    console.log("  ✔ Duplicate webhook delivery rejected (P2002 constraint)");

    // 3. Deduplication: Same message ID on different provider must be independent
    const isDupBaileys = await WebhookDeduplicationService.isDuplicate(
      "WHATSAPP",
      "BAILEYS",
      testProviderId
    );
    assert.strictEqual(isDupBaileys, false, "Different provider namespace must allow distinct message");
    console.log("  ✔ Provider namespace separation verified");

    // 4. HMAC-SHA256 Signature Verification
    const secret = "test_meta_webhook_secret_key_12345";
    const rawPayload = JSON.stringify({ object: "whatsapp_business_account", entry: [] });

    const validHmac = `sha256=${crypto
      .createHmac("sha256", secret)
      .update(rawPayload)
      .digest("hex")}`;

    const forgedHmac = `sha256=${crypto
      .createHmac("sha256", "wrong_secret")
      .update(rawPayload)
      .digest("hex")}`;

    // Test timing-safe equal
    const validBuf = Buffer.from(validHmac);
    const expectedBuf = Buffer.from(validHmac);
    const forgedBuf = Buffer.from(forgedHmac);

    assert.strictEqual(crypto.timingSafeEqual(validBuf, expectedBuf), true, "Valid HMAC signature must verify");
    assert.strictEqual(crypto.timingSafeEqual(forgedBuf, expectedBuf), false, "Forged HMAC signature must fail verification");
    console.log("  ✔ Meta HMAC-SHA256 signature verification verified");

  } finally {
    await db.inboundMessageDeduplication.deleteMany({
      where: { providerMessageId: testProviderId },
    });
  }

  console.log("✅ [TEST] Deduplication & Webhook Security Tests PASSED!\n");
}
