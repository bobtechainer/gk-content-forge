// src/stores/classroom.test.ts
import { beforeEach, describe, expect, it } from "vitest";
import { useClassroom } from "./classroom";

function reset() {
  useClassroom.setState((s) => ({ ...s, _seeded: false }));
  useClassroom.getState().seed();
}

describe("classroom store", () => {
  beforeEach(reset);

  it("seed tạo lớp, bài giao và bài nộp mock", () => {
    const { classes, assignments, submissions } = useClassroom.getState();
    expect(classes.length).toBeGreaterThan(0);
    expect(assignments.length).toBeGreaterThan(0);
    expect(submissions.length).toBeGreaterThan(0);
  });

  it("assignContent thêm 1 assignment + tạo submission cho từng HS của lớp", () => {
    const cls = useClassroom.getState().classes[0];
    const before = useClassroom.getState().assignments.length;
    useClassroom.getState().assignContent(cls.id, "content-x", "Bài tập mới", "2026-07-01");
    const after = useClassroom.getState();
    expect(after.assignments.length).toBe(before + 1);
    const newA = after.assignments.find((a) => a.contentId === "content-x")!;
    const subs = after.submissions.filter((s) => s.assignmentId === newA.id);
    expect(subs).toHaveLength(cls.studentIds.length);
    expect(subs.every((s) => s.status === "not_started")).toBe(true);
  });

  it("updateSubmission cập nhật trạng thái & điểm bất biến (immutable)", () => {
    const sub = useClassroom.getState().submissions[0];
    const prevArr = useClassroom.getState().submissions;
    useClassroom.getState().updateSubmission(sub.assignmentId, sub.studentId, {
      status: "graded",
      score: 9,
      progress: 100,
    });
    const next = useClassroom.getState();
    expect(next.submissions).not.toBe(prevArr); // mảng mới
    const updated = next.submissions.find(
      (s) => s.assignmentId === sub.assignmentId && s.studentId === sub.studentId,
    )!;
    expect(updated.status).toBe("graded");
    expect(updated.score).toBe(9);
  });
});
