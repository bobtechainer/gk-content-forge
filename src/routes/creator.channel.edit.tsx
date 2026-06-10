import { createFileRoute } from "@tanstack/react-router";
import { ChannelEditPage } from "@/components/studio-pages";

export const Route = createFileRoute("/creator/channel/edit")({
  component: () => <ChannelEditPage scope="creator" />,
});
