import { createFileRoute } from "@tanstack/react-router";
import { UiSystemPage } from "@/components/course/ui-system-page";
import { isStandaloneModuleId } from "@/lib/builder-url";

export const Route = createFileRoute("/creator/builder/ui-system/$id")({
  head: () => ({ meta: [{ title: "Tạo giao diện — GK Studio" }] }),
  component: CreatorUiSystem,
});

function CreatorUiSystem() {
  const { id } = Route.useParams();
  return <UiSystemPage courseId={id} scope="creator" standalone={isStandaloneModuleId(id)} />;
}
