import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/creator/studio/new")({
  beforeLoad: () => {
    throw redirect({ to: "/creator/studio" });
  },
});
