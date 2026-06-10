import { createFileRoute } from "@tanstack/react-router";
import { MembersPage } from "@/components/studio-pages";

export const Route = createFileRoute("/org/members")({
  component: MembersPage,
});
