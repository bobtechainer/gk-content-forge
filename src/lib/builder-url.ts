import type { ContentItem } from "@/lib/types";

/** Scope of a studio workspace — decides the `/creator` vs `/org` URL prefix. */
export type BuilderScope = "creator" | "org";

/** Minimal item shape needed to resolve which builder a piece of content opens. */
type BuilderItem = Pick<ContentItem, "id" | "category" | "materialSubtype">;

function builderSegment(item: BuilderItem): "book" | "course" | "quiz" | "material" {
  if (item.category === "book") return "book";
  if (item.category === "course") return "course";
  if (item.materialSubtype === "quiz") return "quiz";
  return "material";
}

/**
 * TanStack route *pattern* (ends in `$id`) for a `<Link to=…>` paired with
 * `params={{ id }}`. `base` is the workspace prefix (`/creator` or `/org`).
 */
export function builderRoutePattern(base: string, item: BuilderItem): string {
  return `${base}/builder/${builderSegment(item)}/$id`;
}

/**
 * Concrete builder URL (id substituted) — for `window.open(...)` when opening a
 * builder in a new browser tab.
 */
export function builderHref(scope: BuilderScope, item: BuilderItem): string {
  const base = scope === "org" ? "/org" : "/creator";
  return `${base}/builder/${builderSegment(item)}/${item.id}`;
}

/* ─── Route patterns cho các trang chuyên dụng của course builder ───
 * Trả về literal union (qua `as const`) để `<Link to=…>` / `navigate` của
 * TanStack vẫn type-check sau khi route tree được sinh lại.
 * ────────────────────────────────────────────────────────────────── */

export function courseBuilderRoutePattern(scope: BuilderScope) {
  if (scope === "org") return "/org/builder/course/$id" as const;
  return "/creator/builder/course/$id" as const;
}

export function storyboardRoutePattern(scope: BuilderScope) {
  if (scope === "org") return "/org/builder/storyboard/$id" as const;
  return "/creator/builder/storyboard/$id" as const;
}

export function uiSystemRoutePattern(scope: BuilderScope) {
  if (scope === "org") return "/org/builder/ui-system/$id" as const;
  return "/creator/builder/ui-system/$id" as const;
}
