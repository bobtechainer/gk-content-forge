import { useContent } from "@/stores/content";
import { useCourse } from "@/stores/course";
import type { ContentRepository, CourseRepository } from "./types";

export const localContentRepository: ContentRepository = {
  findAll: () => useContent.getState().items,
  findById: (id) => useContent.getState().items.find((i) => i.id === id),
};

export const localCourseRepository: CourseRepository = {
  get: (courseId) => useCourse.getState().courseData[courseId],
  ensureSeeded: (courseId) => useCourse.getState().init(courseId),
};
