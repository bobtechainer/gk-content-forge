import { createFileRoute } from "@tanstack/react-router";
import { ChannelPage } from "@/components/studio-pages";

function Page() {
  return <ChannelPage scope="creator" />;
}

export const Route = createFileRoute("/creator/channel")({
  head: () => ({ meta: [{ title: "Creator channel — GK Content Studio" }] }),
  component: Page,
});
