import { createFileRoute } from "@tanstack/react-router";
import { OrgStructurePage } from "@/components/org/org-tree-page";

export const Route = createFileRoute("/org/structure")({
  head: () => ({ meta: [{ title: "Tổ chức & đơn vị — GK Content Studio" }] }),
  component: OrgStructurePage,
});
