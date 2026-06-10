import { createFileRoute } from "@tanstack/react-router";
import { VerificationPage } from "@/components/studio-pages";

function Page() {
  return <VerificationPage scope="creator" />;
}

export const Route = createFileRoute("/creator/verification")({
  head: () => ({ meta: [{ title: "Creator verification — GK Content Studio" }] }),
  component: Page,
});
