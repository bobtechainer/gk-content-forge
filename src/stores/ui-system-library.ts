import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CourseTheme } from "@/lib/theme/resolve";
import { SYSTEM_THEMES } from "@/lib/theme/system-themes";

/* Kho "Giao diện" (UI System) — module dùng lại được. Preset hệ thống lấy từ
   SYSTEM_THEMES (hằng số), chỉ giao diện người dùng tự lưu mới được persist. */

export interface UiSystemLibraryItem {
  id: string;
  name: string;
  source: "system" | "user";
  description?: string;
  theme: CourseTheme;
  createdAt: number;
}

const PRESET_LABELS: Record<string, { name: string; description: string }> = {
  "mobifone-default": { name: "MobiFone", description: "Xanh dương · tin cậy" },
  stem: { name: "STEM", description: "Xanh ngọc · khoa học" },
  humanities: { name: "Nhân văn", description: "Tím · cổ điển" },
  "mam-non": { name: "Mầm non", description: "Cam · vui tươi" },
  "trung-hoc": { name: "Trung học", description: "Xanh lá · năng động" },
  dark: { name: "Tối (Dark)", description: "Nền tối · hiện đại" },
};

export const UI_SYSTEM_PRESETS: UiSystemLibraryItem[] = Object.entries(SYSTEM_THEMES).map(([id, theme]) => ({
  id: `sys_${id}`,
  name: PRESET_LABELS[id]?.name ?? id,
  description: PRESET_LABELS[id]?.description,
  source: "system",
  theme,
  createdAt: 0,
}));

interface UiSystemLibraryState {
  items: UiSystemLibraryItem[];
  add: (item: { name: string; description?: string; theme: CourseTheme }) => string;
  update: (id: string, patch: { name?: string; description?: string; theme?: CourseTheme }) => void;
  remove: (id: string) => void;
}

export const useUiSystemLibrary = create<UiSystemLibraryState>()(
  persist(
    (set, get) => ({
      items: [],
      add: ({ name, description, theme }) => {
        const id = `uis_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        set({ items: [{ id, name, description, theme, source: "user", createdAt: Date.now() }, ...get().items] });
        return id;
      },
      update: (id, patch) =>
        set({ items: get().items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }),
      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
    }),
    {
      name: "gk-ui-system-library",
      version: 1,
      partialize: (s) => ({ items: s.items }),
      migrate: (p) => ({ items: (p as { items?: UiSystemLibraryItem[] } | undefined)?.items ?? [] }),
    },
  ),
);

/** Tất cả giao diện: preset hệ thống + của người dùng. */
export function allUiSystemItems(userItems: UiSystemLibraryItem[]): UiSystemLibraryItem[] {
  return [...UI_SYSTEM_PRESETS, ...userItems];
}
