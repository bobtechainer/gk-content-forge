import { createFileRoute } from "@tanstack/react-router";
import { ReviewerDetailPage } from "@/components/reviewer/reviewer-detail";

export const Route = createFileRoute("/reviewer/review/$id")({ component: ReviewerDetailPage });
