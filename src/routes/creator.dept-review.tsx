import { createFileRoute } from "@tanstack/react-router";
import { TeacherDeptReviewPage } from "@/components/creator/teacher-dept-review";

export const Route = createFileRoute("/creator/dept-review")({
  head: () => ({ meta: [{ title: "Duyệt cấp tổ — GK Content Studio" }] }),
  component: TeacherDeptReviewPage,
});
