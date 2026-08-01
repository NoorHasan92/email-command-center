import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { db } from "@/server/repositories/db";
import { FeedbackType, RuleType } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { ruleType, pattern, feedbackType, weight = 1 } = body;

    if (!ruleType || !pattern || !feedbackType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const rule = await db.userLearningRule.create({
      data: {
        userId,
        ruleType: ruleType as RuleType,
        pattern,
        feedbackType: feedbackType as FeedbackType,
        weight,
        isUserDefined: true,
      }
    });

    // If it's a sender rule, let's also update the SenderProfile interactions
    if (ruleType === "SENDER") {
      const profile = await db.senderProfile.findUnique({
        where: { userId_emailAddress: { userId, emailAddress: pattern } }
      });
      
      if (profile) {
        await db.senderProfile.update({
          where: { id: profile.id },
          data: {
            actionsTaken: { increment: feedbackType === "ALWAYS_NOTIFY" ? 1 : 0 },
            ignoredCount: { increment: feedbackType === "IGNORE_SIMILAR" ? 1 : 0 },
            lastInteractionAt: new Date(),
          }
        });
      }
    }

    return NextResponse.json(rule);
  } catch (error) {
    console.error("[API_FEEDBACK] Error processing feedback:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
