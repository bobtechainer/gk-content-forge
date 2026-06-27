import type { CourseData } from "@/stores/course";
import { cloneBlockDeep } from "@/stores/course";
import type { CourseBlock } from "@/stores/course";

export interface PublishedLesson {
  id: string;
  title: string;
  blocks: CourseBlock[];
}

export interface PublishedCourse {
  lessons: PublishedLesson[];
  publishedAt: number;
}

/**
 * Tạo snapshot bất biến từ CourseData — deep-clone mọi block để chỉnh sửa
 * sau khi xuất bản không ảnh hưởng đến nội dung mà học sinh đang học.
 *
 * `now` phải truyền từ ngoài (không dùng Date.now bên trong) để hàm thuần
 * và test ổn định.
 */
export function snapshotCourse(data: CourseData, now: number): PublishedCourse {
  return {
    lessons: data.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      blocks: lesson.blocks.map(cloneBlockDeep),
    })),
    publishedAt: now,
  };
}
