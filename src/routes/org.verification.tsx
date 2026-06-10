import { createFileRoute } from "@tanstack/react-router";
import { VerificationPage } from "@/components/studio-pages";

function Page() {
  return <VerificationPage scope="org" />;
}

export const Route = createFileRoute("/org/verification")({
  head: () => ({ meta: [{ title: "Org verification — GK Content Studio" }] }),
  component: Page,
});
