import { createFileRoute } from "@tanstack/react-router";
import { AdminUsersPage } from "@/components/studio-pages";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
});
