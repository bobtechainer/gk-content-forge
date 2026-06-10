import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/components/studio-pages";

function Page() {
  return <DashboardPage scope="creator" />;
}

export const Route = createFileRoute("/creator/dashboard")({
  head: () => ({ meta: [{ title: "Creator dashboard — GK Content Studio" }] }),
  component: Page,
});
