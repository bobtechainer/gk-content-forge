import { createFileRoute } from "@tanstack/react-router";
import { AdminReportsPage } from "@/components/studio-pages";

export const Route = createFileRoute("/admin/reports")({
  component: AdminReportsPage,
});
