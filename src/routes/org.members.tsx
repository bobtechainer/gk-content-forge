import { createFileRoute } from "@tanstack/react-router";
import { OrgMembersPage } from "@/components/org/org-members-page";

export const Route = createFileRoute("/org/members")({
  head: () => ({ meta: [{ title: "Thành viên & vai trò — GK Content Studio" }] }),
  component: OrgMembersPage,
});
