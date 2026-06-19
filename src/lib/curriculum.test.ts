// src/lib/curriculum.test.ts
import { describe, expect, test } from "vitest";
import {
  CURRICULUM,
  findLesson,
  flattenLessons,
  getGrade,
} from "./curriculum";

describe("curriculum framework", () => {
  test("là cây 5 cấp Lớp→Môn→Mạch→Chương→Bài", () => {
    const grade = CURRICULUM[0];
    expect(grade.subjects.length).toBeGreaterThan(0);
    const subject = grade.subjects[0];
    expect(subject.strands.length).toBeGreaterThan(0);
    const strand = subject.strands[0];
    expect(strand.chapters.length).toBeGreaterThan(0);
    const chapter = strand.chapters[0];
    expect(chapter.lessons.length).toBeGreaterThan(0);
  });

  test("mỗi Bài có ít nhất 1 chuẩn đầu ra", () => {
    for (const lesson of flattenLessons()) {
      expect(lesson.outcomes.length).toBeGreaterThan(0);
    }
  });

  test("getGrade tra theo id, findLesson tìm được bài đã seed", () => {
    expect(getGrade("lop-10")?.name).toBe("Lớp 10");
    const first = flattenLessons()[0];
    expect(findLesson(first.id)?.title).toBe(first.title);
    expect(findLesson("không-tồn-tại")).toBeNull();
  });
});
