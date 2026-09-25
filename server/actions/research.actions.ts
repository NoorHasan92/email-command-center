"use server";

import { db } from "@/server/repositories/db";
import { auth } from "@/config/auth";
import { ResearchOrchestratorService } from "@/services/research/research-orchestrator.service";
import { processPendingResearchSessions } from "@/jobs/research-processor";

export async function initiateEmailResearchAction(emailId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const email = await db.email.findUnique({
      where: { id: emailId },
      include: { emailAccount: true, analysis: true },
    });

    if (!email || email.emailAccount.userId !== session.user.id) {
      return { error: "Email not found or access denied." };
    }

    // Check if an existing completed research session exists
    const existing = await db.researchSession.findFirst({
      where: { emailId, userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { findings: true },
    });

    if (existing && existing.status === "COMPLETED") {
      return { success: true, researchSession: existing, alreadyCompleted: true };
    }

    if (existing && (existing.status === "PENDING" || existing.status === "PROCESSING")) {
      // Trigger processor in case it wasn't swept
      processPendingResearchSessions().catch(() => {});
      return { success: true, researchSession: existing, inProgress: true };
    }

    const query = `Verify company background, legitimacy, registration links, and domain reputation for: ${email.subject || "Email"} (Sender: ${email.from || "Unknown"})`;
    const context = `Subject: ${email.subject}\nFrom: ${email.from}\nSummary: ${email.analysis?.summary || ""}\nAction Items: ${(email.analysis?.actionItems as any[])?.join("; ") || ""}`;

    const result = await ResearchOrchestratorService.initiateResearch({
      userId: session.user.id,
      query,
      context,
      emailId: email.id,
    });

    // Execute processor inline to accelerate web response
    try {
      await processPendingResearchSessions();
    } catch {
      // Background worker will sweep if inline timed out
    }

    const updated = await db.researchSession.findUnique({
      where: { id: result.sessionId },
      include: { findings: true },
    });

    return {
      success: true,
      researchSession: updated,
      message: "Deep research investigation completed.",
    };
  } catch (error: any) {
    console.error("[RESEARCH_ACTIONS] initiateEmailResearchAction error:", error);
    return { error: error.message || "Failed to initiate deep research." };
  }
}

export async function getEmailResearchAction(emailId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const researchSession = await db.researchSession.findFirst({
      where: { emailId, userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { findings: true },
    });

    return { success: true, researchSession };
  } catch (error: any) {
    console.error("[RESEARCH_ACTIONS] getEmailResearchAction error:", error);
    return { error: error.message || "Failed to fetch research session." };
  }
}
