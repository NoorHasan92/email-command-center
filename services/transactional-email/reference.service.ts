import { db } from "@/server/repositories/db";
import "server-only";

export async function generateReferenceNumber(prefix: "INS-ORD" | "INS-RCP"): Promise<string> {
  const year = new Date().getFullYear();
  const fullPrefix = `${prefix}-${year}`;

  const counter = await db.referenceCounter.upsert({
    where: { prefix: fullPrefix },
    update: { lastNumber: { increment: 1 } },
    create: { prefix: fullPrefix, lastNumber: 1 },
  });

  const paddedNumber = counter.lastNumber.toString().padStart(6, "0");
  return `${fullPrefix}-${paddedNumber}`;
}
