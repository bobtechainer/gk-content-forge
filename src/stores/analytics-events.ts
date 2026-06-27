import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LearnEvent } from "@/lib/analytics/events";

const MAX_EVENTS = 2000;

interface AnalyticsEventsSummary {
  opens: number;
  answers: number;
  correct: number;
  completes: number;
}

interface AnalyticsEventsState {
  events: LearnEvent[];
  record: (ev: LearnEvent) => void;
  byCourse: (courseId: string) => LearnEvent[];
  summary: () => AnalyticsEventsSummary;
  clear: () => void;
}

export const useAnalyticsEvents = create<AnalyticsEventsState>()(
  persist(
    (set, get) => ({
      events: [],

      record: (ev) => {
        const current = get().events;
        const next = [...current, ev];
        // Giới hạn tối đa MAX_EVENTS — bỏ sự kiện cũ nhất khi vượt ngưỡng
        const capped = next.length > MAX_EVENTS ? next.slice(next.length - MAX_EVENTS) : next;
        set({ events: capped });
      },

      byCourse: (courseId) => get().events.filter((ev) => ev.courseId === courseId),

      summary: () => {
        const evs = get().events;
        let opens = 0;
        let answers = 0;
        let correct = 0;
        let completes = 0;
        for (const ev of evs) {
          if (ev.type === "lesson_open") opens++;
          else if (ev.type === "quiz_answer") {
            answers++;
            if (ev.correct === true) correct++;
          } else if (ev.type === "lesson_complete") completes++;
        }
        return { opens, answers, correct, completes };
      },

      clear: () => set({ events: [] }),
    }),
    {
      name: "gk-analytics-events",
      version: 1,
      partialize: (s) => ({ events: s.events }),
      migrate: (persisted) => {
        const p = persisted as { events?: LearnEvent[] } | undefined;
        return { events: p?.events ?? [] };
      },
    },
  ),
);
