import { createFileRoute } from "@tanstack/react-router";
import { QuizBuilder } from "@/components/quiz/quiz-builder";

export const Route = createFileRoute("/org/builder/quiz/$id")({
  head: () => ({ meta: [{ title: "Soạn bộ đề — GK Studio" }] }),
  component: OrgQuizBuilder,
});

function OrgQuizBuilder() {
  const { id } = Route.useParams();
  return <QuizBuilder quizId={id} backTo="/org/dashboard" />;
}
