// src/stores/classroom.ts
import { create } from "zustand";

export interface Class {
  id: string;
  schoolId: string;
  teacherId: string;
  name: string;
  grade: string;
  subject: string;
  studentIds: string[];
}
export interface Assignment {
  id: string;
  classId: string;
  contentId: string;
  title: string;
  dueDate: string;
  assignedBy: string;
}
export type SubmissionStatus = "not_started" | "in_progress" | "submitted" | "graded";
export interface Submission {
  assignmentId: string;
  studentId: string;
  status: SubmissionStatus;
  score?: number;
  progress: number; // 0..100
}

interface ClassroomState {
  _seeded: boolean;
  classes: Class[];
  assignments: Assignment[];
  submissions: Submission[];
  seed: () => void;
  assignContent: (classId: string, contentId: string, title: string, dueDate: string) => void;
  updateSubmission: (
    assignmentId: string,
    studentId: string,
    patch: Partial<Omit<Submission, "assignmentId" | "studentId">>,
  ) => void;
}

const STUDENTS = ["hs-01", "hs-02", "hs-03", "hs-04"];

function buildSeed() {
  const classes: Class[] = [
    {
      id: "lop-10a1",
      schoolId: "school-thpt-le-loi",
      teacherId: "teacher",
      name: "10A1",
      grade: "Lớp 10",
      subject: "Toán",
      studentIds: STUDENTS,
    },
  ];
  const assignments: Assignment[] = [
    {
      id: "seed-as-1",
      classId: "lop-10a1",
      contentId: "seed-quiz-1",
      title: "Luyện tập Mệnh đề",
      dueDate: "2026-06-30",
      assignedBy: "teacher",
    },
  ];
  const submissions: Submission[] = STUDENTS.map((sid, i) => ({
    assignmentId: "seed-as-1",
    studentId: sid,
    status: (["graded", "submitted", "in_progress", "not_started"] as const)[i] ?? "not_started",
    score: i === 0 ? 8.5 : undefined,
    progress: [100, 100, 45, 0][i] ?? 0,
  }));
  return { classes, assignments, submissions };
}

export const useClassroom = create<ClassroomState>((set, get) => ({
  _seeded: false,
  classes: [],
  assignments: [],
  submissions: [],
  seed: () => {
    if (get()._seeded) return;
    set({ ...buildSeed(), _seeded: true });
  },
  assignContent: (classId, contentId, title, dueDate) => {
    const cls = get().classes.find((c) => c.id === classId);
    if (!cls) return;
    const a: Assignment = {
      id: `as-${get().assignments.length + 1}`,
      classId, contentId, title, dueDate, assignedBy: cls.teacherId,
    };
    const newSubs: Submission[] = cls.studentIds.map((sid) => ({
      assignmentId: a.id,
      studentId: sid,
      status: "not_started",
      progress: 0,
    }));
    set((s) => ({
      assignments: [...s.assignments, a],
      submissions: [...s.submissions, ...newSubs],
    }));
  },
  updateSubmission: (assignmentId, studentId, patch) =>
    set((s) => ({
      submissions: s.submissions.map((sub) =>
        sub.assignmentId === assignmentId && sub.studentId === studentId
          ? { ...sub, ...patch }
          : sub,
      ),
    })),
}));
