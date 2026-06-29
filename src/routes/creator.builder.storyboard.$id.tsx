import { createFileRoute } from "@tanstack/react-router";
import { StoryboardPage } from "@/components/course/storyboard-page";
import { isStandaloneModuleId } from "@/lib/builder-url";

export const Route = createFileRoute("/creator/builder/storyboard/$id")({
  head: () => ({ meta: [{ title: "Dàn ý bài học — GK Studio" }] }),
  component: CreatorStoryboard,
});

function CreatorStoryboard() {
  const { id } = Route.useParams();
  return <StoryboardPage courseId={id} scope="creator" standalone={isStandaloneModuleId(id)} />;
}
