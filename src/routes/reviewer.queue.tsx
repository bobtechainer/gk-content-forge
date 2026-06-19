import { createFileRoute } from "@tanstack/react-router";
import { ReviewerQueuePage } from "@/components/reviewer/reviewer-queue";

export const Route = createFileRoute("/reviewer/queue")({ component: ReviewerQueuePage });
