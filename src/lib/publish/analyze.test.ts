import { describe, it, expect } from "vitest";
import { analyzeContent } from "./analyze";
import type { CourseBlock } from "@/stores/course";

function makeBlock(overrides: Partial<CourseBlock> & { type: CourseBlock["type"] }): CourseBlock {
  return {
    id: `b_${Math.random().toString(36).slice(2)}`,
    content: "",
    ...overrides,
  };
}

describe("analyzeContent", () => {
  it("returns low score and content note for empty blocks", () => {
    const result = analyzeContent([]);
    expect(result.score).toBe(0);
    expect(result.notes).toContain("Chưa có nội dung — hãy thêm khối đầu tiên.");
  });

  it("is deterministic — same input produces same output", () => {
    const blocks: CourseBlock[] = [
      makeBlock({ id: "b1", type: "text", content: "Hello world" }),
      makeBlock({ id: "b2", type: "quiz", content: "Question?", quizOptions: ["A", "B"], quizCorrect: 0 }),
    ];
    const r1 = analyzeContent(blocks, { subject: "Toán", grade: "Lớp 8" });
    const r2 = analyzeContent(blocks, { subject: "Toán", grade: "Lớp 8" });
    expect(r1.score).toBe(r2.score);
    expect(r1.tags).toEqual(r2.tags);
    expect(r1.description).toEqual(r2.description);
    expect(r1.notes).toEqual(r2.notes);
  });

  it("returns notably higher score for a rich lesson", () => {
    const richBlocks: CourseBlock[] = [
      makeBlock({
        id: "b1",
        type: "section",
        content: "Phần 1: Giới thiệu",
      }),
      makeBlock({
        id: "b2",
        type: "text",
        content: "A".repeat(300), // long text
      }),
      makeBlock({
        id: "b3",
        type: "callout",
        content: "Lưu ý quan trọng!",
        calloutVariant: "tip",
      }),
      makeBlock({
        id: "b4",
        type: "quiz",
        content: "Câu hỏi 1?",
        quizOptions: ["A", "B", "C"],
        quizCorrect: 0,
      }),
      makeBlock({
        id: "b5",
        type: "quiz",
        content: "Câu hỏi 2?",
        quizOptions: ["A", "B"],
        quizCorrect: 1,
      }),
      makeBlock({
        id: "b6",
        type: "image",
        content: "",
        caption: "Hình minh họa",
      }),
    ];

    const emptyResult = analyzeContent([]);
    const richResult = analyzeContent(richBlocks, { subject: "Vật lý", grade: "Lớp 10" });

    expect(richResult.score).toBeGreaterThan(emptyResult.score + 30);
    expect(richResult.score).toBeLessThanOrEqual(100);
  });

  it("tags include subject, grade, and detected block type labels", () => {
    const blocks: CourseBlock[] = [
      makeBlock({ id: "b1", type: "text", content: "Nội dung văn bản" }),
      makeBlock({ id: "b2", type: "quiz", content: "Câu hỏi?", quizOptions: ["A"], quizCorrect: 0 }),
    ];
    const result = analyzeContent(blocks, { subject: "Hóa học", grade: "Lớp 11" });

    expect(result.tags).toContain("Hóa học");
    expect(result.tags).toContain("Lớp 11");
    expect(result.tags).toContain("Văn bản");
    expect(result.tags).toContain("Câu hỏi");
  });

  it("adds quiz note when no interactive block present", () => {
    const blocks: CourseBlock[] = [
      makeBlock({ id: "b1", type: "text", content: "Chỉ có văn bản." }),
    ];
    const result = analyzeContent(blocks);
    expect(result.notes).toContain(
      "Chưa có câu hỏi kiểm tra — hãy thêm khối câu hỏi hoặc thẻ ghi nhớ.",
    );
  });

  it("no quiz note when quiz block is present", () => {
    const blocks: CourseBlock[] = [
      makeBlock({ id: "b1", type: "quiz", content: "Câu hỏi?", quizOptions: ["A", "B"], quizCorrect: 0 }),
    ];
    const result = analyzeContent(blocks);
    expect(result.notes.some((n) => n.includes("Chưa có câu hỏi"))).toBe(false);
  });

  it("score caps at 100 even with maximum signals", () => {
    const blocks: CourseBlock[] = [
      makeBlock({ id: "b1", type: "section", content: "S1" }),
      makeBlock({ id: "b2", type: "text", content: "B".repeat(700) }),
      makeBlock({ id: "b3", type: "callout", content: "Note", calloutVariant: "tip" }),
      makeBlock({ id: "b4", type: "quiz", content: "Q1?", quizOptions: ["A", "B"], quizCorrect: 0 }),
      makeBlock({ id: "b5", type: "quiz", content: "Q2?", quizOptions: ["A", "B"], quizCorrect: 1 }),
      makeBlock({ id: "b6", type: "image", content: "" }),
      makeBlock({ id: "b7", type: "video", content: "" }),
      makeBlock({ id: "b8", type: "flashcards", content: "", flashcards: [{ id: "f1", front: "A", back: "B" }] }),
    ];
    const result = analyzeContent(blocks, { subject: "Toán", grade: "Lớp 9" });
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("description mentions block count", () => {
    const blocks: CourseBlock[] = [
      makeBlock({ id: "b1", type: "text", content: "Hello" }),
      makeBlock({ id: "b2", type: "image", content: "" }),
    ];
    const result = analyzeContent(blocks);
    expect(result.description).toContain("2 khối");
  });

  it("flattens column children for scoring", () => {
    const inner1 = makeBlock({ id: "inner1", type: "quiz", content: "Q?", quizOptions: ["A", "B"], quizCorrect: 0 });
    const inner2 = makeBlock({ id: "inner2", type: "callout", content: "Note", calloutVariant: "info" });
    const columns = makeBlock({ id: "col1", type: "columns", content: "", columnChildren: [[inner1], [inner2]] });
    const result = analyzeContent([columns]);
    // Should detect quiz and callout from within column children
    expect(result.notes.some((n) => n.includes("Chưa có câu hỏi"))).toBe(false);
    expect(result.notes.some((n) => n.includes("callout"))).toBe(false);
  });
});
