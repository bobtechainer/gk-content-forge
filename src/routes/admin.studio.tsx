import { createFileRoute } from "@tanstack/react-router";
import { StudioPage } from "@/components/studio-pages";

function Page() {
  return <StudioPage scope="admin" />;
}

export const Route = createFileRoute("/admin/studio")({
  head: () => ({ meta: [{ title: "Admin studio — GK Content Studio" }] }),
  component: Page,
});
