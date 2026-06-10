import { createFileRoute } from "@tanstack/react-router";
import { StudioPage } from "@/components/studio-pages";

function Page() {
  return <StudioPage scope="creator" />;
}

export const Route = createFileRoute("/creator/studio")({
  head: () => ({ meta: [{ title: "Creator studio — GK Content Studio" }] }),
  component: Page,
});
