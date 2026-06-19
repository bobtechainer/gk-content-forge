import { createFileRoute } from "@tanstack/react-router";
import { PartnerSigningPage } from "@/components/partner/partner-signing";

export const Route = createFileRoute("/org/signing")({
  head: () => ({ meta: [{ title: "Đăng ký & ký số học liệu — GK Content Studio" }] }),
  component: PartnerSigningPage,
});
