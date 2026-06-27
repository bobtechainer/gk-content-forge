/**
 * Pure helper: insert a library question into a quiz.
 * Exposed separately so it can be unit-tested without mounting React components.
 */
import type { Question, QuestionType } from "@/lib/types";

export interface InsertFromLibraryDeps {
  /** Adds a blank question of the given type and returns its new id. */
  addQuestion: (quizId: string, type: QuestionType, atIndex?: number) => void;
  /** Patches a question by id. */
  updateQuestion: (quizId: string, qid: string, patch: Partial<Question>) => void;
  /** Access the current list of questions for the quiz to derive the new id. */
  getQuestions: (quizId: string) => Question[];
}

/**
 * Clones a library question into the quiz at the end of the list.
 * The clone gets a fresh id so the library entry stays independent.
 */
export function insertLibraryQuestion(
  quizId: string,
  picked: Question,
  deps: InsertFromLibraryDeps,
): void {
  const { addQuestion, updateQuestion, getQuestions } = deps;

  const before = getQuestions(quizId);
  addQuestion(quizId, picked.type);
  const after = getQuestions(quizId);

  // The new question is whichever id appeared at the end
  const newId = after[after.length - 1]?.id;
  if (!newId || before.some((q) => q.id === newId)) return; // guard: id collision unlikely

  // Deep-clone the picked question, swap the id
  const clone: Partial<Question> = JSON.parse(JSON.stringify(picked));
  delete (clone as { id?: string }).id; // remove so spread doesn't overwrite
  updateQuestion(quizId, newId, clone);
}
