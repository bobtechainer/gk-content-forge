import { createFileRoute } from "@tanstack/react-router";
import { StudentHomePage } from "@/components/student/student-home";

export const Route = createFileRoute("/student/home")({
  component: StudentHomePage,
});
