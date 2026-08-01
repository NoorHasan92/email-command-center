import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { db } from "@/server/repositories/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rules = await db.userLearningRule.findMany({
      where: { userId: session.user.id },
      select: {
        ruleType: true,
        pattern: true,
        feedbackType: true,
        weight: true,
        isUserDefined: true,
      }
    });

    return new NextResponse(JSON.stringify(rules, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="inbox-sentinel-rules.json"',
      },
    });
  } catch (error) {
    console.error("[API_RULES_EXPORT] Error exporting rules:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
