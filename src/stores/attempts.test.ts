// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { useAttempts } from "./attempts";

function reset() {
  useAttempts.setState({ byLesson: {} });
  localStorage.clear();
}

describe("useAttempts", () => {
  beforeEach(reset);

  it("record then getByLesson returns the attempt", () => {
    useAttempts.getState().record("lesson-1", "block-a", true);
    const attempts = useAttempts.getState().getByLesson("lesson-1");
    expect(attempts).toHaveLength(1);
    expect(attempts[0]).toMatchObject({ lessonId: "lesson-1", blockId: "block-a", correct: true });
  });

  it("record multiple attempts appends immutably", () => {
    useAttempts.getState().record("lesson-1", "block-a", true);
    const first = useAttempts.getState().byLesson["lesson-1"];
    useAttempts.getState().record("lesson-1", "block-b", false);
    const second = useAttempts.getState().byLesson["lesson-1"];
    expect(first).not.toBe(second); // new array reference
    expect(second).toHaveLength(2);
  });

  it("persists byLesson to localStorage under gk-attempts", () => {
    useAttempts.getState().record("lesson-2", "block-x", false);
    const raw = localStorage.getItem("gk-attempts");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string);
    expect(parsed.state.byLesson["lesson-2"]).toHaveLength(1);
  });

  it("clearLesson empties the lesson's attempts", () => {
    useAttempts.getState().record("lesson-3", "block-a", true);
    useAttempts.getState().record("lesson-3", "block-b", false);
    useAttempts.getState().clearLesson("lesson-3");
    expect(useAttempts.getState().getByLesson("lesson-3")).toHaveLength(0);
  });

  it("getByLesson returns empty array for unknown lesson", () => {
    expect(useAttempts.getState().getByLesson("no-such-lesson")).toEqual([]);
  });

  it("attempt has a numeric timestamp", () => {
    const before = Date.now();
    useAttempts.getState().record("lesson-1", "block-a", true);
    const after = Date.now();
    const { at } = useAttempts.getState().getByLesson("lesson-1")[0];
    expect(at).toBeGreaterThanOrEqual(before);
    expect(at).toBeLessThanOrEqual(after);
  });
});
