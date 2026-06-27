import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Storyboard, StoryboardItem } from "@/lib/ai/types";

/* ─── Status type ───────────────────────────────────────────────── */

export type StoryboardStatus = "idle" | "planning" | "ready" | "filling" | "done";

/* ─── State / Actions ───────────────────────────────────────────── */

interface StoryboardState {
  byLesson: Record<string, Storyboard | undefined>;
  status: Record<string, StoryboardStatus>;

  setStoryboard: (lessonId: string, sb: Storyboard) => void;
  updateItem: (
    lessonId: string,
    sectionId: string,
    itemId: string,
    patch: Partial<StoryboardItem>,
  ) => void;
  removeItem: (lessonId: string, sectionId: string, itemId: string) => void;
  moveItem: (
    lessonId: string,
    sectionId: string,
    itemId: string,
    dir: "up" | "down",
  ) => void;
  setStatus: (lessonId: string, status: StoryboardStatus) => void;
  clear: (lessonId: string) => void;
}

/* ─── Non-destructive migrate ───────────────────────────────────── */

function migrate(
  persisted: unknown,
  _version: number,
): Pick<StoryboardState, "byLesson" | "status"> {
  const p = (persisted ?? {}) as Partial<Pick<StoryboardState, "byLesson" | "status">>;
  return {
    byLesson: p.byLesson ?? {},
    status: p.status ?? {},
  };
}

/* ─── Store ─────────────────────────────────────────────────────── */

export const useStoryboard = create<StoryboardState>()(
  persist(
    (set, get) => ({
      byLesson: {},
      status: {},

      setStoryboard: (lessonId, sb) => {
        set({
          byLesson: { ...get().byLesson, [lessonId]: sb },
        });
      },

      updateItem: (lessonId, sectionId, itemId, patch) => {
        const sb = get().byLesson[lessonId];
        if (!sb) return;
        set({
          byLesson: {
            ...get().byLesson,
            [lessonId]: {
              ...sb,
              sections: sb.sections.map((sec) => {
                if (sec.id !== sectionId) return sec;
                return {
                  ...sec,
                  items: sec.items.map((item) =>
                    item.id === itemId ? { ...item, ...patch } : item,
                  ),
                };
              }),
            },
          },
        });
      },

      removeItem: (lessonId, sectionId, itemId) => {
        const sb = get().byLesson[lessonId];
        if (!sb) return;
        set({
          byLesson: {
            ...get().byLesson,
            [lessonId]: {
              ...sb,
              sections: sb.sections.map((sec) => {
                if (sec.id !== sectionId) return sec;
                return {
                  ...sec,
                  items: sec.items.filter((item) => item.id !== itemId),
                };
              }),
            },
          },
        });
      },

      moveItem: (lessonId, sectionId, itemId, dir) => {
        const sb = get().byLesson[lessonId];
        if (!sb) return;
        set({
          byLesson: {
            ...get().byLesson,
            [lessonId]: {
              ...sb,
              sections: sb.sections.map((sec) => {
                if (sec.id !== sectionId) return sec;
                const items = [...sec.items];
                const idx = items.findIndex((i) => i.id === itemId);
                if (idx < 0) return sec;
                const targetIdx = dir === "up" ? idx - 1 : idx + 1;
                if (targetIdx < 0 || targetIdx >= items.length) return sec;
                const next = [...items];
                [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
                return { ...sec, items: next };
              }),
            },
          },
        });
      },

      setStatus: (lessonId, status) => {
        set({ status: { ...get().status, [lessonId]: status } });
      },

      clear: (lessonId) => {
        const { byLesson, status } = get();
        const nextByLesson = { ...byLesson };
        const nextStatus = { ...status };
        delete nextByLesson[lessonId];
        delete nextStatus[lessonId];
        set({ byLesson: nextByLesson, status: nextStatus });
      },
    }),
    {
      name: "gk-storyboard",
      version: 1,
      migrate: (persisted, version) =>
        migrate(persisted, version) as StoryboardState,
      partialize: (state) => ({
        byLesson: state.byLesson,
        status: state.status,
      }),
    },
  ),
);
