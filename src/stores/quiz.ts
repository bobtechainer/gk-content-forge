import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Question, QuestionType } from "@/lib/types";
import { SAMPLE_QUESTIONS } from "@/lib/mock-data";

interface QuizState {
  questionsByQuiz: Record<string, Question[]>;
  /** Set of question IDs that are blank (no type assigned yet). */
  blankIds: Set<string>;
  init: (quizId: string) => void;
  addQuestion: (quizId: string, type: QuestionType, atIndex?: number) => void;
  /** Add a blank slot and return its ID. */
  addBlank: (quizId: string) => string;
  /** Replace a question at given ID with a fresh one of a new type (keeps position). */
  replaceQuestion: (quizId: string, qid: string, newType: QuestionType) => void;
  updateQuestion: (quizId: string, qid: string, patch: Partial<Question>) => void;
  deleteQuestion: (quizId: string, qid: string) => void;
  reorder: (quizId: string, fromId: string, toId: string) => void;
}

function makeId() {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function defaultFor(type: QuestionType, id?: string): Question {
  const qid = id ?? makeId();
  const base: Question = { id: qid, type, prompt: "", duration: 30, points: 1, required: true };
  if (type === "multiple_choice")
    return {
      ...base,
      prompt: "Câu hỏi trắc nghiệm mới",
      options: [
        { id: "a", text: "Đáp án A" },
        { id: "b", text: "Đáp án B" },
        { id: "c", text: "Đáp án C" },
        { id: "d", text: "Đáp án D" },
      ],
      correctOptionId: "a",
    };
  if (type === "essay") return { ...base, prompt: "Câu hỏi tự luận mới", essayAnswer: "" };
  if (type === "drag_drop")
    return {
      ...base,
      prompt: "Ghép đôi các cặp sau:",
      pairs: [
        { id: "p1", left: "Mục 1", right: "Đáp án 1" },
        { id: "p2", left: "Mục 2", right: "Đáp án 2" },
      ],
    };
  return { ...base, prompt: `Câu hỏi (${type})` };
}

function blankQuestion(): Question {
  return {
    id: makeId(),
    type: "multiple_choice", // placeholder type, will be replaced
    prompt: "",
    duration: 30,
    points: 1,
    required: true,
  };
}

export const useQuiz = create<QuizState>()(
  persist(
    (set, get) => ({
      questionsByQuiz: {},
      blankIds: new Set<string>(),

      init: (quizId) => {
        if (!get().questionsByQuiz[quizId])
          set({ questionsByQuiz: { ...get().questionsByQuiz, [quizId]: [...SAMPLE_QUESTIONS] } });
      },

      addQuestion: (quizId, type, atIndex) => {
        const list = get().questionsByQuiz[quizId] ?? [];
        const next = [...list];
        const q = defaultFor(type);
        if (atIndex === undefined) next.push(q);
        else next.splice(atIndex, 0, q);
        set({ questionsByQuiz: { ...get().questionsByQuiz, [quizId]: next } });
      },

      addBlank: (quizId) => {
        const list = get().questionsByQuiz[quizId] ?? [];
        const q = blankQuestion();
        set({
          questionsByQuiz: { ...get().questionsByQuiz, [quizId]: [...list, q] },
          blankIds: new Set(get().blankIds).add(q.id),
        });
        return q.id;
      },

      replaceQuestion: (quizId, qid, newType) => {
        const list = get().questionsByQuiz[quizId] ?? [];
        const fresh = defaultFor(newType, qid); // keep same ID for position stability
        const nextBlanks = new Set(get().blankIds);
        nextBlanks.delete(qid);
        set({
          questionsByQuiz: {
            ...get().questionsByQuiz,
            [quizId]: list.map((q) => (q.id === qid ? fresh : q)),
          },
          blankIds: nextBlanks,
        });
      },

      updateQuestion: (quizId, qid, patch) => {
        const list = get().questionsByQuiz[quizId] ?? [];
        set({
          questionsByQuiz: {
            ...get().questionsByQuiz,
            [quizId]: list.map((q) => (q.id === qid ? { ...q, ...patch } : q)),
          },
        });
      },

      deleteQuestion: (quizId, qid) => {
        const list = get().questionsByQuiz[quizId] ?? [];
        const nextBlanks = new Set(get().blankIds);
        nextBlanks.delete(qid);
        set({
          questionsByQuiz: { ...get().questionsByQuiz, [quizId]: list.filter((q) => q.id !== qid) },
          blankIds: nextBlanks,
        });
      },

      reorder: (quizId, fromId, toId) => {
        const list = get().questionsByQuiz[quizId] ?? [];
        const from = list.findIndex((q) => q.id === fromId);
        const to = list.findIndex((q) => q.id === toId);
        if (from < 0 || to < 0 || from === to) return;
        const next = [...list];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        set({ questionsByQuiz: { ...get().questionsByQuiz, [quizId]: next } });
      },
    }),
    {
      name: "gk-quiz",
      version: 1,
      // blankIds là Set (transient editing state) → không persist
      partialize: (s) => ({ questionsByQuiz: s.questionsByQuiz }),
    },
  ),
);
