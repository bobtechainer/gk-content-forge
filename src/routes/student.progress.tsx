import { createFileRoute } from "@tanstack/react-router";
import { StudentProgressPage } from "@/components/student/student-progress";

export const Route = createFileRoute("/student/progress")({
  component: StudentProgressPage,
});
