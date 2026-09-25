import "server-only";
import { db } from "@/server/repositories/db";
import { ConversationChannel, AssistantMessageRole } from "@prisma/client";
import { logger } from "@/lib/logger";

export class ConversationService {
  /**
   * Retrieves or creates a deterministic, user-scoped conversation context.
   */
  static async getOrCreateConversation(
    userId: string,
    channel: ConversationChannel,
    channelChatId: string
  ) {
    let conversation = await db.assistantConversation.findUnique({
      where: {
        userId_channel_channelChatId: {
          userId,
          channel,
          channelChatId,
        },
      },
    });

    if (!conversation) {
      conversation = await db.assistantConversation.create({
        data: {
          userId,
          channel,
          channelChatId,
        },
      });
    }

    return conversation;
  }

  /**
   * Records an inbound message from user with full provider metadata.
   */
  static async recordInboundMessage(params: {
    conversationId: string;
    channel: ConversationChannel;
    provider: string; // "META", "BAILEYS", "TELEGRAM"
    providerMessageId: string;
    content: string;
    referencedEmailId?: string;
    referencedResearchId?: string;
  }) {
    return await db.assistantMessage.create({
      data: {
        conversationId: params.conversationId,
        role: "USER",
        content: params.content,
        channel: params.channel,
        provider: params.provider,
        providerMessageId: params.providerMessageId,
        referencedEmailId: params.referencedEmailId,
        referencedResearchId: params.referencedResearchId,
      },
    });
  }

  /**
   * Records an outbound reply from assistant.
   */
  static async recordOutboundMessage(params: {
    conversationId: string;
    channel: ConversationChannel;
    content: string;
    referencedEmailId?: string;
    referencedResearchId?: string;
  }) {
    return await db.assistantMessage.create({
      data: {
        conversationId: params.conversationId,
        role: "ASSISTANT",
        content: params.content,
        channel: params.channel,
        provider: "SYSTEM",
        providerMessageId: null,
        referencedEmailId: params.referencedEmailId,
        referencedResearchId: params.referencedResearchId,
      },
    });
  }

  /**
   * Updates deterministic active context on conversation.
   * Strictly enforces user ownership of referenced emails and research sessions.
   */
  static async updateActiveContext(
    conversationId: string,
    userId: string,
    updates: {
      activeEmailId?: string | null;
      activeResearchId?: string | null;
    }
  ) {
    const dataToUpdate: any = {};

    if (updates.activeEmailId !== undefined) {
      if (updates.activeEmailId === null) {
        dataToUpdate.activeEmailId = null;
      } else {
        // Validate user owns this email
        const email = await db.email.findFirst({
          where: {
            id: updates.activeEmailId,
            emailAccount: { userId },
          },
        });
        if (email) {
          dataToUpdate.activeEmailId = updates.activeEmailId;
        } else {
          logger.warn(`[CONVERSATION_SERVICE] Unauthorized email context reference ${updates.activeEmailId} by user ${userId}`);
        }
      }
    }

    if (updates.activeResearchId !== undefined) {
      if (updates.activeResearchId === null) {
        dataToUpdate.activeResearchId = null;
      } else {
        // Validate user owns this research session
        const research = await db.researchSession.findFirst({
          where: {
            id: updates.activeResearchId,
            userId,
          },
        });
        if (research) {
          dataToUpdate.activeResearchId = updates.activeResearchId;
        }
      }
    }

    if (Object.keys(dataToUpdate).length > 0) {
      return await db.assistantConversation.updateMany({
        where: { id: conversationId, userId },
        data: dataToUpdate,
      });
    }
  }

  static updateContext = ConversationService.updateActiveContext;

  /**
   * Gets recent message history formatted for AI context.
   */
  static async getRecentHistory(conversationId: string, limit = 10) {
    const messages = await db.assistantMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return messages.reverse().map((m) => ({
      role: m.role as "USER" | "ASSISTANT" | "SYSTEM",
      content: m.content,
    }));
  }
}
