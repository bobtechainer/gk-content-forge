import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/components/studio-pages";

function Page() {
  return <SettingsPage scope="creator" />;
}

export const Route = createFileRoute("/creator/settings")({
  head: () => ({ meta: [{ title: "Creator settings — GK Content Studio" }] }),
  component: Page,
});
