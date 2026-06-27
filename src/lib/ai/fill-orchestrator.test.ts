import { describe, it, expect, vi, beforeEach } from "vitest";
import { fillStoryboard } from "./fill-orchestrator";
import type { Storyboard } from "./types";
import type { CourseBlock, CourseBlockType } from "@/stores/course";

const mockFillBlock = vi.hoisted(() =>
  vi.fn(() => Promise.resolve({ content: "filled content" }))
);

vi.mock("@/lib/ai", () => ({
  aiClient: {
    fillBlock: mockFillBlock,
  },
}));

describe("fillStoryboard", () => {
  const storyboard: Storyboard = {
    sections: [
      {
        id: "sec_1",
        title: "Mở đầu",
        items: [
          { id: "item_1", blockType: "text", intent: "Giới thiệu chủ đề", learningGoal: "Hiểu khái niệm" },
        ],
      },
      {
        id: "sec_2",
        title: "Nội dung chính",
        items: [
          { id: "item_2", blockType: "quiz", intent: "Kiểm tra hiểu biết", learningGoal: "Áp dụng kiến thức" },
        ],
      },
    ],
  };

  const meta = { subject: "Toán", grade: "Lớp 5", topic: "Phân số" };

  const addBlockMock = vi.fn();
  const updateBlockMock = vi.fn();
  const onProgressMock = vi.fn();
  const addBlock = addBlockMock as unknown as (type: CourseBlockType) => string;
  const updateBlock = updateBlockMock as unknown as (blockId: string, patch: Partial<CourseBlock>) => void;
  const onProgress = onProgressMock as unknown as (done: number, total: number) => void;

  beforeEach(() => {
    addBlockMock.mockReset();
    updateBlockMock.mockReset();
    onProgressMock.mockReset();
    addBlockMock.mockReturnValueOnce("blk_text").mockReturnValueOnce("blk_quiz");
    mockFillBlock.mockClear();
    mockFillBlock.mockResolvedValue({ content: "filled content" });
  });

  it("calls addBlock once per storyboard item", async () => {
    await fillStoryboard({ storyboard, meta, addBlock, updateBlock });
    expect(addBlockMock).toHaveBeenCalledTimes(2);
    expect(addBlockMock).toHaveBeenNthCalledWith(1, "text");
    expect(addBlockMock).toHaveBeenNthCalledWith(2, "quiz");
  });

  it("calls updateBlock once per item with aiGenerated:true and the mock patch", async () => {
    await fillStoryboard({ storyboard, meta, addBlock, updateBlock });
    expect(updateBlockMock).toHaveBeenCalledTimes(2);
    expect(updateBlockMock).toHaveBeenNthCalledWith(1, "blk_text", {
      content: "filled content",
      aiGenerated: true,
    });
    expect(updateBlockMock).toHaveBeenNthCalledWith(2, "blk_quiz", {
      content: "filled content",
      aiGenerated: true,
    });
  });

  it("reports progress (1,2) then (2,2) after each item", async () => {
    await fillStoryboard({ storyboard, meta, addBlock, updateBlock, onProgress });
    expect(onProgressMock).toHaveBeenCalledTimes(2);
    expect(onProgressMock).toHaveBeenNthCalledWith(1, 1, 2);
    expect(onProgressMock).toHaveBeenNthCalledWith(2, 2, 2);
  });

  it("resolves without error when onProgress is omitted", async () => {
    await expect(fillStoryboard({ storyboard, meta, addBlock, updateBlock })).resolves.toBeUndefined();
  });
});
