import { createFileRoute } from "@tanstack/react-router";
import { ReviewerReportsPage } from "@/components/reviewer/reviewer-reports";

export const Route = createFileRoute("/reviewer/reports")({ component: ReviewerReportsPage });
