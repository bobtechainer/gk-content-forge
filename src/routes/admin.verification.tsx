import { createFileRoute } from "@tanstack/react-router";
import { VerificationPage } from "@/components/studio-pages";

function Page() {
  return <VerificationPage scope="admin" />;
}

export const Route = createFileRoute("/admin/verification")({
  head: () => ({ meta: [{ title: "Admin verification — GK Content Studio" }] }),
  component: Page,
});
