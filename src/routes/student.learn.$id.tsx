import { createFileRoute } from "@tanstack/react-router";
import { StudentLearnPage } from "@/components/student/student-learn";

export const Route = createFileRoute("/student/learn/$id")({
  component: StudentLearnRoute,
});

function StudentLearnRoute() {
  const { id } = Route.useParams();
  return <StudentLearnPage contentId={id} />;
}
