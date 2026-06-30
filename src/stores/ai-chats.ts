import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage } from "@/components/course/ai-chat-types";

export interface AiConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

interface AiChatsState {
  byCourse: Record<string, AiConversation[]>;
  /** Upsert một cuộc trò chuyện theo courseId (mới nhất lên đầu). */
  save: (courseId: string, conv: AiConversation) => void;
  remove: (courseId: string, id: string) => void;
}

export const useAiChats = create<AiChatsState>()(
  persist(
    (set, get) => ({
      byCourse: {},
      save: (courseId, conv) => {
        const list = get().byCourse[courseId] ?? [];
        const next = [conv, ...list.filter((c) => c.id !== conv.id)].sort((a, b) => b.updatedAt - a.updatedAt);
        set({ byCourse: { ...get().byCourse, [courseId]: next } });
      },
      remove: (courseId, id) => {
        const list = get().byCourse[courseId] ?? [];
        set({ byCourse: { ...get().byCourse, [courseId]: list.filter((c) => c.id !== id) } });
      },
    }),
    {
      name: "gk-ai-chats",
      version: 1,
      partialize: (s) => ({ byCourse: s.byCourse }),
      migrate: (p) => ({ byCourse: (p as { byCourse?: Record<string, AiConversation[]> } | undefined)?.byCourse ?? {} }),
    },
  ),
);
