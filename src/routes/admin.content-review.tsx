import { createFileRoute } from "@tanstack/react-router";
import { AdminContentReviewPage } from "@/components/studio-pages";

export const Route = createFileRoute("/admin/content-review")({
  component: AdminContentReviewPage,
});
