import { createFileRoute } from "@tanstack/react-router";
import { StudioPage } from "@/components/studio-pages";

function Page() {
  return <StudioPage scope="org" />;
}

export const Route = createFileRoute("/org/studio")({
  head: () => ({ meta: [{ title: "Org studio — GK Content Studio" }] }),
  component: Page,
});
