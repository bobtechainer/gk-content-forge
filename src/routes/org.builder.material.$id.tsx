import { createFileRoute } from "@tanstack/react-router";
import { MaterialUploadForm } from "@/components/shared/material-upload-form";

export const Route = createFileRoute("/org/builder/material/$id")({
  head: () => ({ meta: [{ title: "Soạn học liệu — GK Studio" }] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  return <MaterialUploadForm scope="org" id={id} />;
}
