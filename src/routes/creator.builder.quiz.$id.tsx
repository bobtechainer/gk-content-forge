import { createFileRoute } from "@tanstack/react-router";
import { QuizBuilder } from "@/components/quiz/quiz-builder";

export const Route = createFileRoute("/creator/builder/quiz/$id")({
  head: () => ({ meta: [{ title: "Soạn bộ đề — GK Studio" }] }),
  component: CreatorQuizBuilder,
});

function CreatorQuizBuilder() {
  const { id } = Route.useParams();
  return <QuizBuilder quizId={id} backTo="/creator/dashboard" />;
}
