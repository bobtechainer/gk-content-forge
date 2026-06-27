// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useQuestionLibrary } from "@/stores/question-library";
import { useQuiz } from "@/stores/quiz";
import type { Question, QuestionType } from "@/lib/types";
import { insertLibraryQuestion } from "./library-actions";

/* ─── Helpers ─────────────────────────────────────────────────── */

function makeQ(id: string, prompt = "Câu hỏi test"): Question {
  return {
    id,
    type: "multiple_choice",
    prompt,
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

function resetLibrary() {
  useQuestionLibrary.setState({ questions: [] });
  localStorage.clear();
}

/* ─── Tests: save to library ──────────────────────────────────── */

describe("save question to library", () => {
  beforeEach(resetLibrary);

  it("add() stores the question and list() returns it", () => {
    const q = makeQ("q1");
    useQuestionLibrary.getState().add(q);
    const list = useQuestionLibrary.getState().list();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("q1");
    expect(list[0].prompt).toBe("Câu hỏi test");
  });

  it("saving the same question twice replaces (upsert)", () => {
    useQuestionLibrary.getState().add(makeQ("q1"));
    useQuestionLibrary.getState().add({ ...makeQ("q1"), prompt: "Cập nhật" });
    const list = useQuestionLibrary.getState().list();
    expect(list).toHaveLength(1);
    expect(list[0].prompt).toBe("Cập nhật");
  });

  it("library copy is independent — mutating original does not change library", () => {
    const q = makeQ("q1");
    useQuestionLibrary.getState().add(q);
    q.prompt = "ĐÃ THAY ĐỔI";
    expect(useQuestionLibrary.getState().list()[0].prompt).toBe("Câu hỏi test");
  });
});

/* ─── Tests: insertLibraryQuestion helper ─────────────────────── */

describe("insertLibraryQuestion helper", () => {
  it("calls addQuestion then updateQuestion with the cloned data", () => {
    const picked = makeQ("lib-q1", "Câu hỏi thư viện");
    const createdId = "new-q1";

    const addQuestion = vi.fn();
    const updateQuestion = vi.fn();

    let callCount = 0;
    const getQuestions = (_quizId: string): Question[] => {
      callCount++;
      // First call (before add): empty
      // Second call (after add): has the new question
      if (callCount === 1) return [];
      return [{ ...makeQ(createdId), prompt: "default" }];
    };

    insertLibraryQuestion("quiz-1", picked, { addQuestion, updateQuestion, getQuestions });

    expect(addQuestion).toHaveBeenCalledWith("quiz-1", picked.type);
    expect(updateQuestion).toHaveBeenCalledWith(
      "quiz-1",
      createdId,
      expect.objectContaining({
        prompt: "Câu hỏi thư viện",
        type: "multiple_choice",
      }),
    );
    // Clone should NOT carry the library id
    const patchArg = updateQuestion.mock.calls[0][2] as Partial<Question>;
    expect(patchArg).not.toHaveProperty("id");
  });

  it("inserted clone does not share reference with library original", () => {
    const picked = makeQ("lib-q2", "Original");
    const createdId = "new-q2";

    let captured: Partial<Question> | null = null;
    const addQuestion = vi.fn();
    const updateQuestion = vi.fn((_qz: string, _id: string, patch: Partial<Question>) => {
      captured = patch;
    });

    let calls = 0;
    const getQuestions = (_quizId: string): Question[] => {
      calls++;
      if (calls === 1) return [];
      return [{ ...makeQ(createdId), prompt: "placeholder" }];
    };

    insertLibraryQuestion("quiz-2", picked, { addQuestion, updateQuestion, getQuestions });

    // Mutate original after insert
    picked.prompt = "MUTATED";
    // The captured patch should be independent
    expect(captured !== null && (captured as Partial<Question>).prompt).toBe("Original");
  });

  it("no-op when quiz has no new question after addQuestion (guard branch)", () => {
    const picked = makeQ("lib-q3");
    const addQuestion = vi.fn();
    const updateQuestion = vi.fn();
    // Both calls return the same list — no new id
    const getQuestions = () => [makeQ("existing")];

    insertLibraryQuestion("quiz-3", picked, { addQuestion, updateQuestion, getQuestions });

    expect(addQuestion).toHaveBeenCalledOnce();
    // updateQuestion should NOT be called because newId was already in before list
    expect(updateQuestion).not.toHaveBeenCalled();
  });
});

/* ─── Integration: library → quiz store ──────────────────────── */

describe("insertLibraryQuestion with real quiz store", () => {
  const QUIZ_ID = "test-quiz";

  beforeEach(() => {
    resetLibrary();
    // Reset quiz store
    useQuiz.setState({ questionsByQuiz: {}, blankIds: new Set() });
    localStorage.removeItem("gk-quiz");
    // Seed quiz with empty list
    useQuiz.setState({ questionsByQuiz: { [QUIZ_ID]: [] } });
  });

  it("inserts a clone of library question into the quiz", () => {
    const libraryQ = makeQ("lib-1", "Câu hỏi tích hợp");
    useQuestionLibrary.getState().add(libraryQ);

    const { addQuestion, updateQuestion } = useQuiz.getState();
    insertLibraryQuestion(QUIZ_ID, libraryQ, {
      addQuestion,
      updateQuestion,
      getQuestions: (qid) => useQuiz.getState().questionsByQuiz[qid] ?? [],
    });

    const questions = useQuiz.getState().questionsByQuiz[QUIZ_ID] ?? [];
    expect(questions).toHaveLength(1);
    expect(questions[0].prompt).toBe("Câu hỏi tích hợp");
    // Clone has a different id than the library entry
    expect(questions[0].id).not.toBe("lib-1");
  });

  it("library remains unchanged after insert", () => {
    const libraryQ = makeQ("lib-2", "Thư viện bất biến");
    useQuestionLibrary.getState().add(libraryQ);

    const { addQuestion, updateQuestion } = useQuiz.getState();
    insertLibraryQuestion(QUIZ_ID, libraryQ, {
      addQuestion,
      updateQuestion,
      getQuestions: (qid) => useQuiz.getState().questionsByQuiz[qid] ?? [],
    });

    // Library still has exactly one question with original id and prompt
    const libList = useQuestionLibrary.getState().list();
    expect(libList).toHaveLength(1);
    expect(libList[0].id).toBe("lib-2");
    expect(libList[0].prompt).toBe("Thư viện bất biến");
  });
});
