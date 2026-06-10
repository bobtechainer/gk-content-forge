import { useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import type { ContentStatus, MaterialType } from "@/lib/types";
import { useScopedContent, type StudioScope } from "@/lib/use-scoped-content";
import { usePageLoading } from "@/lib/use-page-loading";
import { useUi } from "@/stores/ui";
import { Button } from "@/components/ui/button";
import { ContentGrid } from "./content-card";
import { ContentTable } from "./content-table";
import { LIBRARY_TABS, MaterialTabs, StatusFilterChips } from "./material-tabs";
import { PageFrame } from "./page-frame";
import { PageSkeleton } from "./page-skeleton";
import { cn } from "@/lib/utils";

/** Resolve the effective MaterialType for filtering. */
function resolveType(item: { category: string; materialSubtype?: string }): MaterialType {
  if (item.category === "book") return "book";
  if (item.category === "course") return "course";
  return (item.materialSubtype ?? "document") as MaterialType;
}

export function LibraryView({ scope }: { scope: StudioScope }) {
  const loading = usePageLoading();
  const search = useUi((s) => s.librarySearch);
  const viewMode = useUi((s) => s.libraryViewMode);
  const setViewMode = useUi((s) => s.setLibraryViewMode);
  const items = useScopedContent(scope);

  const [tabIndex, setTabIndex] = useState(0);
  const [subtype, setSubtype] = useState<MaterialType | null>(null);
  const [status, setStatus] = useState<ContentStatus | null>(null);

  if (loading) return <PageSkeleton />;

  const tab = LIBRARY_TABS[tabIndex];

  const filtered = items.filter((item) => {
    const mt = resolveType(item);
    // Tab filter
    if (!tab.types.includes(mt)) return false;
    // Subtype filter
    if (subtype && mt !== subtype) return false;
    // Status filter
    if (status && item.status !== status) return false;
    // Search filter
    if (search) {
      const q = search.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const title = scope === "org" ? "Thư viện tổ chức" : "Thư viện của tôi";
  const desc =
    scope === "org"
      ? "Quản lý tất cả nội dung của tổ chức."
      : "Quản lý nội dung cá nhân của bạn.";

  return (
    <PageFrame title={title} description={desc}>
      <div className="space-y-4">
        {/* Tabs + View toggle row */}
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <MaterialTabs
              tabIndex={tabIndex}
              onTabChange={setTabIndex}
              subtype={subtype}
              onSubtypeChange={setSubtype}
            />
          </div>
          <div className="flex shrink-0 items-center gap-1 pb-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", viewMode === "table" && "bg-muted")}
              onClick={() => setViewMode("table")}
              aria-label="Xem dạng bảng"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", viewMode === "grid" && "bg-muted")}
              onClick={() => setViewMode("grid")}
              aria-label="Xem dạng lưới"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Status filter chips */}
        <StatusFilterChips value={status} onChange={setStatus} />

        {/* Content display */}
        {viewMode === "table" ? (
          <ContentTable items={filtered} scope={scope} />
        ) : (
          <ContentGrid items={filtered} scope={scope} />
        )}
      </div>
    </PageFrame>
  );
}
