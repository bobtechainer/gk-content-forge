import { createFileRoute } from "@tanstack/react-router";
import { PartnerAnalyticsPage } from "@/components/partner/partner-analytics";

export const Route = createFileRoute("/org/analytics")({
  head: () => ({ meta: [{ title: "Phân tích hiệu quả — GK Content Studio" }] }),
  component: PartnerAnalyticsPage,
});
