import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboardPage } from "@/components/studio-pages";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin dashboard — GK Content Studio" }] }),
  component: AdminDashboardPage,
});
