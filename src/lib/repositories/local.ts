import { useContent } from "@/stores/content";
import { useCourse } from "@/stores/course";
import { useCourseTheme } from "@/stores/course-theme";
import { SYSTEM_THEMES } from "@/lib/theme/system-themes";
import type { ContentRepository, CourseRepository, ThemeRepository } from "./types";

export const localContentRepository: ContentRepository = {
  findAll: () => useContent.getState().items,
  findById: (id) => useContent.getState().items.find((i) => i.id === id),
};

export const localCourseRepository: CourseRepository = {
  get: (courseId) => useCourse.getState().courseData[courseId],
  ensureSeeded: (courseId, options) => useCourse.getState().init(courseId, options),
};

export const localThemeRepository: ThemeRepository = {
  get: (courseId) => useCourseTheme.getState().getTheme(courseId),
  set: (courseId, theme) => useCourseTheme.getState().setTheme(courseId, theme),
  listSystemThemes: () => Object.values(SYSTEM_THEMES),
};
