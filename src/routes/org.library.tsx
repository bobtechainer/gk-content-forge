import { createFileRoute } from "@tanstack/react-router";
import { LibraryPage } from "@/components/studio-pages";

function Page() {
  return <LibraryPage scope="org" />;
}

export const Route = createFileRoute("/org/library")({
  head: () => ({ meta: [{ title: "Org library — GK Content Studio" }] }),
  component: Page,
});
