import { createFileRoute } from "@tanstack/react-router";
import { StoryboardPage } from "@/components/course/storyboard-page";

export const Route = createFileRoute("/org/builder/storyboard/$id")({
  head: () => ({ meta: [{ title: "Dàn ý bài học — GK Studio" }] }),
  component: OrgStoryboard,
});

function OrgStoryboard() {
  const { id } = Route.useParams();
  return <StoryboardPage courseId={id} scope="org" />;
}
