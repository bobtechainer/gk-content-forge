// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { useQuestionLibrary } from "./question-library";
import type { Question } from "@/lib/types";

function makeQ(id: string): Question {
  return {
    id,
    type: "multiple_choice",
    prompt: `Câu hỏi ${id}`,
    options: [
      { id: "a", text: "A" },
      { id: "b", text: "B" },
    ],
    correctOptionId: "a",
    duration: 30,
    points: 1,
    required: true,
  };
}

function reset() {
  useQuestionLibrary.setState({ questions: [] });
  localStorage.clear();
}

describe("useQuestionLibrary", () => {
  beforeEach(reset);

  it("add → list contains the question", () => {
    const q = makeQ("q1");
    useQuestionLibrary.getState().add(q);
    expect(useQuestionLibrary.getState().list()).toHaveLength(1);
    expect(useQuestionLibrary.getState().list()[0].id).toBe("q1");
  });

  it("remove deletes the question", () => {
    useQuestionLibrary.getState().add(makeQ("q1"));
    useQuestionLibrary.getState().add(makeQ("q2"));
    useQuestionLibrary.getState().remove("q1");
    const ids = useQuestionLibrary.getState().list().map((q) => q.id);
    expect(ids).not.toContain("q1");
    expect(ids).toContain("q2");
  });

  it("persists to localStorage under gk-question-library", () => {
    useQuestionLibrary.getState().add(makeQ("q1"));
    const raw = localStorage.getItem("gk-question-library");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string);
    expect(parsed.state.questions).toHaveLength(1);
    expect(parsed.state.questions[0].id).toBe("q1");
  });

  it("add deep-copies: mutating the source after add does not affect library", () => {
    const q = makeQ("q1");
    useQuestionLibrary.getState().add(q);
    // Mutate source
    q.prompt = "CHANGED";
    // Library entry should still have original prompt
    expect(useQuestionLibrary.getState().list()[0].prompt).toBe("Câu hỏi q1");
  });

  it("adding same id again replaces (upsert)", () => {
    useQuestionLibrary.getState().add(makeQ("q1"));
    const updated = { ...makeQ("q1"), prompt: "Cập nhật" };
    useQuestionLibrary.getState().add(updated);
    const list = useQuestionLibrary.getState().list();
    expect(list).toHaveLength(1);
    expect(list[0].prompt).toBe("Cập nhật");
  });

  it("list returns all questions", () => {
    useQuestionLibrary.getState().add(makeQ("q1"));
    useQuestionLibrary.getState().add(makeQ("q2"));
    useQuestionLibrary.getState().add(makeQ("q3"));
    expect(useQuestionLibrary.getState().list()).toHaveLength(3);
  });
});
