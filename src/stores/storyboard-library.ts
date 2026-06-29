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

type PresetItem = { type: string; title: string; intent: string; image: string };

const sb = (
  id: string,
  sections: { title: string; items: PresetItem[] }[],
): Storyboard => ({
  sections: sections.map((s, si) => ({
    id: `${id}_sec${si}`,
    title: s.title,
    items: s.items.map((it, ii) => ({
      id: `${id}_sec${si}_it${ii}`,
      blockType: it.type as Storyboard["sections"][number]["items"][number]["blockType"],
      title: it.title,
      intent: it.intent,
      learningGoal: it.intent,
      image: it.image,
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
      { title: "Gắn kết (Engage)", items: [
        { type: "callout", title: "Tình huống mở đầu", intent: "Đặt tình huống thực tế khơi gợi tò mò", image: "engage" },
        { type: "video", title: "Clip dẫn nhập", intent: "Clip ngắn dẫn nhập", image: "video" }] },
      { title: "Khám phá (Explore)", items: [
        { type: "text", title: "Hoạt động tìm tòi", intent: "Hoạt động tìm tòi, đặt câu hỏi", image: "explore" },
        { type: "image", title: "Quan sát hình ảnh", intent: "Hình ảnh/đồ thị quan sát", image: "math" }] },
      { title: "Giải thích (Explain)", items: [
        { type: "text", title: "Khái niệm cốt lõi", intent: "Hình thành khái niệm cốt lõi", image: "explain" },
        { type: "accordion", title: "Mở rộng định nghĩa", intent: "Mở rộng định nghĩa, tính chất", image: "reading" }] },
      { title: "Vận dụng (Elaborate)", items: [
        { type: "process", title: "Quy trình áp dụng", intent: "Quy trình áp dụng vào bài tập", image: "physics" }] },
      { title: "Đánh giá (Evaluate)", items: [
        { type: "quiz", title: "Kiểm tra hiểu bài", intent: "3 câu kiểm tra hiểu bài", image: "assess" }] },
    ]),
  },
  {
    id: "sys_revise",
    name: "Khung ôn tập nhanh",
    source: "system",
    description: "Tóm tắt · Thẻ ghi nhớ · Luyện đề",
    createdAt: 0,
    storyboard: sb("sys_revise", [
      { title: "Tóm tắt trọng tâm", items: [
        { type: "text", title: "Hệ thống kiến thức", intent: "Hệ thống lại kiến thức chính", image: "recap" },
        { type: "callout", title: "Điểm dễ nhầm", intent: "Lưu ý điểm dễ nhầm", image: "engage" }] },
      { title: "Ghi nhớ", items: [
        { type: "flashcards", title: "Thẻ thuật ngữ", intent: "Bộ thẻ thuật ngữ", image: "reading" }] },
      { title: "Luyện đề", items: [
        { type: "quiz", title: "Câu hỏi nhận biết", intent: "Câu hỏi nhận biết", image: "assess" },
        { type: "quiz", title: "Câu hỏi vận dụng", intent: "Câu hỏi vận dụng", image: "math" }] },
    ]),
  },
  {
    id: "sys_basic",
    name: "Bài giảng cơ bản",
    source: "system",
    description: "Mở đầu · Nội dung · Củng cố",
    createdAt: 0,
    storyboard: sb("sys_basic", [
      { title: "Mở đầu", items: [
        { type: "text", title: "Giới thiệu bài", intent: "Giới thiệu chủ đề và mục tiêu", image: "engage" }] },
      { title: "Nội dung chính", items: [
        { type: "section", title: "Mốc kiến thức", intent: "Mốc phần kiến thức", image: "explain" },
        { type: "text", title: "Trình bày khái niệm", intent: "Trình bày khái niệm", image: "explore" },
        { type: "image", title: "Hình minh hoạ", intent: "Hình minh hoạ", image: "nature" }] },
      { title: "Củng cố", items: [
        { type: "quiz", title: "Câu hỏi củng cố", intent: "Câu hỏi củng cố", image: "assess" },
        { type: "text", title: "Tổng kết bài", intent: "Tổng kết bài học", image: "recap" }] },
    ]),
  },
];

interface StoryboardLibraryState {
  items: StoryboardLibraryItem[];
  add: (item: { name: string; subject?: string; description?: string; storyboard: Storyboard }) => string;
  update: (id: string, patch: { name?: string; subject?: string; description?: string; storyboard?: Storyboard }) => void;
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
      update: (id, patch) =>
        set({ items: get().items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }),
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
