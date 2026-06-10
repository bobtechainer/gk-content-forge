import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/components/studio-pages";

function Page() {
  return <DashboardPage scope="org" />;
}

export const Route = createFileRoute("/org/dashboard")({
  head: () => ({ meta: [{ title: "Org dashboard — GK Content Studio" }] }),
  component: Page,
});
