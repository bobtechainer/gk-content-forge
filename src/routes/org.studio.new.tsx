import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/org/studio/new")({
  beforeLoad: () => {
    throw redirect({ to: "/org/studio" });
  },
});
