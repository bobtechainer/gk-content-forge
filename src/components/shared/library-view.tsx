import { useState } from "react";
import { GitBranch, LayoutGrid, List, Users } from "lucide-react";
import type { ContentItem, ContentStatus, MaterialType } from "@/lib/types";
import { useScopedContent, type StudioScope } from "@/lib/use-scoped-content";
import { usePageLoading } from "@/lib/use-page-loading";
import { useUi } from "@/stores/ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ContentGrid } from "./content-card";
import { ContentTable } from "./content-table";
import { LIBRARY_TABS, MaterialTabs, StatusFilterChips } from "./material-tabs";
import { PageFrame } from "./page-frame";
import { PageSkeleton } from "./page-skeleton";
import { ModuleGallery } from "./module-library-section";
import type { BuilderScope } from "@/lib/builder-url";
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
  const [detailItem, setDetailItem] = useState<ContentItem | null>(null);

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

  // Items with version history or co-authors get a "Chi tiết" affordance (additive panel).
  const withHistory = filtered.filter(
    (item) =>
      (item.versionHistory && item.versionHistory.length > 0) ||
      (item.coAuthors && item.coAuthors.length > 0),
  );

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

        {tab.module ? (
          /* Tab module riêng: Storyboard / UI System */
          <ModuleGallery module={tab.module} scope={scope as BuilderScope} />
        ) : (
          <>
            {/* Status filter chips */}
            <StatusFilterChips value={status} onChange={setStatus} />

            {/* Content display */}
            {viewMode === "table" ? (
              <ContentTable items={filtered} scope={scope} />
            ) : (
              <ContentGrid items={filtered} scope={scope} />
            )}
          </>
        )}

        {/* Version history & co-authors — additive panel, does not affect list/search */}
        {withHistory.length > 0 && (
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                Lịch sử phiên bản & đồng tác giả
              </h2>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Học liệu được biên tập nhiều phiên bản hoặc đồng tác giả. Xem chi tiết để theo dõi quá
              trình cập nhật.
            </p>
            <ul className="divide-y divide-border">
              {withHistory.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">{item.title}</div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {item.versionHistory && item.versionHistory.length > 0 && (
                        <span>{item.versionHistory.length} phiên bản</span>
                      )}
                      {item.coAuthors && item.coAuthors.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {item.coAuthors.length} đồng tác giả
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => setDetailItem(item)}
                  >
                    Chi tiết
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <ContentDetailDialog item={detailItem} onClose={() => setDetailItem(null)} />
    </PageFrame>
  );
}

function ContentDetailDialog({
  item,
  onClose,
}: {
  item: ContentItem | null;
  onClose: () => void;
}) {
  if (!item) return null;

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item.title}</DialogTitle>
          <DialogDescription>
            Lịch sử phiên bản và đồng tác giả của học liệu này.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Co-authors */}
          {item.coAuthors && item.coAuthors.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> Đồng tác giả
              </div>
              <div className="flex flex-wrap gap-1.5">
                {item.coAuthors.map((name) => (
                  <span
                    key={name}
                    className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Version history timeline */}
          {item.versionHistory && item.versionHistory.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <GitBranch className="h-3.5 w-3.5" /> Lịch sử phiên bản
              </div>
              <ol className="relative space-y-4 border-l border-border pl-5">
                {item.versionHistory.map((version, index) => (
                  <li key={`${version.version}-${index}`} className="relative">
                    <span
                      className={cn(
                        "absolute -left-[1.65rem] flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
                        index === 0
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {version.version.replace(/^v/i, "")}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{version.version}</span>
                      {index === 0 && (
                        <span className="rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                          Hiện tại
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(version.date).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-foreground">{version.note}</p>
                    <p className="text-xs text-muted-foreground">{version.authorName}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
