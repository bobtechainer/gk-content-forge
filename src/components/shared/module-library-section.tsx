import { useNavigate } from "@tanstack/react-router";
import { LayoutList, Palette, Plus, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStoryboardLibrary, allStoryboardItems } from "@/stores/storyboard-library";
import { useUiSystemLibrary, allUiSystemItems } from "@/stores/ui-system-library";
import { storyboardRoutePattern, uiSystemRoutePattern, type BuilderScope } from "@/lib/builder-url";

/**
 * Kho "Module AI" trong Thư viện — hiển thị Storyboard (dàn ý mẫu) và Giao diện
 * (UI System): preset hệ thống + của người dùng. "Tạo mới" mở trình tạo riêng.
 */
export function ModuleLibrarySection({ scope }: { scope: BuilderScope }) {
  const navigate = useNavigate();
  const sbItems = allStoryboardItems(useStoryboardLibrary((s) => s.items));
  const sbRemove = useStoryboardLibrary((s) => s.remove);
  const uiItems = allUiSystemItems(useUiSystemLibrary((s) => s.items));
  const uiRemove = useUiSystemLibrary((s) => s.remove);

  const scratchId = () => `mod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const openStoryboardCreator = () => navigate({ to: storyboardRoutePattern(scope), params: { id: scratchId() } });
  const openUiSystemCreator = () => navigate({ to: uiSystemRoutePattern(scope), params: { id: scratchId() } });

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Module AI</h2>
        <span className="text-xs text-muted-foreground">Dàn ý mẫu & giao diện dùng lại được cho mọi khoá học</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Storyboard */}
        <div className="rounded-lg border border-border p-3">
          <div className="mb-2.5 flex items-center gap-2">
            <LayoutList className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Storyboard</span>
            <span className="rounded-full bg-muted px-1.5 text-[11px] font-medium text-muted-foreground">{sbItems.length}</span>
            <Button variant="outline" size="sm" className="ml-auto h-7 gap-1.5 text-xs" onClick={openStoryboardCreator}>
              <Plus className="h-3.5 w-3.5" /> Tạo mới
            </Button>
          </div>
          <div className="space-y-1.5">
            {sbItems.map((it) => (
              <div key={it.id} className="group flex items-center gap-2.5 rounded-lg border border-border bg-background px-2.5 py-2">
                <LayoutList className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-medium text-foreground">{it.name}</span>
                    {it.source === "system" && <SourceTag />}
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground">{it.description ?? `${it.storyboard.sections.length} phần`}</p>
                </div>
                {it.source === "user" && (
                  <button type="button" onClick={() => sbRemove(it.id)} className="rounded p-1 text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100" aria-label="Xoá">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* UI System */}
        <div className="rounded-lg border border-border p-3">
          <div className="mb-2.5 flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Giao diện (UI System)</span>
            <span className="rounded-full bg-muted px-1.5 text-[11px] font-medium text-muted-foreground">{uiItems.length}</span>
            <Button variant="outline" size="sm" className="ml-auto h-7 gap-1.5 text-xs" onClick={openUiSystemCreator}>
              <Plus className="h-3.5 w-3.5" /> Tạo mới
            </Button>
          </div>
          <div className="space-y-1.5">
            {uiItems.map((it) => (
              <div key={it.id} className="group flex items-center gap-2.5 rounded-lg border border-border bg-background px-2.5 py-2">
                <span className="h-7 w-7 shrink-0 rounded-md border border-border" style={{ background: it.theme.accentSeed }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-medium text-foreground">{it.name}</span>
                    {it.source === "system" && <SourceTag />}
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground">{it.description ?? "Giao diện khoá học"}</p>
                </div>
                {it.source === "user" && (
                  <button type="button" onClick={() => uiRemove(it.id)} className="rounded p-1 text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100" aria-label="Xoá">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SourceTag() {
  return <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">Hệ thống</span>;
}
