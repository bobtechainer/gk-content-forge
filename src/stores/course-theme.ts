import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CourseTheme } from "@/lib/theme/resolve";

interface CourseThemeState {
  byCourse: Record<string, CourseTheme>;
  setTheme: (courseId: string, theme: CourseTheme) => void;
  getTheme: (courseId: string) => CourseTheme | undefined;
  clear: (courseId: string) => void;
}

export const useCourseTheme = create<CourseThemeState>()(
  persist(
    (set, get) => ({
      byCourse: {},

      setTheme: (courseId, theme) =>
        set({ byCourse: { ...get().byCourse, [courseId]: theme } }),

      getTheme: (courseId) => get().byCourse[courseId],

      clear: (courseId) => {
        const { [courseId]: _removed, ...rest } = get().byCourse;
        set({ byCourse: rest });
      },
    }),
    {
      name: "gk-course-theme",
      version: 1,
      partialize: (s) => ({ byCourse: s.byCourse }),
      migrate: (persisted) => ({
        byCourse: (persisted as { byCourse?: Record<string, CourseTheme> } | undefined)?.byCourse ?? {},
      }),
    },
  ),
);
