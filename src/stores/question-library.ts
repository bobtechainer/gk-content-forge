import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Question } from "@/lib/types";

interface QuestionLibraryState {
  questions: Question[];
  add: (q: Question) => void;
  remove: (id: string) => void;
  list: () => Question[];
}

export const useQuestionLibrary = create<QuestionLibraryState>()(
  persist(
    (set, get) => ({
      questions: [],

      // Deep-clone on add so later mutations to source don't affect the library entry
      add: (q) => {
        const clone: Question = JSON.parse(JSON.stringify(q));
        // If same id already exists, update (replace) it.
        const existing = get().questions.findIndex((x) => x.id === q.id);
        if (existing >= 0) {
          set({
            questions: get().questions.map((x, i) => (i === existing ? clone : x)),
          });
        } else {
          set({ questions: [...get().questions, clone] });
        }
      },

      remove: (id) =>
        set({ questions: get().questions.filter((q) => q.id !== id) }),

      list: () => get().questions,
    }),
    {
      name: "gk-question-library",
      version: 1,
      partialize: (s) => ({ questions: s.questions }),
      migrate: (persisted) => {
        const p = persisted as { questions?: Question[] } | undefined;
        return { questions: p?.questions ?? [] };
      },
    },
  ),
);
