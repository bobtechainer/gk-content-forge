import { useNavigate } from "@tanstack/react-router";
import { LayoutList, Palette, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStoryboardLibrary, allStoryboardItems } from "@/stores/storyboard-library";
import { useUiSystemLibrary, allUiSystemItems } from "@/stores/ui-system-library";
import { ramp } from "@/lib/theme/color";
import { FONT_PAIRS } from "@/lib/theme/system-themes";
import { storyboardRoutePattern, uiSystemRoutePattern, type BuilderScope } from "@/lib/builder-url";

/**
 * Kho của MỘT module (Storyboard hoặc UI System) — hiển thị như một tab lớn trong
 * Thư viện. Preset hệ thống + của người dùng. Module độc lập, dùng lại / inject mọi nơi.
 */
export function ModuleGallery({ module, scope }: { module: "storyboard" | "ui_system"; scope: BuilderScope }) {
  const navigate = useNavigate();
  const sbItems = allStoryboardItems(useStoryboardLibrary((s) => s.items));
  const sbRemove = useStoryboardLibrary((s) => s.remove);
  const uiItems = allUiSystemItems(useUiSystemLibrary((s) => s.items));
  const uiRemove = useUiSystemLibrary((s) => s.remove);

  const scratchId = () => `mod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const isSb = module === "storyboard";
  const count = isSb ? sbItems.length : uiItems.length;

  const openCreator = () =>
    navigate(
      isSb
        ? { to: storyboardRoutePattern(scope), params: { id: scratchId() } }
        : { to: uiSystemRoutePattern(scope), params: { id: scratchId() } },
    );

  return (
    <div className="space-y-4">
      {/* Module banner */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-primary">
          {isSb ? <LayoutList className="h-5 w-5" /> : <Palette className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-foreground">{isSb ? "Storyboard" : "Giao diện (UI System)"}</h2>
          <p className="text-xs text-muted-foreground">
            {isSb
              ? "Dàn ý mẫu dùng lại được — chèn vào bài học, khoá học hoặc học liệu qua nút “+” của trợ lý AI."
              : "Bộ giao diện dùng lại được — áp cho khoá học/học liệu, hoặc đính kèm qua trợ lý AI."}
          </p>
        </div>
        <span className="hidden shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground sm:inline">{count} mục</span>
        <Button size="sm" className="shrink-0 gap-1.5 bg-primary text-white hover:bg-primary-hover" onClick={openCreator}>
          <Plus className="h-4 w-4" /> Tạo mới
        </Button>
      </div>

      {/* Gallery grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isSb
          ? sbItems.map((it) => (
              <div key={it.id} className="group relative overflow-hidden rounded-xl border border-border bg-card transition hover:shadow-sm">
                <div className="space-y-1 border-b border-border bg-muted/30 p-3">
                  {it.storyboard.sections.slice(0, 4).map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="flex h-4 w-4 items-center justify-center rounded bg-brand-50 text-[9px] font-bold text-primary">{i + 1}</span>
                      <span className="truncate">{s.title}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{it.name}</p>
                    <p className="text-[11px] text-muted-foreground">{it.source === "system" ? "Hệ thống" : "Của tôi"} · {it.storyboard.sections.length} phần</p>
                  </div>
                  {it.source === "user" && (
                    <button type="button" onClick={() => sbRemove(it.id)} className="rounded p-1 text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100" aria-label="Xoá">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          : uiItems.map((it) => {
              const r = ramp(it.theme.accentSeed);
              const font = FONT_PAIRS.find((f) => f.id === it.theme.fontPairId)?.label ?? "Hệ thống";
              return (
                <div key={it.id} className="group relative overflow-hidden rounded-xl border border-border bg-card transition hover:shadow-sm">
                  <div className="flex h-16 items-stretch border-b border-border" style={{ background: r.soft }}>
                    <div className="flex flex-1 items-center justify-center text-xs font-bold" style={{ color: it.theme.accentSeed }}>Aa</div>
                    <div className="w-10" style={{ background: it.theme.accentSeed }} />
                    <div className="w-6" style={{ background: r.strong }} />
                  </div>
                  <div className="flex items-center gap-2 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{it.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{it.source === "system" ? "Hệ thống" : "Của tôi"} · {font}</p>
                    </div>
                    {it.source === "user" && (
                      <button type="button" onClick={() => uiRemove(it.id)} className="rounded p-1 text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100" aria-label="Xoá">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
