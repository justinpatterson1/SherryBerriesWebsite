// Shapes /api/admin/chats returns to the Conversations tab.

export type AdminChatSummary = {
  id: string;
  updatedAt: string;
  messageCount: number;
  customer: string | null;
  preview: string;
};

export type AdminChatMessage = {
  id: string;
  role: string;
  content: string;
  productSlugs: string[];
  createdAt: string;
};
