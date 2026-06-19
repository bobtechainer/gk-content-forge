import { createFileRoute } from "@tanstack/react-router";
import { SchoolDashboardPage } from "@/components/school/school-dashboard";

export const Route = createFileRoute("/school/dashboard")({
  component: SchoolDashboardPage,
});
