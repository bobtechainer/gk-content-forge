import type { ContentItem } from "@/lib/types";
import type { CourseData } from "@/stores/course";

export interface ContentRepository {
  findAll(): ContentItem[];
  findById(id: string): ContentItem | undefined;
}

export interface CourseRepository {
  get(courseId: string): CourseData | undefined;
  ensureSeeded(courseId: string): void;
}
