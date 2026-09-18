import "server-only";
import { db } from "@/server/repositories/db";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { ProfileItemProvenance, ProfileItemStatus } from "@prisma/client";

export const ProfileCategorySchema = z.enum([
  "ROLE_GOALS",
  "KEY_RELATIONSHIPS",
  "PROJECTS_PRIORITIES",
  "COMMUNICATION_PREFERENCES",
  "INTERESTS_DOMAINS",
]);

export const ClientProfileItemInputSchema = z.object({
  category: ProfileCategorySchema,
  key: z.string().min(1).max(100),
  value: z.string().min(1).max(1000),
  provenance: z.enum(["USER_ENTERED", "IMPORTED"]).default("USER_ENTERED"),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type ClientProfileItemInput = z.infer<typeof ClientProfileItemInputSchema>;

export class PersonalProfileService {
  /**
   * Retrieves or initializes a personal profile for the user.
   */
  static async getOrCreateProfile(userId: string) {
    let profile = await db.personalProfile.findUnique({
      where: { userId },
      include: {
        items: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!profile) {
      profile = await db.personalProfile.create({
        data: {
          userId,
          keyPriorities: [],
          vipDomains: [],
          vipContacts: [],
        },
        include: {
          items: true,
        },
      });
    }

    return profile;
  }

  /**
   * Updates profile header metadata (role, organization, summary, priorities).
   */
  static async updateProfileHeader(
    userId: string,
    data: {
      summary?: string;
      primaryRole?: string;
      organization?: string;
      keyPriorities?: string[];
      vipDomains?: string[];
      vipContacts?: Array<{ name: string; email: string; relationship?: string }>;
    }
  ) {
    const profile = await this.getOrCreateProfile(userId);

    return await db.personalProfile.update({
      where: { id: profile.id },
      data: {
        summary: data.summary,
        primaryRole: data.primaryRole,
        organization: data.organization,
        keyPriorities: data.keyPriorities || undefined,
        vipDomains: data.vipDomains || undefined,
        vipContacts: (data.vipContacts as any) || undefined,
      },
      include: {
        items: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  /**
   * Adds an item entered or imported by the user (status immediately ACTIVE).
   */
  static async addUserItem(userId: string, input: ClientProfileItemInput) {
    const validated = ClientProfileItemInputSchema.parse(input);
    const profile = await this.getOrCreateProfile(userId);

    return await db.profileItem.create({
      data: {
        profileId: profile.id,
        category: validated.category,
        key: validated.key,
        value: validated.value,
        provenance: validated.provenance as ProfileItemProvenance,
        status: "ACTIVE",
        confidence: 1.0,
        metadata: validated.metadata || {},
      },
    });
  }

  /**
   * Adds an AI-inferred profile item from email or conversational context.
   * Remains in PENDING_APPROVAL status until user explicitly accepts it.
   */
  static async addAIInferredItem(
    userId: string,
    category: z.infer<typeof ProfileCategorySchema>,
    key: string,
    value: string,
    confidence: number,
    sourceReference: string
  ) {
    const profile = await this.getOrCreateProfile(userId);

    // Prevent duplicate pending items for same key and value
    const existing = await db.profileItem.findFirst({
      where: {
        profileId: profile.id,
        category,
        key,
        value,
        status: { in: ["ACTIVE", "PENDING_APPROVAL"] },
      },
    });

    if (existing) {
      return existing;
    }

    return await db.profileItem.create({
      data: {
        profileId: profile.id,
        category,
        key,
        value,
        provenance: "AI_INFERRED",
        status: "PENDING_APPROVAL",
        confidence: Math.min(1.0, Math.max(0.0, confidence)),
        sourceReference,
      },
    });
  }

  /**
   * Approves a pending AI-inferred profile item.
   */
  static async approveItem(userId: string, itemId: string) {
    const profile = await this.getOrCreateProfile(userId);

    const item = await db.profileItem.findFirst({
      where: { id: itemId, profileId: profile.id },
    });

    if (!item) {
      throw new Error("Profile item not found or unauthorized");
    }

    return await db.profileItem.update({
      where: { id: itemId },
      data: { status: "ACTIVE" },
    });
  }

  /**
   * Rejects an AI-inferred profile item.
   */
  static async rejectItem(userId: string, itemId: string) {
    const profile = await this.getOrCreateProfile(userId);

    const item = await db.profileItem.findFirst({
      where: { id: itemId, profileId: profile.id },
    });

    if (!item) {
      throw new Error("Profile item not found or unauthorized");
    }

    return await db.profileItem.update({
      where: { id: itemId },
      data: { status: "REJECTED" },
    });
  }

  /**
   * Deletes a profile item.
   */
  static async deleteItem(userId: string, itemId: string) {
    const profile = await this.getOrCreateProfile(userId);

    const item = await db.profileItem.findFirst({
      where: { id: itemId, profileId: profile.id },
    });

    if (!item) {
      throw new Error("Profile item not found or unauthorized");
    }

    return await db.profileItem.delete({
      where: { id: itemId },
    });
  }

  /**
   * Compiles active profile items into a high-density, sanitized context string for AI prompts.
   * Strictly filters out unapproved (PENDING_APPROVAL) or REJECTED items.
   */
  static async buildActiveProfileContext(userId: string): Promise<string | null> {
    const profile = await db.personalProfile.findUnique({
      where: { userId },
      include: {
        items: {
          where: { status: "ACTIVE" },
        },
      },
    });

    if (!profile) return null;

    const sections: string[] = [];

    if (profile.primaryRole || profile.organization) {
      sections.push(`User Identity: ${profile.primaryRole || "Professional"} at ${profile.organization || "Independent"}`);
    }

    if (profile.summary) {
      sections.push(`Background Summary: ${profile.summary}`);
    }

    const priorities = Array.isArray(profile.keyPriorities) ? (profile.keyPriorities as string[]) : [];
    if (priorities.length > 0) {
      sections.push(`Core Priorities: ${priorities.join(", ")}`);
    }

    const vipDomains = Array.isArray(profile.vipDomains) ? (profile.vipDomains as string[]) : [];
    if (vipDomains.length > 0) {
      sections.push(`VIP Domains: ${vipDomains.join(", ")}`);
    }

    if (profile.items.length > 0) {
      const itemLines = profile.items.map((it) => `- [${it.category}] ${it.key}: ${it.value}`);
      sections.push(`Key Profile Attributes:\n${itemLines.join("\n")}`);
    }

    return sections.length > 0 ? sections.join("\n\n") : null;
  }
}
