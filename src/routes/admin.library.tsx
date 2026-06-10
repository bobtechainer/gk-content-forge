import { createFileRoute } from "@tanstack/react-router";
import { LibraryPage } from "@/components/studio-pages";

function Page() {
  return <LibraryPage scope="admin" />;
}

export const Route = createFileRoute("/admin/library")({
  head: () => ({ meta: [{ title: "Admin library — GK Content Studio" }] }),
  component: Page,
});
