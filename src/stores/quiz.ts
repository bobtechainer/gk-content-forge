import { create } from "zustand";
import type { Question, QuestionType } from "@/lib/types";
import { SAMPLE_QUESTIONS } from "@/lib/mock-data";

interface QuizState {
  questionsByQuiz: Record<string, Question[]>;
  init: (quizId: string) => void;
  addQuestion: (quizId: string, type: QuestionType, atIndex?: number) => void;
  updateQuestion: (quizId: string, qid: string, patch: Partial<Question>) => void;
  deleteQuestion: (quizId: string, qid: string) => void;
  reorder: (quizId: string, fromId: string, toId: string) => void;
}

function defaultFor(type: QuestionType): Question {
  const id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const base: Question = { id, type, prompt: "", duration: 30, points: 1, required: true };
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

export const useQuiz = create<QuizState>((set, get) => ({
  questionsByQuiz: {},
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
    set({
      questionsByQuiz: { ...get().questionsByQuiz, [quizId]: list.filter((q) => q.id !== qid) },
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
}));