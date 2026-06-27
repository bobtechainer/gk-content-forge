// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { useAnalyticsEvents } from "./analytics-events";
import { opensPerDay, type LearnEvent } from "@/lib/analytics/events";

function reset() {
  useAnalyticsEvents.setState({ events: [] });
  localStorage.clear();
}

// ────────────────────────────────────────────────────────────────────────────
// Store tests
// ────────────────────────────────────────────────────────────────────────────

describe("useAnalyticsEvents", () => {
  beforeEach(reset);

  it("record appends a new event immutably", () => {
    const ev: LearnEvent = { type: "lesson_open", courseId: "c1", at: 1000 };
    useAnalyticsEvents.getState().record(ev);
    const events = useAnalyticsEvents.getState().events;
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject(ev);
  });

  it("record produces a new array reference each time (immutable)", () => {
    const ev: LearnEvent = { type: "lesson_open", courseId: "c1", at: 1000 };
    useAnalyticsEvents.getState().record(ev);
    const first = useAnalyticsEvents.getState().events;
    useAnalyticsEvents.getState().record({ ...ev, at: 2000 });
    const second = useAnalyticsEvents.getState().events;
    expect(first).not.toBe(second);
    expect(second).toHaveLength(2);
  });

  it("caps stored events at 2000 — drops oldest when exceeded", () => {
    // Insert 2001 events
    const batch: LearnEvent[] = Array.from({ length: 2001 }, (_, i) => ({
      type: "lesson_open",
      courseId: "c1",
      at: i,
    }));
    for (const ev of batch) {
      useAnalyticsEvents.getState().record(ev);
    }
    const events = useAnalyticsEvents.getState().events;
    expect(events).toHaveLength(2000);
    // Oldest (at=0) should be gone; newest (at=2000) should remain
    expect(events[0].at).toBe(1);
    expect(events[events.length - 1].at).toBe(2000);
  });

  it("byCourse filters events by courseId", () => {
    useAnalyticsEvents.getState().record({ type: "lesson_open", courseId: "c1", at: 1 });
    useAnalyticsEvents.getState().record({ type: "lesson_open", courseId: "c2", at: 2 });
    useAnalyticsEvents.getState().record({ type: "quiz_answer", courseId: "c1", at: 3, correct: true });

    const c1 = useAnalyticsEvents.getState().byCourse("c1");
    expect(c1).toHaveLength(2);
    expect(c1.every((e) => e.courseId === "c1")).toBe(true);
  });

  it("summary counts opens, answers, correct, and completes", () => {
    useAnalyticsEvents.getState().record({ type: "lesson_open", courseId: "c1", at: 1 });
    useAnalyticsEvents.getState().record({ type: "quiz_answer", courseId: "c1", at: 2, correct: true });
    useAnalyticsEvents.getState().record({ type: "quiz_answer", courseId: "c1", at: 3, correct: false });
    useAnalyticsEvents.getState().record({ type: "lesson_complete", courseId: "c1", at: 4 });

    const s = useAnalyticsEvents.getState().summary();
    expect(s.opens).toBe(1);
    expect(s.answers).toBe(2);
    expect(s.correct).toBe(1);
    expect(s.completes).toBe(1);
  });

  it("summary returns all zeros when store is empty", () => {
    const s = useAnalyticsEvents.getState().summary();
    expect(s).toEqual({ opens: 0, answers: 0, correct: 0, completes: 0 });
  });

  it("clear empties all events", () => {
    useAnalyticsEvents.getState().record({ type: "lesson_open", courseId: "c1", at: 1 });
    useAnalyticsEvents.getState().clear();
    expect(useAnalyticsEvents.getState().events).toHaveLength(0);
  });

  it("persists events to localStorage under gk-analytics-events", () => {
    useAnalyticsEvents.getState().record({ type: "lesson_open", courseId: "c1", at: 999 });
    const raw = localStorage.getItem("gk-analytics-events");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string);
    expect(parsed.state.events).toHaveLength(1);
    expect(parsed.state.events[0].courseId).toBe("c1");
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Pure helper tests: opensPerDay
// ────────────────────────────────────────────────────────────────────────────

describe("opensPerDay", () => {
  // Pin "now" to a deterministic timestamp: 2026-01-10 00:00:00 UTC
  // 2026-01-10 in ms = 1736467200000
  const DAY_MS = 24 * 60 * 60 * 1000;
  const NOW = 1736467200000 + DAY_MS - 1; // end of 2026-01-10 UTC

  it("returns exactly N entries, one per day", () => {
    const result = opensPerDay([], NOW, 7);
    expect(result).toHaveLength(7);
  });

  it("all counts are 0 when events list is empty", () => {
    const result = opensPerDay([], NOW, 3);
    result.forEach((r) => expect(r.opens).toBe(0));
  });

  it("buckets lesson_open events by date correctly", () => {
    // NOW is end-of-day 2026-01-10 UTC (just before midnight).
    // "Today" bucket = anything in [1736467200000, NOW].
    // "Yesterday" bucket = anything in [1736467200000 - DAY_MS, 1736467200000 - 1].
    const todayStart = 1736467200000; // 2026-01-10 00:00:00 UTC
    const yesterdayStart = todayStart - DAY_MS; // 2026-01-09 00:00:00 UTC

    const events: LearnEvent[] = [
      { type: "lesson_open", courseId: "c1", at: yesterdayStart + 3600_000 }, // yesterday 01:00
      { type: "lesson_open", courseId: "c1", at: yesterdayStart + 7200_000 }, // yesterday 02:00
      { type: "lesson_open", courseId: "c1", at: todayStart + 3600_000 },     // today 01:00
    ];
    const result = opensPerDay(events, NOW, 7);
    const todayEntry = result[result.length - 1];
    const yesterdayEntry = result[result.length - 2];
    expect(todayEntry.opens).toBe(1);
    expect(yesterdayEntry.opens).toBe(2);
  });

  it("ignores quiz_answer and lesson_complete events", () => {
    const events: LearnEvent[] = [
      { type: "quiz_answer", courseId: "c1", at: NOW - 1, correct: true },
      { type: "lesson_complete", courseId: "c1", at: NOW - 2 },
    ];
    const result = opensPerDay(events, NOW, 3);
    result.forEach((r) => expect(r.opens).toBe(0));
  });

  it("ignores events outside the time window", () => {
    const tooOld = NOW - 100 * DAY_MS; // 100 days ago, outside 7-day window
    const events: LearnEvent[] = [{ type: "lesson_open", courseId: "c1", at: tooOld }];
    const result = opensPerDay(events, NOW, 7);
    result.forEach((r) => expect(r.opens).toBe(0));
  });

  it("dates are in ascending order (oldest first)", () => {
    const result = opensPerDay([], NOW, 5);
    const dates = result.map((r) => r.date);
    const sorted = [...dates].sort();
    expect(dates).toEqual(sorted);
  });
});
