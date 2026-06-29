import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Storyboard } from "@/lib/ai/types";

/* Kho "Dàn ý mẫu" (Storyboard) — module dùng lại được. Preset hệ thống là hằng số
   (luôn mới), chỉ item của người dùng mới được persist. */

export interface StoryboardLibraryItem {
  id: string;
  name: string;
  source: "system" | "user";
  subject?: string;
  description?: string;
  storyboard: Storyboard;
  createdAt: number;
}

const sb = (
  id: string,
  sections: { title: string; items: { type: string; intent: string }[] }[],
): Storyboard => ({
  sections: sections.map((s, si) => ({
    id: `${id}_sec${si}`,
    title: s.title,
    items: s.items.map((it, ii) => ({
      id: `${id}_sec${si}_it${ii}`,
      blockType: it.type as Storyboard["sections"][number]["items"][number]["blockType"],
      intent: it.intent,
      learningGoal: it.intent,
    })),
  })),
});

export const STORYBOARD_PRESETS: StoryboardLibraryItem[] = [
  {
    id: "sys_5e",
    name: "Khung 5E (khám phá)",
    source: "system",
    description: "Engage · Explore · Explain · Elaborate · Evaluate",
    createdAt: 0,
    storyboard: sb("sys_5e", [
      { title: "Gắn kết (Engage)", items: [{ type: "callout", intent: "Đặt tình huống thực tế khơi gợi tò mò" }, { type: "video", intent: "Clip ngắn dẫn nhập" }] },
      { title: "Khám phá (Explore)", items: [{ type: "text", intent: "Hoạt động tìm tòi, đặt câu hỏi" }, { type: "image", intent: "Hình ảnh/đồ thị quan sát" }] },
      { title: "Giải thích (Explain)", items: [{ type: "text", intent: "Hình thành khái niệm cốt lõi" }, { type: "accordion", intent: "Mở rộng định nghĩa, tính chất" }] },
      { title: "Vận dụng (Elaborate)", items: [{ type: "process", intent: "Quy trình áp dụng vào bài tập" }] },
      { title: "Đánh giá (Evaluate)", items: [{ type: "quiz", intent: "3 câu kiểm tra hiểu bài" }] },
    ]),
  },
  {
    id: "sys_revise",
    name: "Khung ôn tập nhanh",
    source: "system",
    description: "Tóm tắt · Thẻ ghi nhớ · Luyện đề",
    createdAt: 0,
    storyboard: sb("sys_revise", [
      { title: "Tóm tắt trọng tâm", items: [{ type: "text", intent: "Hệ thống lại kiến thức chính" }, { type: "callout", intent: "Lưu ý điểm dễ nhầm" }] },
      { title: "Ghi nhớ", items: [{ type: "flashcards", intent: "Bộ thẻ thuật ngữ" }] },
      { title: "Luyện đề", items: [{ type: "quiz", intent: "Câu hỏi nhận biết" }, { type: "quiz", intent: "Câu hỏi vận dụng" }] },
    ]),
  },
  {
    id: "sys_basic",
    name: "Bài giảng cơ bản",
    source: "system",
    description: "Mở đầu · Nội dung · Củng cố",
    createdAt: 0,
    storyboard: sb("sys_basic", [
      { title: "Mở đầu", items: [{ type: "text", intent: "Giới thiệu chủ đề và mục tiêu" }] },
      { title: "Nội dung chính", items: [{ type: "section", intent: "Mốc phần kiến thức" }, { type: "text", intent: "Trình bày khái niệm" }, { type: "image", intent: "Hình minh hoạ" }] },
      { title: "Củng cố", items: [{ type: "quiz", intent: "Câu hỏi củng cố" }, { type: "text", intent: "Tổng kết bài học" }] },
    ]),
  },
];

interface StoryboardLibraryState {
  items: StoryboardLibraryItem[];
  add: (item: { name: string; subject?: string; description?: string; storyboard: Storyboard }) => string;
  remove: (id: string) => void;
}

export const useStoryboardLibrary = create<StoryboardLibraryState>()(
  persist(
    (set, get) => ({
      items: [],
      add: ({ name, subject, description, storyboard }) => {
        const id = `usb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        set({ items: [{ id, name, subject, description, storyboard, source: "user", createdAt: Date.now() }, ...get().items] });
        return id;
      },
      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
    }),
    {
      name: "gk-storyboard-library",
      version: 1,
      partialize: (s) => ({ items: s.items }),
      migrate: (p) => ({ items: (p as { items?: StoryboardLibraryItem[] } | undefined)?.items ?? [] }),
    },
  ),
);

/** Tất cả dàn ý mẫu: preset hệ thống + của người dùng. */
export function allStoryboardItems(userItems: StoryboardLibraryItem[]): StoryboardLibraryItem[] {
  return [...STORYBOARD_PRESETS, ...userItems];
}
