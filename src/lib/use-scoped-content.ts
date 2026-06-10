import { useMemo } from "react";
import type { ContentItem } from "./types";
import { useContent } from "@/stores/content";
import { useSession } from "@/stores/session";

export type StudioScope = "creator" | "org" | "admin";

/**
 * Returns content visible in the given shell:
 * - admin: everything
 * - org: the organization (publisher) plus the current role's items
 * - creator: only the current role's items
 */
export function useScopedContent(scope: StudioScope): ContentItem[] {
  const items = useContent((state) => state.items);
  const roleId = useSession((state) => state.roleId);

  return useMemo(() => {
    if (scope === "admin" || roleId === "admin") return items;
    if (scope === "org")
      return items.filter((item) => item.ownerId === "publisher" || item.ownerId === roleId);
    return items.filter((item) => item.ownerId === roleId);
  }, [items, roleId, scope]);
}
