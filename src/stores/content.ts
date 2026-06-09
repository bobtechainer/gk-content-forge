import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ContentItem, ContentStatus, ContentType, Platform, RoleId } from "@/lib/types";
import { SEED_CONTENT } from "@/lib/mock-data";

interface ContentState {
  items: ContentItem[];
  createDraft: (type: ContentType, ownerId: RoleId) => string;
  updateItem: (id: string, patch: Partial<ContentItem>) => void;
  deleteItem: (id: string) => void;
  setStatus: (id: string, status: ContentStatus) => void;
  publish: (
    id: string,
    args: {
      tags: string[];
      description: string;
      platforms: Platform[];
      subject: string;
      grade: string;
      ownerVerified: boolean;
    },
  ) => void;
}

export const useContent = create<ContentState>()(
  persist(
    (set, get) => ({
      items: SEED_CONTENT,
      createDraft: (type, ownerId) => {
        const id = `c_${Date.now()}`;
        const item: ContentItem = {
          id,
          title: type === "quiz" ? "Bộ đề chưa đặt tên" : "Học liệu chưa đặt tên",
          type,
          status: "draft",
          ownerId,
          createdAt: new Date().toISOString().slice(0, 10),
          views: 0,
          likes: 0,
          shares: 0,
          thumbnailColor: "#2563EB",
          subject: "Toán",
          grade: "Lớp 8",
          platforms: [],
          tags: [],
          description: "",
        };
        set({ items: [item, ...get().items] });
        return id;
      },
      updateItem: (id, patch) =>
        set({ items: get().items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }),
      deleteItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      setStatus: (id, status) =>
        set({ items: get().items.map((i) => (i.id === id ? { ...i, status } : i)) }),
      publish: (id, args) => {
        const status: ContentStatus = args.ownerVerified ? "published" : "pending";
        set({
          items: get().items.map((i) =>
            i.id === id
              ? {
                  ...i,
                  status,
                  tags: args.tags,
                  description: args.description,
                  platforms: args.platforms,
                  subject: args.subject,
                  grade: args.grade,
                }
              : i,
          ),
        });
      },
    }),
    { name: "gk-content" },
  ),
);