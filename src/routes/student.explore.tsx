import { createFileRoute } from "@tanstack/react-router";
import { StudentExplorePage } from "@/components/student/student-explore";

export const Route = createFileRoute("/student/explore")({
  component: StudentExplorePage,
});
