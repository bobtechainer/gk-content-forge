import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Attempt {
  lessonId: string;
  blockId: string;
  correct: boolean;
  at: number;
}

interface AttemptsState {
  byLesson: Record<string, Attempt[]>;
  record: (lessonId: string, blockId: string, correct: boolean) => void;
  getByLesson: (lessonId: string) => Attempt[];
  clearLesson: (lessonId: string) => void;
}

export const useAttempts = create<AttemptsState>()(
  persist(
    (set, get) => ({
      byLesson: {},

      record: (lessonId, blockId, correct) => {
        const attempt: Attempt = { lessonId, blockId, correct, at: Date.now() };
        const existing = get().byLesson[lessonId] ?? [];
        set({
          byLesson: {
            ...get().byLesson,
            [lessonId]: [...existing, attempt],
          },
        });
      },

      getByLesson: (lessonId) => get().byLesson[lessonId] ?? [],

      clearLesson: (lessonId) => {
        const { [lessonId]: _removed, ...rest } = get().byLesson;
        set({ byLesson: rest });
      },
    }),
    {
      name: "gk-attempts",
      version: 1,
      partialize: (s) => ({ byLesson: s.byLesson }),
      migrate: (persisted) => ({
        byLesson: (persisted as { byLesson?: Record<string, Attempt[]> })?.byLesson ?? {},
      }),
    },
  ),
);
