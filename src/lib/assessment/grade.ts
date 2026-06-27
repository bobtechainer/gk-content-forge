import type { CourseBlock } from "@/stores/course";

export interface GradeResult {
  correct: boolean;
  score: number;
  max: number;
}

/**
 * Grade a single MC quiz block against the learner's answer.
 * Phase 1: MC only — 1 point per question.
 */
export function gradeQuestion(
  q: Pick<CourseBlock, "quizOptions" | "quizCorrect">,
  answer: number | null,
): GradeResult {
  const correct = answer != null && answer === (q.quizCorrect ?? 0);
  return { correct, score: correct ? 1 : 0, max: 1 };
}
