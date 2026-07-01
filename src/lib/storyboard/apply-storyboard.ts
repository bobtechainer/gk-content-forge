import type { Storyboard, StoryboardItem } from "@/lib/ai/types";
import type { CourseBlock, CourseBlockType } from "@/stores/course";

/* Bộ định tuyến "áp dụng storyboard" — logic thuần, tách khỏi store/UI để
   test độc lập. Một `Storyboard` (sections + items) được CHIẾU thành:
   - Mục lục khoá học: mỗi section → 1 Chương, mỗi item → 1 Bài.
   - Dàn ý bài học: mỗi section → 1 khối "mục", mỗi item → 1 khối nội dung. */

export type ApplyMode = "course-outline" | "lesson-outline";
export type LessonScope = "lesson" | "course";

/** Tiêu đề dùng cho một item khi chiếu sang Bài/khối (có dự phòng). */
export function itemTitle(item: StoryboardItem): string {
  return item.title?.trim() || item.intent?.trim() || "Mục mới";
}

/** Đếm nhanh để hiển thị và cảnh báo trước khi áp. */
export function storyboardStats(sb: Storyboard): { sections: number; items: number } {
  return {
    sections: sb.sections.length,
    items: sb.sections.reduce((n, s) => n + s.items.length, 0),
  };
}

/* ─── Mục lục khoá học ─────────────────────────────────────────────── */

export interface CourseOutlineApi {
  /** Thêm một chương ở gốc khoá, trả về id chương. */
  addChapter: (title: string) => string;
  /** Thêm một bài dưới chương. */
  addLesson: (chapterId: string, title: string) => void;
}

export interface CourseOutlineResult {
  chapters: number;
  lessons: number;
}

/** Dựng sections/items thành cây Chương/Bài (thêm nối tiếp, không xoá cây cũ). */
export function applyStoryboardAsCourseOutline(
  sb: Storyboard,
  api: CourseOutlineApi,
): CourseOutlineResult {
  let chapters = 0;
  let lessons = 0;
  for (const section of sb.sections) {
    const chapterId = api.addChapter(section.title || `Chương ${chapters + 1}`);
    chapters++;
    for (const item of section.items) {
      api.addLesson(chapterId, itemTitle(item));
      lessons++;
    }
  }
  return { chapters, lessons };
}

/* ─── Dàn ý bài học ────────────────────────────────────────────────── */

export interface LessonFillApi {
  /** Thêm một khối vào bài, trả về id khối. */
  addBlock: (lessonId: string, type: CourseBlockType) => string;
  /** Cập nhật khối. */
  updateBlock: (lessonId: string, blockId: string, patch: Partial<CourseBlock>) => void;
  /** Sinh nội dung cho một item của storyboard (mock AI). */
  fillBlock: (item: StoryboardItem) => Promise<Partial<CourseBlock>>;
}

export interface LessonOutlineResult {
  lessons: number;
  blocks: number;
}

/**
 * Áp dàn ý vào một hoặc nhiều bài: mỗi section tạo một khối "mục" (section
 * marker) rồi lần lượt sinh các khối nội dung cho từng item.
 * `lessonIds` = [bài đang mở] khi áp cho bài này, hoặc tất cả bài khi toàn khoá.
 */
export async function applyStoryboardAsLessonOutline(
  sb: Storyboard,
  lessonIds: string[],
  api: LessonFillApi,
): Promise<LessonOutlineResult> {
  let blocks = 0;
  for (const lessonId of lessonIds) {
    for (const section of sb.sections) {
      const secId = api.addBlock(lessonId, "section");
      api.updateBlock(lessonId, secId, { content: section.title, aiGenerated: true });
      blocks++;
      for (const item of section.items) {
        const patch = await api.fillBlock(item);
        const bid = api.addBlock(lessonId, item.blockType);
        api.updateBlock(lessonId, bid, { ...patch, aiGenerated: true });
        blocks++;
      }
    }
  }
  return { lessons: lessonIds.length, blocks };
}
