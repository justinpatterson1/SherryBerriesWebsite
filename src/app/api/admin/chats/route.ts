import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";
import type { AdminChatMessage, AdminChatSummary } from "@/lib/chat/admin-types";

// Shopping-assistant conversations, read-only.
//   GET                → newest conversations first, 30 a page
//   GET ?before=<iso>  → the page after that updatedAt
//   GET ?id=<id>       → one conversation's full transcript
//
// Fetched on demand when the tab opens rather than in the admin page payload:
// transcripts grow without bound and most admin visits never look at them.

const PAGE = 30;

export async function GET(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (id) {
    const messages = await prisma.chatMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      select: { id: true, role: true, content: true, productSlugs: true, createdAt: true },
    });
    const out: AdminChatMessage[] = messages.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    }));
    return NextResponse.json({ messages: out });
  }

  const before = url.searchParams.get("before");
  const beforeDate = before ? new Date(before) : null;

  const rows = await prisma.chatConversation.findMany({
    where: {
      messageCount: { gt: 0 },
      ...(beforeDate && !Number.isNaN(beforeDate.getTime())
        ? { updatedAt: { lt: beforeDate } }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: PAGE + 1,
    select: {
      id: true,
      updatedAt: true,
      messageCount: true,
      user: { select: { name: true, email: true } },
      messages: {
        where: { role: "user" },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { content: true },
      },
    },
  });

  const chats: AdminChatSummary[] = rows.slice(0, PAGE).map((c) => ({
    id: c.id,
    updatedAt: c.updatedAt.toISOString(),
    messageCount: c.messageCount,
    customer: c.user ? (c.user.name ?? c.user.email) : null,
    preview: c.messages[0]?.content.slice(0, 160) ?? "",
  }));

  return NextResponse.json({ chats, hasMore: rows.length > PAGE });
}
