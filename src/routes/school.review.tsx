import { createFileRoute } from "@tanstack/react-router";
import { SchoolReviewPage } from "@/components/school/school-review";

export const Route = createFileRoute("/school/review")({
  component: SchoolReviewPage,
});
