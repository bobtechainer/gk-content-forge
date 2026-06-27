import { describe, expect, it } from "vitest";
import { gradeQuestion } from "./grade";

describe("gradeQuestion", () => {
  const q = { quizOptions: ["A", "B", "C"], quizCorrect: 1 };

  it("correct answer → {correct:true, score:1, max:1}", () => {
    expect(gradeQuestion(q, 1)).toEqual({ correct: true, score: 1, max: 1 });
  });

  it("wrong index → {correct:false, score:0, max:1}", () => {
    expect(gradeQuestion(q, 0)).toEqual({ correct: false, score: 0, max: 1 });
  });

  it("null answer → {correct:false, score:0, max:1}", () => {
    expect(gradeQuestion(q, null)).toEqual({ correct: false, score: 0, max: 1 });
  });

  it("falls back to quizCorrect=0 when undefined", () => {
    const qNoCorrect = { quizOptions: ["X", "Y"] };
    expect(gradeQuestion(qNoCorrect, 0)).toEqual({ correct: true, score: 1, max: 1 });
    expect(gradeQuestion(qNoCorrect, 1)).toEqual({ correct: false, score: 0, max: 1 });
  });
});
