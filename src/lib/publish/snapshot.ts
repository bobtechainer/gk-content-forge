import type { CourseData } from "@/stores/course";
import { cloneBlockDeep } from "@/stores/course";
import type { CourseBlock } from "@/stores/course";

/**
 * Tạo một hash ngắn ổn định từ danh sách blocks — dùng để phát hiện thay đổi
 * sau khi xuất bản. Cùng một mảng blocks (cùng thứ tự, cùng nội dung) luôn
 * cho cùng kết quả; bất kỳ thay đổi nào cũng trả về chuỗi khác.
 */
export function hashBlocks(blocks: CourseBlock[]): string {
  const str = JSON.stringify(blocks);
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  // Trả về chuỗi hex dương, độ dài cố định 8 ký tự
  return (h >>> 0).toString(16).padStart(8, "0");
}

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
