import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ContentItem,
  ContentStatus,
  ContentType,
  CreationCategory,
  LearningMaterialSubtype,
  Platform,
  RoleId,
} from "@/lib/types";
import { SEED_CONTENT } from "@/lib/mock-data";
import { mergeContentItems } from "@/lib/stores/merge-content";

interface ContentState {
  items: ContentItem[];
  createDraft: (
    type: ContentType,
    ownerId: RoleId,
    options?: {
      category?: CreationCategory;
      materialSubtype?: LearningMaterialSubtype;
      ownerNodeId?: string;
    },
  ) => string;
  updateItem: (id: string, patch: Partial<ContentItem>) => void;
  deleteItem: (id: string) => void;
  duplicateItem: (id: string) => string | null;
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
      createDraft: (type, ownerId, options) => {
        const id = `c_${Date.now()}`;
        const category =
          options?.category ?? (type === "book" || type === "course" ? type : "learning_material");
        const materialSubtype = options?.materialSubtype ?? (type === "quiz" ? "quiz" : undefined);
        const titleByType: Record<CreationCategory, string> = {
          book: "Book chưa đặt tên",
          course: "Course chưa đặt tên",
          learning_material: materialSubtype
            ? `Learning Materials: ${materialSubtype} chưa đặt tên`
            : "Learning Materials chưa đặt tên",
        };
        const item: ContentItem = {
          id,
          title: titleByType[category],
          type: category,
          legacyType: type === "quiz" || type === "material" ? type : undefined,
          category,
          materialType:
            materialSubtype ?? (category === "learning_material" ? undefined : category),
          materialSubtype,
          status: "draft",
          ownerId,
          ownerNodeId: options?.ownerNodeId,
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
      duplicateItem: (id) => {
        const source = get().items.find((i) => i.id === id);
        if (!source) return null;
        const newId = `c_${Date.now()}`;
        const copy: ContentItem = {
          ...source,
          id: newId,
          title: `${source.title} (bản sao)`,
          status: "draft",
          views: 0,
          likes: 0,
          shares: 0,
          createdAt: new Date().toISOString().slice(0, 10),
          platforms: [],
        };
        set({ items: [copy, ...get().items] });
        return newId;
      },
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
    {
      name: "gk-content",
      version: 3,
      // Lưu ý: khi bump version, persist chạy migrate RỒI merge — cả hai cùng gọi
      // mergeContentItems. Điều này an toàn vì mergeContentItems idempotent (lọc id
      // seed ra rồi nối seed lại → chạy 2 lần cho cùng kết quả, không nhân đôi).
      // Migrate KHÔNG hủy: giữ item người dùng, làm mới seed.
      migrate: (persisted) => {
        const items = (persisted as { items?: ContentItem[] } | undefined)?.items ?? [];
        return { items: mergeContentItems(items, SEED_CONTENT) };
      },
      // Khi nạp state cũ cùng version: vẫn refresh seed + giữ user item.
      merge: (persisted, current) => ({
        ...current,
        items: mergeContentItems(
          (persisted as { items?: ContentItem[] } | undefined)?.items ?? [],
          SEED_CONTENT,
        ),
      }),
    },
  ),
);
