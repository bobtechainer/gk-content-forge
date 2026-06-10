import { createFileRoute } from "@tanstack/react-router";
import { ContentStudioShell } from "@/components/content-studio-shell";

export const Route = createFileRoute("/org")({
  component: () => <ContentStudioShell />,
});
