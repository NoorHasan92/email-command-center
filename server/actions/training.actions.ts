"use server";

import { db } from "@/server/repositories/db";
import { auth } from "@/config/auth";
import { RuleType, FeedbackType } from "@prisma/client";

export async function submitAIFeedbackAction(emailId: string, feedbackType: FeedbackType, reason?: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    // 1. Fetch the email to ensure it belongs to the user and to extract metadata for rules
    const email = await db.email.findUnique({
      where: { id: emailId },
      include: {
        emailAccount: true,
      }
    });

    if (!email || email.emailAccount.userId !== session.user.id) {
      return { error: "Not found or unauthorized" };
    }

    // 2. Extract domain from sender
    const senderEmailMatch = email.from.match(/<([^>]+)>/);
    const senderEmail = senderEmailMatch ? senderEmailMatch[1] : email.from;
    
    // 3. Append reason if provided
    const pattern = reason ? `${senderEmail} (Correction: ${reason})` : senderEmail;

    // 4. Create a UserLearningRule
    await db.userLearningRule.create({
      data: {
        userId: session.user.id,
        ruleType: RuleType.SENDER,
        pattern: pattern,
        feedbackType,
        isUserDefined: true, // Mark it as explicitly defined by the user
        weight: 5 // Higher weight for explicit feedback
      }
    });

    // 5. Save the feedback state to the email's pipelineMetrics so it persists
    const existingMetrics = typeof email.pipelineMetrics === 'object' && email.pipelineMetrics !== null ? email.pipelineMetrics : {};
    await db.email.update({
      where: { id: emailId },
      data: {
        pipelineMetrics: {
          ...existingMetrics,
          userFeedback: feedbackType
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to submit AI feedback:", error);
    return { error: "Failed to submit feedback" };
  }
}
