import { describe, expect, it } from "vitest";
import { mockAiClient } from "./mock-client";
import type { StoryboardRequest } from "./types";

const VALID_BLOCK_TYPES = new Set([
  "text", "image", "video", "callout", "divider", "embed",
  "code", "math", "columns", "quiz", "html", "section",
  "accordion", "process", "flashcards",
]);

const BASE_REQ: StoryboardRequest = {
  subject: "Toán",
  grade: "Lớp 8",
  topic: "Phân số",
};

/* ─── generateStoryboard ─────────────────────────────────────────── */

describe("generateStoryboard", () => {
  it("trả về ít nhất 1 section", async () => {
    const result = await mockAiClient.generateStoryboard(BASE_REQ);
    expect(result.sections.length).toBeGreaterThanOrEqual(1);
  });

  it("mọi item.blockType đều thuộc tập hợp hợp lệ", async () => {
    const result = await mockAiClient.generateStoryboard(BASE_REQ);
    for (const section of result.sections) {
      for (const item of section.items) {
        expect(VALID_BLOCK_TYPES).toContain(item.blockType);
      }
    }
  });

  it("tất cả id là duy nhất", async () => {
    const result = await mockAiClient.generateStoryboard(BASE_REQ);
    const ids: string[] = [];
    for (const section of result.sections) {
      ids.push(section.id);
      for (const item of section.items) {
        ids.push(item.id);
      }
    }
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("mỗi item có intent và learningGoal không rỗng", async () => {
    const result = await mockAiClient.generateStoryboard(BASE_REQ);
    for (const section of result.sections) {
      for (const item of section.items) {
        expect(item.intent.length).toBeGreaterThan(0);
        expect(item.learningGoal.length).toBeGreaterThan(0);
      }
    }
  });

  it("có tính xác định — gọi hai lần cho cùng kết quả", async () => {
    const r1 = await mockAiClient.generateStoryboard(BASE_REQ);
    const r2 = await mockAiClient.generateStoryboard(BASE_REQ);
    expect(r1).toEqual(r2);
  });

  it("topic xuất hiện trong intent của ít nhất một item", async () => {
    const result = await mockAiClient.generateStoryboard(BASE_REQ);
    const allIntents = result.sections.flatMap((s) => s.items.map((i) => i.intent));
    expect(allIntents.some((intent) => intent.includes(BASE_REQ.topic))).toBe(true);
  });
});

/* ─── fillBlock ──────────────────────────────────────────────────── */

describe("fillBlock — text", () => {
  it("trả về type:text và content html không rỗng", async () => {
    const result = await mockAiClient.fillBlock({
      item: {
        id: "item_1",
        blockType: "text",
        intent: "Giới thiệu phân số",
        learningGoal: "Hiểu phân số",
      },
      subject: "Toán",
      grade: "Lớp 8",
      topic: "Phân số",
    });
    expect(result.type).toBe("text");
    expect(typeof result.content).toBe("string");
    expect((result.content ?? "").length).toBeGreaterThan(0);
  });

  it("content html chứa tag <p>", async () => {
    const result = await mockAiClient.fillBlock({
      item: { id: "item_1", blockType: "text", intent: "...", learningGoal: "..." },
      subject: "Toán",
      grade: "Lớp 8",
      topic: "Phân số",
    });
    expect(result.content ?? "").toMatch(/<p>/);
  });
});

describe("fillBlock — quiz", () => {
  it("trả về quizOptions với ít nhất 2 lựa chọn", async () => {
    const result = await mockAiClient.fillBlock({
      item: { id: "item_2", blockType: "quiz", intent: "Kiểm tra", learningGoal: "Ôn bài" },
      subject: "Toán",
      grade: "Lớp 8",
      topic: "Phân số",
    });
    expect(result.type).toBe("quiz");
    expect(Array.isArray(result.quizOptions)).toBe(true);
    expect((result.quizOptions ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it("quizCorrect nằm trong phạm vi quizOptions", async () => {
    const result = await mockAiClient.fillBlock({
      item: { id: "item_2", blockType: "quiz", intent: "Kiểm tra", learningGoal: "Ôn bài" },
      subject: "Toán",
      grade: "Lớp 8",
      topic: "Phân số",
    });
    const correct = result.quizCorrect ?? -1;
    const optLen = (result.quizOptions ?? []).length;
    expect(correct).toBeGreaterThanOrEqual(0);
    expect(correct).toBeLessThan(optLen);
  });

  it("quizExplanation không undefined", async () => {
    const result = await mockAiClient.fillBlock({
      item: { id: "item_2", blockType: "quiz", intent: "Kiểm tra", learningGoal: "Ôn bài" },
      subject: "Toán",
      grade: "Lớp 8",
      topic: "Phân số",
    });
    expect(result.quizExplanation).toBeDefined();
  });
});

describe("fillBlock — flashcards", () => {
  it("trả về mảng flashcards với ít nhất 1 thẻ", async () => {
    const result = await mockAiClient.fillBlock({
      item: { id: "item_3", blockType: "flashcards", intent: "Ôn thẻ", learningGoal: "Ghi nhớ" },
      subject: "Toán",
      grade: "Lớp 8",
      topic: "Phân số",
    });
    expect(result.type).toBe("flashcards");
    expect(Array.isArray(result.flashcards)).toBe(true);
    expect((result.flashcards ?? []).length).toBeGreaterThanOrEqual(1);
    const card = (result.flashcards ?? [])[0];
    expect(card).toHaveProperty("id");
    expect(card).toHaveProperty("front");
    expect(card).toHaveProperty("back");
  });
});

describe("fillBlock — process", () => {
  it("trả về processSteps có ít nhất 1 bước", async () => {
    const result = await mockAiClient.fillBlock({
      item: { id: "item_4", blockType: "process", intent: "Hướng dẫn", learningGoal: "Quy trình" },
      subject: "Toán",
      grade: "Lớp 8",
      topic: "Phân số",
    });
    expect(result.type).toBe("process");
    const steps = result.processSteps ?? [];
    expect(steps.length).toBeGreaterThanOrEqual(1);
    expect(steps[0]).toHaveProperty("id");
    expect(steps[0]).toHaveProperty("title");
    expect(steps[0]).toHaveProperty("body");
  });
});

describe("fillBlock — accordion", () => {
  it("trả về accordionItems có ít nhất 1 mục", async () => {
    const result = await mockAiClient.fillBlock({
      item: { id: "item_5", blockType: "accordion", intent: "Mở rộng", learningGoal: "Chi tiết" },
      subject: "Toán",
      grade: "Lớp 8",
      topic: "Phân số",
    });
    expect(result.type).toBe("accordion");
    const items = result.accordionItems ?? [];
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items[0]).toHaveProperty("id");
    expect(items[0]).toHaveProperty("title");
    expect(items[0]).toHaveProperty("body");
  });
});

describe("fillBlock — determinism", () => {
  it("gọi hai lần fillBlock với cùng input cho cùng kết quả", async () => {
    const req = {
      item: { id: "item_1", blockType: "text" as const, intent: "intro", learningGoal: "goal" },
      subject: "Toán",
      grade: "Lớp 8",
      topic: "Phân số",
    };
    const r1 = await mockAiClient.fillBlock(req);
    const r2 = await mockAiClient.fillBlock(req);
    expect(r1).toEqual(r2);
  });
});

/* ─── companionEdit ──────────────────────────────────────────────── */

describe("companionEdit — shorten", () => {
  it("trả về văn bản ngắn hơn hoặc bằng đầu vào", async () => {
    const input = "Đây là một câu văn dài dùng để kiểm tra tính năng rút gọn của companionEdit trong hệ thống AI";
    const result = await mockAiClient.companionEdit({ text: input, action: "shorten" });
    expect(result.text.length).toBeLessThanOrEqual(input.length);
  });

  it("kết quả shorten là xác định", async () => {
    const req = { text: "abc def ghi", action: "shorten" as const };
    const r1 = await mockAiClient.companionEdit(req);
    const r2 = await mockAiClient.companionEdit(req);
    expect(r1.text).toBe(r2.text);
  });
});

describe("companionEdit — lengthen", () => {
  it("trả về văn bản dài hơn đầu vào", async () => {
    const input = "Đây là nội dung ngắn.";
    const result = await mockAiClient.companionEdit({ text: input, action: "lengthen" });
    expect(result.text.length).toBeGreaterThan(input.length);
  });
});

describe("companionEdit — tone-friendly", () => {
  it("trả về văn bản bắt đầu bằng từ thân thiện", async () => {
    const result = await mockAiClient.companionEdit({
      text: "Hãy hoàn thành bài tập.",
      action: "tone-friendly",
    });
    expect(result.text.toLowerCase()).toMatch(/^bạn/);
  });
});

describe("companionEdit — fix", () => {
  it("trim và capitalize chữ đầu", async () => {
    const result = await mockAiClient.companionEdit({
      text: "  hello world  ",
      action: "fix",
    });
    expect(result.text).toBe("Hello world");
  });
});

/* ─── quizFromContent ────────────────────────────────────────────── */

describe("quizFromContent", () => {
  const SOURCE = "Phân số là một cách biểu diễn tỉ lệ giữa hai số nguyên. Tử số nằm trên mẫu số và mẫu số không được bằng không.";

  it("trả về đúng số lượng câu hỏi theo count", async () => {
    const result = await mockAiClient.quizFromContent({ sourceText: SOURCE, count: 2 });
    expect(result).toHaveLength(2);
  });

  it("mỗi câu hỏi có shape hợp lệ", async () => {
    const result = await mockAiClient.quizFromContent({ sourceText: SOURCE, count: 2 });
    for (const q of result) {
      expect(typeof q.content).toBe("string");
      expect(q.content.length).toBeGreaterThan(0);
      expect(Array.isArray(q.quizOptions)).toBe(true);
      expect(q.quizOptions.length).toBeGreaterThanOrEqual(2);
      expect(q.quizCorrect).toBeGreaterThanOrEqual(0);
      expect(q.quizCorrect).toBeLessThan(q.quizOptions.length);
      expect(typeof q.quizExplanation).toBe("string");
    }
  });

  it("kết quả là xác định — gọi hai lần cho cùng kết quả", async () => {
    const req = { sourceText: SOURCE, count: 3 };
    const r1 = await mockAiClient.quizFromContent(req);
    const r2 = await mockAiClient.quizFromContent(req);
    expect(r1).toEqual(r2);
  });

  it("count:1 trả về mảng 1 phần tử", async () => {
    const result = await mockAiClient.quizFromContent({ sourceText: SOURCE, count: 1 });
    expect(result).toHaveLength(1);
  });
});
