// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { useStoryboard } from "./storyboard";
import type { Storyboard } from "@/lib/ai/types";

/* ─── Helpers ───────────────────────────────────────────────────── */

function reset() {
  useStoryboard.setState({ byLesson: {}, status: {} });
  localStorage.clear();
}

function makeSb(): Storyboard {
  return {
    sections: [
      {
        id: "sec1",
        title: "Khởi động",
        items: [
          { id: "item1", blockType: "text", intent: "Giới thiệu chủ đề", learningGoal: "Nhận biết khái niệm" },
          { id: "item2", blockType: "callout", intent: "Nhấn mạnh lưu ý", learningGoal: "Ghi nhớ điểm quan trọng" },
        ],
      },
      {
        id: "sec2",
        title: "Luyện tập",
        items: [
          { id: "item3", blockType: "quiz", intent: "Kiểm tra hiểu bài", learningGoal: "Vận dụng kiến thức" },
        ],
      },
    ],
  };
}

describe("useStoryboard", () => {
  beforeEach(reset);

  /* ─── setStoryboard / getStoryboard ────────────────────────── */

  it("setStoryboard → byLesson returns the storyboard", () => {
    const sb = makeSb();
    useStoryboard.getState().setStoryboard("ls1", sb);
    expect(useStoryboard.getState().byLesson["ls1"]).toEqual(sb);
  });

  it("setStoryboard for separate lessons does not overwrite each other", () => {
    const sb1 = makeSb();
    const sb2: Storyboard = { sections: [{ id: "s", title: "T", items: [{ id: "i", blockType: "text", intent: "X", learningGoal: "Y" }] }] };
    useStoryboard.getState().setStoryboard("ls1", sb1);
    useStoryboard.getState().setStoryboard("ls2", sb2);
    expect(useStoryboard.getState().byLesson["ls1"]?.sections).toHaveLength(2);
    expect(useStoryboard.getState().byLesson["ls2"]?.sections).toHaveLength(1);
  });

  /* ─── updateItem ────────────────────────────────────────────── */

  it("updateItem patches an item's intent without mutating other items", () => {
    useStoryboard.getState().setStoryboard("ls1", makeSb());
    useStoryboard.getState().updateItem("ls1", "sec1", "item1", { intent: "Ý định mới" });
    const sb = useStoryboard.getState().byLesson["ls1"]!;
    expect(sb.sections[0].items[0].intent).toBe("Ý định mới");
    // Other item in same section untouched
    expect(sb.sections[0].items[1].intent).toBe("Nhấn mạnh lưu ý");
  });

  it("updateItem is a no-op when lessonId does not exist", () => {
    useStoryboard.getState().updateItem("nope", "sec1", "item1", { intent: "X" });
    expect(useStoryboard.getState().byLesson["nope"]).toBeUndefined();
  });

  /* ─── removeItem ────────────────────────────────────────────── */

  it("removeItem drops the item from its section", () => {
    useStoryboard.getState().setStoryboard("ls1", makeSb());
    useStoryboard.getState().removeItem("ls1", "sec1", "item1");
    const items = useStoryboard.getState().byLesson["ls1"]!.sections[0].items;
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("item2");
  });

  it("removeItem does not affect other sections", () => {
    useStoryboard.getState().setStoryboard("ls1", makeSb());
    useStoryboard.getState().removeItem("ls1", "sec1", "item1");
    expect(useStoryboard.getState().byLesson["ls1"]!.sections[1].items).toHaveLength(1);
  });

  /* ─── moveItem ──────────────────────────────────────────────── */

  it("moveItem down swaps item with its successor", () => {
    useStoryboard.getState().setStoryboard("ls1", makeSb());
    useStoryboard.getState().moveItem("ls1", "sec1", "item1", "down");
    const items = useStoryboard.getState().byLesson["ls1"]!.sections[0].items;
    expect(items[0].id).toBe("item2");
    expect(items[1].id).toBe("item1");
  });

  it("moveItem up swaps item with its predecessor", () => {
    useStoryboard.getState().setStoryboard("ls1", makeSb());
    useStoryboard.getState().moveItem("ls1", "sec1", "item2", "up");
    const items = useStoryboard.getState().byLesson["ls1"]!.sections[0].items;
    expect(items[0].id).toBe("item2");
    expect(items[1].id).toBe("item1");
  });

  it("moveItem at boundary is a no-op", () => {
    useStoryboard.getState().setStoryboard("ls1", makeSb());
    useStoryboard.getState().moveItem("ls1", "sec1", "item1", "up");
    const items = useStoryboard.getState().byLesson["ls1"]!.sections[0].items;
    expect(items[0].id).toBe("item1");
  });

  /* ─── setStatus ─────────────────────────────────────────────── */

  it("setStatus stores status per lesson", () => {
    useStoryboard.getState().setStatus("ls1", "planning");
    expect(useStoryboard.getState().status["ls1"]).toBe("planning");
  });

  it("setStatus transitions: idle → planning → ready → filling → done", () => {
    const s = useStoryboard.getState();
    s.setStatus("ls1", "idle");
    s.setStatus("ls1", "planning");
    s.setStatus("ls1", "ready");
    s.setStatus("ls1", "filling");
    s.setStatus("ls1", "done");
    expect(useStoryboard.getState().status["ls1"]).toBe("done");
  });

  /* ─── clear ─────────────────────────────────────────────────── */

  it("clear removes storyboard and status for the lesson", () => {
    useStoryboard.getState().setStoryboard("ls1", makeSb());
    useStoryboard.getState().setStatus("ls1", "ready");
    useStoryboard.getState().clear("ls1");
    expect(useStoryboard.getState().byLesson["ls1"]).toBeUndefined();
    expect(useStoryboard.getState().status["ls1"]).toBeUndefined();
  });

  it("clear does not affect other lessons", () => {
    useStoryboard.getState().setStoryboard("ls1", makeSb());
    useStoryboard.getState().setStoryboard("ls2", makeSb());
    useStoryboard.getState().clear("ls1");
    expect(useStoryboard.getState().byLesson["ls2"]).toBeDefined();
  });

  /* ─── persistence ───────────────────────────────────────────── */

  it("persists byLesson and status under gk-storyboard", () => {
    useStoryboard.getState().setStoryboard("ls1", makeSb());
    useStoryboard.getState().setStatus("ls1", "ready");
    const raw = localStorage.getItem("gk-storyboard");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string);
    expect(parsed.state.byLesson["ls1"]).toBeDefined();
    expect(parsed.state.status["ls1"]).toBe("ready");
  });
});
