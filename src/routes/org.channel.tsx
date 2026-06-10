import { createFileRoute } from "@tanstack/react-router";
import { ChannelPage } from "@/components/studio-pages";

function Page() {
  return <ChannelPage scope="org" />;
}

export const Route = createFileRoute("/org/channel")({
  head: () => ({ meta: [{ title: "Org channel — GK Content Studio" }] }),
  component: Page,
});
