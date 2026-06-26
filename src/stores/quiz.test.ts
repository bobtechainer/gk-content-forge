// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { useQuiz } from "./quiz";

function reset() {
  useQuiz.setState({ questionsByQuiz: {}, blankIds: new Set<string>() });
  localStorage.clear();
}

describe("useQuiz persistence", () => {
  beforeEach(reset);

  it("persists questionsByQuiz to localStorage under gk-quiz", () => {
    useQuiz.getState().addQuestion("quizA", "multiple_choice");
    const raw = localStorage.getItem("gk-quiz");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string);
    expect(parsed.state.questionsByQuiz.quizA).toHaveLength(1);
  });

  it("does not persist blankIds (transient Set)", () => {
    useQuiz.getState().addBlank("quizA");
    const parsed = JSON.parse(localStorage.getItem("gk-quiz") as string);
    expect(parsed.state.blankIds).toBeUndefined();
  });
});
