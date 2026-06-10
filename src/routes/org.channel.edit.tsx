import { createFileRoute } from "@tanstack/react-router";
import { ChannelEditPage } from "@/components/studio-pages";

export const Route = createFileRoute("/org/channel/edit")({
  component: () => <ChannelEditPage scope="org" />,
});
