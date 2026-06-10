import { createFileRoute } from "@tanstack/react-router";
import { LibraryPage } from "@/components/studio-pages";

function Page() {
  return <LibraryPage scope="creator" />;
}

export const Route = createFileRoute("/creator/library")({
  head: () => ({ meta: [{ title: "Creator library — GK Content Studio" }] }),
  component: Page,
});
