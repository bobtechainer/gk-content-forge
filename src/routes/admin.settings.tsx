import { createFileRoute } from "@tanstack/react-router";
import { AdminSettingsPage } from "@/components/studio-pages";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Admin settings — GK Content Studio" }] }),
  component: AdminSettingsPage,
});
