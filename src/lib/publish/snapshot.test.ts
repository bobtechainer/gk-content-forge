import { describe, expect, it } from "vitest";
import { snapshotCourse } from "./snapshot";
import type { CourseData } from "@/stores/course";

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
