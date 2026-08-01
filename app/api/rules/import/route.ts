import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { db } from "@/server/repositories/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const rules = Array.isArray(body) ? body : [];

    if (rules.length === 0) {
      return NextResponse.json({ error: "No rules provided" }, { status: 400 });
    }

    let importedCount = 0;

    await db.$transaction(async (tx) => {
      for (const rule of rules) {
        if (!rule.ruleType || !rule.pattern || !rule.feedbackType) continue;

        await tx.userLearningRule.create({
          data: {
            userId,
            ruleType: rule.ruleType,
            pattern: rule.pattern,
            feedbackType: rule.feedbackType,
            weight: rule.weight || 1,
            isUserDefined: rule.isUserDefined ?? true,
          }
        });
        importedCount++;
      }
    });

    return NextResponse.json({ success: true, importedCount });
  } catch (error) {
    console.error("[API_RULES_IMPORT] Error importing rules:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
