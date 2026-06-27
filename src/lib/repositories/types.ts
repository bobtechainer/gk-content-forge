import type { ContentItem } from "@/lib/types";
import type { CourseData } from "@/stores/course";
import type { CourseTheme } from "@/lib/theme/resolve";

export interface ContentRepository {
  findAll(): ContentItem[];
  findById(id: string): ContentItem | undefined;
}

export interface CourseRepository {
  get(courseId: string): CourseData | undefined;
  ensureSeeded(courseId: string): void;
}

export interface ThemeRepository {
  get(courseId: string): CourseTheme | undefined;
  set(courseId: string, theme: CourseTheme): void;
  listSystemThemes(): CourseTheme[];
}
