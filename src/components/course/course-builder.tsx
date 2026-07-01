import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCenter, pointerWithin, rectIntersection, MeasuringStrategy,
  type DragEndEvent, type DragStartEvent, type DragOverEvent, type CollisionDetection,
} from "@dnd-kit/core";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Eye, Edit3, Monitor, Tablet, Smartphone,
  PanelLeft, Sparkles, LayoutList, Palette, Plus, ArrowUpRight, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BLOCK_TYPES } from "./course-palette";
import { PageCanvas } from "./page-canvas";
import { LessonTree } from "./lesson-tree";
import { AiAssistantPanel } from "./ai-assistant-panel";
import { InsertStoryboardPanel } from "./insert-storyboard-panel";
import { useInsertStoryboard } from "@/stores/insert-storyboard";
import { useBlockFocus } from "@/stores/block-focus";
import { PublishSheet } from "@/components/publish-sheet";
import { toast } from "sonner";
import { useCourse } from "@/stores/course";
import type { CourseBlockType } from "@/stores/course";
import { useContent } from "@/stores/content";
import { useCourseTheme } from "@/stores/course-theme";
import { useUiSystemLibrary, allUiSystemItems, type UiSystemLibraryItem } from "@/stores/ui-system-library";
import { useModuleStart } from "@/stores/module-start";
import { getResolvedThemeVars, type CourseTheme } from "@/lib/theme/resolve";
import { ramp } from "@/lib/theme/color";
import { FONT_PAIRS } from "@/lib/theme/system-themes";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { ContentItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { type Viewport } from "@/lib/preview/viewport";
import { type BuilderScope } from "@/lib/builder-url";

/** Khung xem trước giao diện trực tiếp: swatch màu, phông, và mẫu bài học áp theme. */
function ThemePreviewPane({ theme, name, description }: { theme: CourseTheme; name: string; description?: string }) {
  const vars = getResolvedThemeVars(theme) as React.CSSProperties;
  const r = ramp(theme.accentSeed);
  const font = FONT_PAIRS.find((f) => f.id === theme.fontPairId)?.label ?? "Hệ thống";
  return (
    <div>
      <p className="text-sm font-semibold text-foreground">{name}</p>
      <p className="text-[11px] text-muted-foreground">{description ? `${description} · ` : ""}Phông {font} · {theme.mode === "dark" ? "Nền tối" : "Nền sáng"}</p>

      <div className="mt-3 flex items-center gap-1.5">
        {[r.soft, r.accent, r.strong].map((c) => (
          <span key={c} className="h-8 w-12 rounded-md border border-border" style={{ background: c }} />
        ))}
      </div>

      {/* Mẫu bài học áp theme (xem trước trực tiếp) */}
      <div data-course-theme style={vars} className="mt-3">
        <div className="overflow-hidden rounded-xl border p-4" style={{ background: "var(--course-surface)", borderColor: "color-mix(in srgb, var(--course-ink) 12%, transparent)", fontFamily: "var(--course-font-body)" }}>
          <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--course-accent)" }}>Chương 2</span>
          <h3 className="mt-1 text-lg font-extrabold" style={{ fontFamily: "var(--course-font-heading)", color: "var(--course-ink)" }}>Tốc độ phản ứng</h3>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--course-ink)", opacity: 0.82 }}>Nhiệt độ, nồng độ và chất xúc tác đều ảnh hưởng đến tốc độ phản ứng hoá học.</p>
          <div className="mt-3 flex gap-2">
            <span className="px-3 py-1.5 text-xs font-semibold" style={{ background: "var(--course-accent)", color: "var(--course-accent-fg)", borderRadius: "var(--course-radius)" }}>Tiếp tục học</span>
            <span className="border px-3 py-1.5 text-xs font-medium" style={{ borderColor: "var(--course-accent)", color: "var(--course-accent)", borderRadius: "var(--course-radius)" }}>Làm bài tập</span>
          </div>
          <div className="mt-3 rounded-lg p-2.5 text-xs" style={{ background: "var(--course-callout-tip)", color: "var(--course-callout-tip-fg)" }}>
            Mẹo: đọc kỹ ví dụ trước khi làm bài tập vận dụng.
          </div>
        </div>
      </div>
    </div>
  );
}

/** Thanh "Giao diện khoá học" — bấm mở popup: vừa chọn vừa xem trước trực tiếp, có "Tạo mới". */
function CourseThemePicker({ courseId, scope }: { courseId: string; scope: BuilderScope }) {
  const [open, setOpen] = useState(false);
  const [selId, setSelId] = useState<string | null>(null);
  const items = allUiSystemItems(useUiSystemLibrary((s) => s.items));
  const setTheme = useCourseTheme((s) => s.setTheme);
  const current = useCourseTheme((s) => s.byCourse[courseId]);
  const currentItem = items.find((it) => current && it.theme.accentSeed.toLowerCase() === current.accentSeed.toLowerCase() && it.theme.fontPairId === current.fontPairId);
  const currentName = currentItem?.name;

  // Mục đang xem trước: ưu tiên mục vừa chọn, mặc định giao diện đang dùng, rồi mục đầu.
  const sel = items.find((it) => it.id === selId) ?? currentItem ?? items[0];

  const apply = () => {
    if (!sel) return;
    setTheme(courseId, sel.theme);
    toast.success(`Đã đổi giao diện sang “${sel.name}”`);
    setOpen(false);
  };
  const createNew = () => useModuleStart.getState().request({ module: "ui_system", scope, newTab: true });

  return (
    <div className="border-b border-border bg-card p-2">
      <button type="button" onClick={() => { setSelId(null); setOpen(true); }} className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-left transition hover:border-primary">
        <span className="h-6 w-6 shrink-0 rounded-md border border-border" style={{ background: current?.accentSeed ?? "var(--primary)" }} />
        <span className="min-w-0 flex-1">
          <span className="block text-[9px] font-medium uppercase tracking-wide text-muted-foreground">Giao diện khoá học</span>
          <span className="block truncate text-xs font-semibold text-foreground">{currentName ?? "Mặc định"}</span>
        </span>
        <Palette className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 p-0 sm:max-w-3xl">
          <DialogHeader className="px-5 pb-3 pt-5 pr-10 text-left">
            <DialogTitle>Giao diện khoá học</DialogTitle>
            <DialogDescription>Chọn một bộ giao diện — xem trước trực tiếp bên phải rồi áp cho cả khoá.</DialogDescription>
          </DialogHeader>

          <div className="flex h-[440px] border-t border-border">
            {/* Danh sách chọn */}
            <div className="w-[248px] shrink-0 space-y-1 overflow-y-auto border-r border-border p-2">
              {items.map((it) => {
                const active = sel?.id === it.id;
                const isCurrent = currentName === it.name;
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => setSelId(it.id)}
                    className={cn("flex w-full items-center gap-2 rounded-lg border p-2 text-left transition", active ? "border-primary bg-accent" : "border-transparent hover:border-primary hover:bg-accent")}
                  >
                    <span className="h-7 w-7 shrink-0 rounded-md border border-border" style={{ background: it.theme.accentSeed }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-foreground">{it.name}</span>
                      <span className="block truncate text-[10px] text-muted-foreground">{it.source === "system" ? "Hệ thống" : "Của tôi"}{it.description ? ` · ${it.description}` : ""}</span>
                    </span>
                    {isCurrent && <span className="shrink-0 text-[10px] font-semibold text-primary">Đang dùng</span>}
                  </button>
                );
              })}
            </div>

            {/* Xem trước trực tiếp */}
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {sel ? (
                <ThemePreviewPane theme={sel.theme} name={sel.name} description={sel.description} />
              ) : (
                <p className="py-12 text-center text-xs text-muted-foreground">Chọn một giao diện bên trái để xem trước.</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 border-t border-border px-5 py-3">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={createNew}>
              <Plus className="h-3.5 w-3.5" /> Tạo mới giao diện <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setOpen(false)}>Huỷ</Button>
              <Button size="sm" className="gap-1.5 bg-primary text-xs text-primary-foreground hover:bg-primary-hover" disabled={!sel} onClick={apply}>
                <Check className="h-3.5 w-3.5" /> Áp dụng giao diện
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export type CourseBuilderBackTo = "/creator/dashboard" | "/org/dashboard";

export function CourseBuilder({ courseId: id, backTo }: { courseId: string; backTo: CourseBuilderBackTo }) {
  const navigate = useNavigate();
  const scope: BuilderScope = backTo.includes("/org") ? "org" : "creator";

  const init = useCourse((s) => s.init);
  const courseData = useCourse((s) => s.courseData[id]);
  const activeLessonId = useCourse((s) => s.activeLessonId);
  const setActiveLesson = useCourse((s) => s.setActiveLesson);
  const addBlock = useCourse((s) => s.addBlock);
  const updateBlock = useCourse((s) => s.updateBlock);
  const deleteBlock = useCourse((s) => s.deleteBlock);
  const duplicateBlock = useCourse((s) => s.duplicateBlock);
  const moveBlockToIndex = useCourse((s) => s.moveBlockToIndex);
  const publishLesson = useCourse((s) => s.publishLesson);
  const getLessonPublishState = useCourse((s) => s.getLessonPublishState);
  const openInsertStoryboard = useInsertStoryboard((s) => s.openPanel);
  const closeInsertStoryboard = useInsertStoryboard((s) => s.closePanel);
  const insertStoryboardOpen = useInsertStoryboard((s) => s.open);

  const item = useContent((s) => s.items.find((x) => x.id === id));
  const updateItem = useContent((s) => s.updateItem);

  const [title, setTitle] = useState(item?.title ?? "Khóa học chưa đặt tên");
  const [publishOpen, setPublishOpen] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragType, setActiveDragType] = useState<CourseBlockType | null>(null);
  const [activeDragMaterial, setActiveDragMaterial] = useState<ContentItem | null>(null);
  const [activeDragLabel, setActiveDragLabel] = useState<{ kind: "block" | "lesson"; label: string; color: string } | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  // Panel visibility
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  // Mở builder mặc định ở chế độ Soạn (TalentLMS-style editing).
  const [previewMode, setPreviewMode] = useState(false);
  const [viewport, setViewport] = useState<Viewport>("desktop");

  useEffect(() => { init(id); }, [id, init]);
  useEffect(() => { if (item) setTitle(item.title); }, [item?.id]); // eslint-disable-line

  // Esc thoát preview.
  useEffect(() => {
    if (!previewMode) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPreviewMode(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewMode]);

  const chapters = courseData?.chapters ?? [];
  const lessons = courseData?.lessons ?? [];
  const activeLesson = lessons.find((l) => l.id === activeLessonId);
  const activeBlocks = activeLesson?.blocks ?? [];

  const activeLessonPublishState = activeLessonId
    ? getLessonPublishState(id, activeLessonId)
    : "never";
  const showPublishLessonBtn = activeLessonPublishState === "dirty" || activeLessonPublishState === "never";

  const getPublishState = (lessonId: string) => getLessonPublishState(id, lessonId);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const collisionDetection = useCallback<CollisionDetection>((args) => {
    const pointerHits = pointerWithin(args);
    const intersections = pointerHits.length > 0 ? pointerHits : rectIntersection(args);
    const blockHits = intersections.filter((h) => h.id !== "canvas-drop");
    if (blockHits.length > 0) {
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter((c) => c.id !== "canvas-drop"),
      });
    }
    return intersections;
  }, []);

  const saveTitle = () => {
    if (item && title.trim() && title !== item.title) updateItem(id, { title: title.trim() });
  };

  const onDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current as Record<string, unknown> | undefined;
    setActiveDragId(String(e.active.id));
    setDropIndex(null);
    setActiveDragType(null);
    setActiveDragMaterial(null);
    setActiveDragLabel(null);
    if (data?.source === "block") {
      const blk = activeBlocks.find((b) => b.id === String(e.active.id));
      const meta = blk ? BLOCK_TYPES.find((t) => t.type === blk.type) : undefined;
      if (meta) setActiveDragLabel({ kind: "block", label: meta.label, color: meta.color });
    }
  };

  const computeDropIndex = (e: DragOverEvent | DragEndEvent): number | null => {
    const { active, over } = e;
    if (!over) return null;
    const overId = String(over.id);
    if (overId === "canvas-drop") return activeBlocks.length;
    const overIndex = activeBlocks.findIndex((b) => b.id === overId);
    if (overIndex < 0) return null;
    const activeRect = active.rect.current.translated;
    const overRect = over.rect;
    const after = activeRect
      ? activeRect.top + activeRect.height / 2 > overRect.top + overRect.height / 2
      : false;
    return after ? overIndex + 1 : overIndex;
  };

  const onDragOver = (e: DragOverEvent) => {
    const src = (e.active.data.current as Record<string, unknown> | undefined)?.source;
    if (src !== "block") {
      setDropIndex(null);
      return;
    }
    setDropIndex(computeDropIndex(e));
  };

  const onDragEnd = (e: DragEndEvent) => {
    const active = e.active;
    const over = e.over;
    const data = active.data.current as Record<string, unknown> | undefined;
    const targetIndex = computeDropIndex(e);
    setActiveDragId(null);
    setActiveDragType(null);
    setActiveDragMaterial(null);
    setActiveDragLabel(null);
    setDropIndex(null);
    if (!over || !activeLessonId) return;

    if (data?.source === "block") {
      const fromIndex = activeBlocks.findIndex((b) => b.id === String(active.id));
      if (fromIndex < 0 || targetIndex === null) return;
      const to = targetIndex > fromIndex ? targetIndex - 1 : targetIndex;
      if (to === fromIndex) return;
      moveBlockToIndex(id, activeLessonId, String(active.id), to);
      return;
    }
  };

  const handleAddBlock = useCallback((type: CourseBlockType, atIndex?: number) => {
    if (!activeLessonId) { toast.info("Hãy chọn bài học trước"); return; }
    const bid = addBlock(id, activeLessonId, type, atIndex);
    if (bid) useBlockFocus.getState().focus(bid);
  }, [id, activeLessonId, addBlock]);

  const handleDuplicateBlock = useCallback((blockId: string) => {
    if (!activeLessonId) return;
    duplicateBlock(id, activeLessonId, blockId);
  }, [id, activeLessonId, duplicateBlock]);

  const handleMoveBlock = useCallback((blockId: string, dir: "up" | "down") => {
    if (!activeLessonId) return;
    const idx = activeBlocks.findIndex((b) => b.id === blockId);
    if (idx < 0) return;
    const to = dir === "up" ? idx - 1 : idx + 1;
    if (to < 0 || to >= activeBlocks.length) return;
    moveBlockToIndex(id, activeLessonId, blockId, to);
  }, [id, activeLessonId, activeBlocks, moveBlockToIndex]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex h-screen flex-col bg-muted">
        {/* ─── Header ─────────────────────────────────────────────── */}
        <div className="z-20 flex h-12 shrink-0 items-center gap-2 border-b border-border bg-card px-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Quay lại" onClick={() => navigate({ to: backTo })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {!previewMode && (
            <Button
              variant="ghost" size="icon"
              className={cn("h-8 w-8", showLeftPanel && "text-primary")}
              aria-label={showLeftPanel ? "Ẩn cấu trúc" : "Hiện cấu trúc"}
              onClick={() => setShowLeftPanel((v) => !v)}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-[10px] font-bold text-primary-foreground">C</div>
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={saveTitle}
              aria-label="Tiêu đề khóa học"
              className="min-w-0 flex-1 rounded bg-transparent px-1 py-1 text-sm font-semibold text-foreground outline-none hover:bg-muted/50 focus:bg-muted/50" />
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {/* Preview / Soạn */}
            <div className="flex rounded-lg border p-0.5">
              <button
                onClick={() => setPreviewMode(true)}
                className={cn("flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition",
                  previewMode ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                <Eye className="h-3 w-3" /> Preview
              </button>
              <button
                onClick={() => setPreviewMode(false)}
                className={cn("flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition",
                  !previewMode ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                <Edit3 className="h-3 w-3" /> Soạn
              </button>
            </div>

            {previewMode && (
              <div className="flex rounded-lg border p-0.5">
                {([["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone]] as const).map(([vp, Icon]) => (
                  <button
                    key={vp}
                    onClick={() => setViewport(vp)}
                    aria-label={`Xem ở ${vp}`}
                    className={cn(
                      "flex items-center rounded-md px-2 py-1 transition",
                      viewport === vp ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            )}

            {!previewMode && (
              <Button
                variant="outline" size="sm"
                className={cn("h-8 gap-1.5 text-xs", insertStoryboardOpen && "border-primary text-primary")}
                onClick={() => (insertStoryboardOpen ? closeInsertStoryboard() : openInsertStoryboard())}
                title="Chèn dàn ý có sẵn vào khoá hoặc bài"
              >
                <LayoutList className="h-3.5 w-3.5" /> Chèn storyboard
              </Button>
            )}

            <Button size="sm" className="h-8 bg-primary text-xs text-primary-foreground hover:bg-primary-hover" onClick={() => setPublishOpen(true)}>
              Xuất bản khoá
            </Button>

            {!previewMode && (
              <Button
                variant="ghost" size="icon"
                className={cn("h-8 w-8", showRightPanel && !insertStoryboardOpen && "text-primary")}
                aria-label={showRightPanel && !insertStoryboardOpen ? "Ẩn trợ lý AI" : "Hiện trợ lý AI"}
                onClick={() => {
                  if (insertStoryboardOpen) { closeInsertStoryboard(); setShowRightPanel(true); }
                  else setShowRightPanel((v) => !v);
                }}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* ─── Body ───────────────────────────────────────────────── */}
        <div className="flex min-h-0 flex-1">
          {/* Left: structure tree */}
          <AnimatePresence initial={false}>
            {showLeftPanel && !previewMode && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 268, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 34 }}
                className="hidden shrink-0 overflow-hidden md:block"
              >
                <div className="flex h-full w-[268px] flex-col">
                  <CourseThemePicker courseId={id} scope={scope} />
                  <div className="min-h-0 flex-1 overflow-hidden">
                    <LessonTree
                      courseId={id}
                      activeLessonId={activeLessonId}
                      onSelectLesson={setActiveLesson}
                      getPublishState={getPublishState}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Center: canvas */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Thanh ngữ cảnh bài — trạng thái + xuất bản bài (chế độ Soạn) */}
            {!previewMode && activeLesson && (
              <div className="flex h-11 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
                <span className="truncate text-sm font-semibold text-foreground">{activeLesson.title}</span>
                <LessonStatusChip state={activeLessonPublishState} />
                {showPublishLessonBtn && activeLessonId && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-auto h-7 border-warning text-xs text-warning-700 hover:bg-warning-50"
                    onClick={() => publishLesson(id, activeLessonId)}
                    title="Xuất bản nội dung hiện tại của bài này"
                  >
                    {activeLessonPublishState === "never" ? "Xuất bản bài này" : "Xuất bản thay đổi"}
                  </Button>
                )}
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {activeLesson ? (
                <PageCanvas
                  blocks={activeBlocks}
                  activeBlockId={activeBlockId}
                  onSelectBlock={setActiveBlockId}
                  onAddBlock={handleAddBlock}
                  onUpdateBlock={(blockId, patch) => updateBlock(id, activeLessonId!, blockId, patch)}
                  onDeleteBlock={(blockId) => deleteBlock(id, activeLessonId!, blockId)}
                  onDuplicateBlock={handleDuplicateBlock}
                  onMoveBlock={handleMoveBlock}
                  lessonTitle={activeLesson.title}
                  previewMode={previewMode}
                  dropIndex={dropIndex}
                  viewport={viewport}
                  courseId={id}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <LayoutList className="mx-auto h-12 w-12 text-muted-foreground/20" />
                    <p className="mt-3 text-sm font-medium text-muted-foreground">Chọn một bài học để bắt đầu soạn</p>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      Mở cấu trúc bên trái hoặc thêm bài học mới
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: trợ lý AI HOẶC panel Chèn storyboard — dùng chung một khe, mở một trong hai */}
          <AnimatePresence initial={false}>
            {(showRightPanel || insertStoryboardOpen) && !previewMode && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 420, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 34 }}
                className="hidden shrink-0 overflow-hidden border-l border-border lg:block"
              >
                <div className="h-full w-[420px]">
                  {insertStoryboardOpen ? (
                    <InsertStoryboardPanel courseId={id} scope={scope} />
                  ) : (
                    <AiAssistantPanel
                      courseId={id}
                      lessonId={activeLessonId ?? undefined}
                      scope={scope}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeDragId && activeDragType && (() => {
          const meta = BLOCK_TYPES.find((b) => b.type === activeDragType);
          return meta ? (
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 350, damping: 22 }}
              className="rounded-md border bg-card px-3 py-2 text-xs font-medium shadow-lg"
              style={{ borderColor: meta.color, color: meta.color }}>
              + {meta.label}
            </motion.div>
          ) : null;
        })()}
        {activeDragId && activeDragMaterial && (
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
            className="max-w-[220px] truncate rounded-md border border-success bg-card px-3 py-2 text-xs font-medium text-success shadow-lg">
            {activeDragMaterial.title}
          </motion.div>
        )}
        {activeDragId && activeDragLabel && (
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
            className="flex max-w-[220px] items-center gap-1.5 truncate rounded-md border bg-card px-3 py-2 text-xs font-medium shadow-lg"
            style={{ borderColor: activeDragLabel.color, color: activeDragLabel.color }}>
            <span className="truncate">{activeDragLabel.label}</span>
          </motion.div>
        )}
      </DragOverlay>

      <PublishSheet open={publishOpen} onOpenChange={setPublishOpen} contentId={id} title={title}
        onPublished={() => navigate({ to: backTo })} />
    </DndContext>
  );
}

/* ─── Chip trạng thái xuất bản của bài ──────────────────────────── */

function LessonStatusChip({ state }: { state: "never" | "published" | "dirty" }) {
  const map = {
    never: { label: "Bản nháp", cls: "bg-muted text-muted-foreground", dot: "bg-muted-foreground/50" },
    dirty: { label: "Có thay đổi chưa xuất bản", cls: "bg-warning-50 text-warning-700", dot: "bg-warning-500" },
    published: { label: "Đã xuất bản", cls: "bg-success-50 text-success", dot: "bg-success" },
  } as const;
  const m = map[state];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium", m.cls)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}
