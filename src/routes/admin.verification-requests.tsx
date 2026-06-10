import { createFileRoute } from "@tanstack/react-router";
import { AdminVerificationRequestsPage } from "@/components/studio-pages";

export const Route = createFileRoute("/admin/verification-requests")({
  component: AdminVerificationRequestsPage,
});
