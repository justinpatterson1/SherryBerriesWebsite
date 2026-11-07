import "server-only";
import { prisma } from "@/lib/db";
import { HISTORY_LIMIT, type StoredMessage } from "@/lib/chat/request";

/**
 * The conversation to continue, or a new one.
 *
 * An id only resumes a conversation when the anonId matches too, so guessing
 * or reusing someone else's id cannot read their history into your chat.
 */
export async function resolveConversation(opts: {
  conversationId: string | null;
  anonId: string;
  userId: string | null;
}): Promise<{ id: string; history: StoredMessage[] }> {
  if (opts.conversationId) {
    const existing = await prisma.chatConversation.findFirst({
      where: { id: opts.conversationId, anonId: opts.anonId },
      select: {
        id: true,
        userId: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: HISTORY_LIMIT,
          select: { role: true, content: true, productSlugs: true },
        },
      },
    });
    if (existing) {
      // A guest who signs in mid-chat: attach the conversation to the account.
      if (!existing.userId && opts.userId)
        await prisma.chatConversation.update({
          where: { id: existing.id },
          data: { userId: opts.userId },
        });
      return { id: existing.id, history: existing.messages.reverse() };
    }
  }

  const created = await prisma.chatConversation.create({
    data: { anonId: opts.anonId, userId: opts.userId },
    select: { id: true },
  });
  return { id: created.id, history: [] };
}

export async function saveChatMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  productSlugs: string[] = [],
): Promise<void> {
  await prisma.$transaction([
    prisma.chatMessage.create({
      data: { conversationId, role, content, productSlugs },
    }),
    prisma.chatConversation.update({
      where: { id: conversationId },
      data: { messageCount: { increment: 1 } },
    }),
  ]);
}
