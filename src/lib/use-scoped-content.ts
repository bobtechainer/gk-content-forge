import { useMemo } from "react";
import type { ContentItem, RoleId } from "./types";
import { ACCOUNTS } from "./mock-data";
import { ORG_NODES } from "./org-mock-data";
import { subtreeIds } from "./org/tree";
import { useContent } from "@/stores/content";
import { useSession } from "@/stores/session";

export type StudioScope = "creator" | "org" | "admin";

/**
 * The organization a role operates within when in org scope.
 * - publisher acts as itself
 * - a personal account resolves to its first org membership (mock data has one org)
 */
export function resolveActiveOrgId(roleId: RoleId): RoleId {
  if (roleId === "publisher") return "publisher";
  return (ACCOUNTS[roleId]?.orgMemberships?.[0]?.orgId ?? "publisher") as RoleId;
}

/**
 * Returns content visible in the given shell:
 * - admin: everything
 * - org: only the active organization's content (no personal items leak in)
 * - creator: only the current role's items
 */
export function useScopedContent(scope: StudioScope): ContentItem[] {
  const items = useContent((state) => state.items);
  const roleId = useSession((state) => state.roleId);
  const activeNodeId = useSession((state) => state.activeNodeId);

  return useMemo(() => {
    if (scope === "admin" || roleId === "admin") return items;
    // Luồng identity: lọc theo node đang hoạt động + toàn bộ cây con. Chủ sở hữu
    // ở node cha thấy mọi đơn vị con; quản lý nhánh chỉ thấy nội dung nhánh mình.
    if (activeNodeId) {
      const ids = new Set(subtreeIds(ORG_NODES, activeNodeId));
      return items.filter((item) => item.ownerNodeId !== undefined && ids.has(item.ownerNodeId));
    }
    if (!roleId) return [];
    if (scope === "org") {
      const orgId = resolveActiveOrgId(roleId);
      return items.filter((item) => item.ownerId === orgId);
    }
    return items.filter((item) => item.ownerId === roleId);
  }, [items, roleId, activeNodeId, scope]);
}
