import { describe, it, expect, vi } from "vitest";
import {
  applyStoryboardAsCourseOutline,
  applyStoryboardAsLessonOutline,
  itemTitle,
  storyboardStats,
} from "./apply-storyboard";
import type { Storyboard } from "@/lib/ai/types";

/** Storyboard mẫu: 2 section, tổng 3 item. */
const sb: Storyboard = {
  sections: [
    {
      id: "sec_1",
      title: "Mở đầu",
      items: [
        { id: "it_1", blockType: "text", title: "Giới thiệu", intent: "Giới thiệu chủ đề", learningGoal: "" },
        { id: "it_2", blockType: "video", title: "Clip dẫn nhập", intent: "Clip ngắn", learningGoal: "" },
      ],
    },
    {
      id: "sec_2",
      title: "Củng cố",
      items: [
        { id: "it_3", blockType: "quiz", intent: "Câu hỏi ôn tập", learningGoal: "" },
      ],
    },
  ],
};

describe("storyboardStats", () => {
  it("counts sections and items", () => {
    expect(storyboardStats(sb)).toEqual({ sections: 2, items: 3 });
  });
});

describe("itemTitle", () => {
  it("prefers title, falls back to intent then a default", () => {
    expect(itemTitle({ id: "a", blockType: "text", title: "T", intent: "I", learningGoal: "" })).toBe("T");
    expect(itemTitle({ id: "b", blockType: "text", intent: "I", learningGoal: "" })).toBe("I");
    expect(itemTitle({ id: "c", blockType: "text", intent: "", learningGoal: "" })).toBe("Mục mới");
  });
});

describe("applyStoryboardAsCourseOutline", () => {
  it("maps each section to a chapter and each item to a lesson under it", () => {
    const addChapter = vi.fn((_title: string) => `ch_${_title}`);
    const addLesson = vi.fn();

    const result = applyStoryboardAsCourseOutline(sb, { addChapter, addLesson });

    expect(result).toEqual({ chapters: 2, lessons: 3 });
    expect(addChapter).toHaveBeenCalledTimes(2);
    expect(addChapter).toHaveBeenNthCalledWith(1, "Mở đầu");
    expect(addChapter).toHaveBeenNthCalledWith(2, "Củng cố");
    expect(addLesson).toHaveBeenCalledTimes(3);
    // Bài dưới đúng chương cha; item không có title dùng intent.
    expect(addLesson).toHaveBeenNthCalledWith(1, "ch_Mở đầu", "Giới thiệu");
    expect(addLesson).toHaveBeenNthCalledWith(2, "ch_Mở đầu", "Clip dẫn nhập");
    expect(addLesson).toHaveBeenNthCalledWith(3, "ch_Củng cố", "Câu hỏi ôn tập");
  });
});

describe("applyStoryboardAsLessonOutline", () => {
  const makeApi = () => {
    let n = 0;
    const addBlock = vi.fn((_lessonId: string, _type: string) => `blk_${n++}`);
    const updateBlock = vi.fn();
    const fillBlock = vi.fn(() => Promise.resolve({ content: "nội dung mẫu" }));
    return { addBlock, updateBlock, fillBlock };
  };

  it("adds a section marker per section plus one block per item, for one lesson", async () => {
    const api = makeApi();
    const result = await applyStoryboardAsLessonOutline(sb, ["l1"], api);

    // 2 section markers + 3 item blocks = 5 khối.
    expect(result).toEqual({ lessons: 1, blocks: 5 });
    expect(api.addBlock).toHaveBeenCalledTimes(5);
    expect(api.fillBlock).toHaveBeenCalledTimes(3);
    // Khối đầu là section marker mang tiêu đề section.
    expect(api.addBlock).toHaveBeenNthCalledWith(1, "l1", "section");
    expect(api.updateBlock).toHaveBeenNthCalledWith(1, "l1", "blk_0", { content: "Mở đầu", aiGenerated: true });
    // Item block giữ đúng blockType và gắn aiGenerated.
    expect(api.addBlock).toHaveBeenNthCalledWith(2, "l1", "text");
  });

  it("applies to every lesson when scope is the whole course", async () => {
    const api = makeApi();
    const result = await applyStoryboardAsLessonOutline(sb, ["l1", "l2"], api);

    expect(result.lessons).toBe(2);
    expect(result.blocks).toBe(10); // 5 khối × 2 bài
    expect(api.fillBlock).toHaveBeenCalledTimes(6);
  });

  it("does nothing when there are no lessons", async () => {
    const api = makeApi();
    const result = await applyStoryboardAsLessonOutline(sb, [], api);
    expect(result).toEqual({ lessons: 0, blocks: 0 });
    expect(api.addBlock).not.toHaveBeenCalled();
  });
});
