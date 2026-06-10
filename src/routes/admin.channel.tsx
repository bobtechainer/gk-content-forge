import { createFileRoute } from "@tanstack/react-router";
import { ChannelPage } from "@/components/studio-pages";

function Page() {
  return <ChannelPage scope="admin" />;
}

export const Route = createFileRoute("/admin/channel")({
  head: () => ({ meta: [{ title: "Admin channel — GK Content Studio" }] }),
  component: Page,
});
