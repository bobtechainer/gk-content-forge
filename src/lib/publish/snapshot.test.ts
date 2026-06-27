import { describe, expect, it } from "vitest";
import { snapshotCourse, hashBlocks } from "./snapshot";
import type { CourseData } from "@/stores/course";
import type { CourseBlock } from "@/stores/course";

function makeData(): CourseData {
  return {
    chapters: [],
    lessons: [
      {
        id: "l1",
        title: "Bài 1",
        chapterId: "c",
        blocks: [{ id: "b", type: "text", content: "X" } as any],
      },
    ],
  };
}

const b1: CourseBlock = { id: "b1", type: "text", content: "Xin chào" };
const b2: CourseBlock = { id: "b2", type: "image", content: "url" };

describe("hashBlocks", () => {
  it("cùng blocks → cùng hash", () => {
    expect(hashBlocks([b1, b2])).toBe(hashBlocks([b1, b2]));
  });

  it("thay đổi nội dung → hash khác", () => {
    const changed: CourseBlock = { ...b1, content: "Tạm biệt" };
    expect(hashBlocks([changed, b2])).not.toBe(hashBlocks([b1, b2]));
  });

  it("đổi thứ tự blocks → hash khác", () => {
    expect(hashBlocks([b2, b1])).not.toBe(hashBlocks([b1, b2]));
  });

  it("mảng rỗng → hash ổn định", () => {
    expect(hashBlocks([])).toBe(hashBlocks([]));
  });

  it("trả về chuỗi hex 8 ký tự", () => {
    const h = hashBlocks([b1]);
    expect(h).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe("snapshotCourse", () => {
  it("deep-clones blocks so later edits don't mutate the snapshot", () => {
    const data = makeData();
    const snap = snapshotCourse(data, 1000);
    data.lessons[0].blocks[0].content = "CHANGED";
    expect(snap.lessons[0].blocks[0].content).toBe("X");
    expect(snap.publishedAt).toBe(1000);
  });

  it("preserves lesson id and title in snapshot", () => {
    const data = makeData();
    const snap = snapshotCourse(data, 2000);
    expect(snap.lessons[0].id).toBe("l1");
    expect(snap.lessons[0].title).toBe("Bài 1");
    expect(snap.publishedAt).toBe(2000);
  });

  it("handles empty lessons list", () => {
    const emptyData: CourseData = { chapters: [], lessons: [] };
    const snap = snapshotCourse(emptyData, 500);
    expect(snap.lessons).toHaveLength(0);
    expect(snap.publishedAt).toBe(500);
  });
});
