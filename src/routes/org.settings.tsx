import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/components/studio-pages";

function Page() {
  return <SettingsPage scope="org" />;
}

export const Route = createFileRoute("/org/settings")({
  head: () => ({ meta: [{ title: "Org settings — GK Content Studio" }] }),
  component: Page,
});
