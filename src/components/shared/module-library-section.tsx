import { LayoutList, Palette, Plus, Trash2, Pencil, Copy, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useStoryboardLibrary, allStoryboardItems } from "@/stores/storyboard-library";
import { useUiSystemLibrary, allUiSystemItems } from "@/stores/ui-system-library";
import { ramp } from "@/lib/theme/color";
import { sceneSrc } from "@/lib/storyboard/scene-art";
import { FONT_PAIRS } from "@/lib/theme/system-themes";
import { type BuilderScope } from "@/lib/builder-url";
import { useModuleStart } from "@/stores/module-start";

/**
 * Kho của MỘT module (Storyboard hoặc UI System) — hiển thị như một tab lớn trong
 * Thư viện. Preset hệ thống + của người dùng. CRUD đầy đủ: tạo / xem / sửa / nhân
 * bản / xoá. Module độc lập, dùng lại / inject mọi nơi.
 */
export function ModuleGallery({ module, scope }: { module: "storyboard" | "ui_system"; scope: BuilderScope }) {
  const sbItems = allStoryboardItems(useStoryboardLibrary((s) => s.items));
  const sbAdd = useStoryboardLibrary((s) => s.add);
  const sbRemove = useStoryboardLibrary((s) => s.remove);
  const uiItems = allUiSystemItems(useUiSystemLibrary((s) => s.items));
  const uiAdd = useUiSystemLibrary((s) => s.add);
  const uiRemove = useUiSystemLibrary((s) => s.remove);

  const isSb = module === "storyboard";
  const count = isSb ? sbItems.length : uiItems.length;
  const base = scope === "org" ? "/org" : "/creator";
  const segment = isSb ? "storyboard" : "ui-system";

  // Mở trình tạo/sửa ở tab mới (đồng nhất với cách mở builder khác trong app).
  const openBuilder = (id: string) => window.open(`${base}/builder/${segment}/${id}`, "_blank", "noopener");
  const openCreator = () => useModuleStart.getState().request({ module, scope, newTab: true });

  return (
    <div className="space-y-4">
      {/* Module banner */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-primary">
          {isSb ? <LayoutList className="h-5 w-5" /> : <Palette className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-foreground">{isSb ? "Storyboard" : "Giao diện"}</h2>
          <p className="text-xs text-muted-foreground">
            {isSb
              ? "Những dàn ý bạn đã phác cho khoá và bài. Trong builder, bấm “Chèn storyboard” để xem trước rồi áp vào mục lục khoá hoặc bài."
              : "Những bộ màu, phông, bố cục bạn đã dựng. Chọn một bộ để áp cho cả khoá học."}
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
          ? sbItems.map((it) => {
              const frames = it.storyboard.sections.flatMap((s) => s.items);
              return (
                <div key={it.id} className="group relative overflow-hidden rounded-xl border border-border bg-card transition hover:shadow-md">
                  {/* Thumbnail ảnh cảnh */}
                  <div className="flex gap-1 border-b border-border bg-muted/30 p-2">
                    {frames.slice(0, 3).map((f, i) => (
                      <div key={i} className="relative h-16 flex-1 overflow-hidden rounded-md bg-cover bg-center" style={{ backgroundImage: `url("${sceneSrc(f.image)}")` }}>
                        <span className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">{i + 1}</span>
                      </div>
                    ))}
                    {frames.length === 0 && <div className="h-16 flex-1 rounded-md bg-muted" />}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium text-foreground">{it.name}</p>
                    <p className="text-[11px] text-muted-foreground">{it.source === "system" ? "Hệ thống" : "Của tôi"} · {frames.length} khung</p>
                    <CardActions
                      isSystem={it.source === "system"}
                      onOpen={() => openBuilder(it.id)}
                      onDuplicate={() => { const id = sbAdd({ name: `${it.name} (bản sao)`, subject: it.subject, storyboard: it.storyboard }); toast.success("Đã nhân bản — mở để chỉnh sửa nhé."); openBuilder(id); }}
                      onDelete={it.source === "user" ? () => { sbRemove(it.id); toast.success("Đã xoá khỏi kho."); } : undefined}
                    />
                  </div>
                </div>
              );
            })
          : uiItems.map((it) => {
              const r = ramp(it.theme.accentSeed);
              const font = FONT_PAIRS.find((f) => f.id === it.theme.fontPairId)?.label ?? "Hệ thống";
              return (
                <div key={it.id} className="group relative overflow-hidden rounded-xl border border-border bg-card transition hover:shadow-md">
                  <div className="flex h-16 items-stretch border-b border-border" style={{ background: r.soft }}>
                    <div className="flex flex-1 items-center justify-center text-xs font-bold" style={{ color: it.theme.accentSeed }}>Aa</div>
                    <div className="w-10" style={{ background: it.theme.accentSeed }} />
                    <div className="w-6" style={{ background: r.strong }} />
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium text-foreground">{it.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{it.source === "system" ? "Hệ thống" : "Của tôi"} · {font}</p>
                    <CardActions
                      isSystem={it.source === "system"}
                      onOpen={() => openBuilder(it.id)}
                      onDuplicate={() => { const id = uiAdd({ name: `${it.name} (bản sao)`, description: it.description, theme: it.theme }); toast.success("Đã nhân bản — mở để chỉnh sửa nhé."); openBuilder(id); }}
                      onDelete={it.source === "user" ? () => { uiRemove(it.id); toast.success("Đã xoá khỏi kho."); } : undefined}
                    />
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}

function CardActions({
  isSystem, onOpen, onDuplicate, onDelete,
}: {
  isSystem: boolean;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="mt-2.5 flex items-center gap-1.5">
      <Button variant="outline" size="sm" className="h-7 flex-1 gap-1.5 text-xs" onClick={onOpen}>
        {isSystem ? <><Eye className="h-3.5 w-3.5" /> Xem</> : <><Pencil className="h-3.5 w-3.5" /> Sửa</>}
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDuplicate} aria-label="Nhân bản" title="Nhân bản">
        <Copy className="h-3.5 w-3.5" />
      </Button>
      {onDelete && (
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onDelete} aria-label="Xoá" title="Xoá">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
