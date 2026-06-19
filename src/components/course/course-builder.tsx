import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCenter, pointerWithin, rectIntersection, MeasuringStrategy,
  type DragEndEvent, type DragStartEvent, type DragOverEvent, type CollisionDetection,
} from "@dnd-kit/core";
import { motion } from "framer-motion";
import {
  ArrowLeft, Eye, Pencil,
  PanelLeftClose, PanelLeft, PanelRightClose, PanelRight,
  FolderTree, Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoursePalette, BLOCK_TYPES } from "./course-palette";
import { PageCanvas } from "./page-canvas";
import { LessonStrip } from "./lesson-strip";
import { StructureDrawer } from "./structure-drawer";
import { CourseAiPanel } from "./course-ai-panel";
import { PublishSheet } from "@/components/publish-sheet";
import { toast } from "sonner";
import { useCourse } from "@/stores/course";
import type { CourseBlockType } from "@/stores/course";
import { useContent } from "@/stores/content";
import type { ContentItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export type CourseBuilderBackTo = "/creator/dashboard" | "/org/dashboard";

export function CourseBuilder({ courseId: id, backTo }: { courseId: string; backTo: CourseBuilderBackTo }) {
  const navigate = useNavigate();
  const init = useCourse((s) => s.init);
  const courseData = useCourse((s) => s.courseData[id]);
  const activeLessonId = useCourse((s) => s.activeLessonId);
  const setActiveLesson = useCourse((s) => s.setActiveLesson);
  const addChapter = useCourse((s) => s.addChapter);
  const renameChapter = useCourse((s) => s.renameChapter);
  const deleteChapter = useCourse((s) => s.deleteChapter);
  const addLesson = useCourse((s) => s.addLesson);
  const renameLesson = useCourse((s) => s.renameLesson);
  const deleteLesson = useCourse((s) => s.deleteLesson);
  const reorderLessons = useCourse((s) => s.reorderLessons);
  const addBlock = useCourse((s) => s.addBlock);
  const updateBlock = useCourse((s) => s.updateBlock);
  const deleteBlock = useCourse((s) => s.deleteBlock);
  const duplicateBlock = useCourse((s) => s.duplicateBlock);
  const moveBlockToIndex = useCourse((s) => s.moveBlockToIndex);

  const item = useContent((s) => s.items.find((x) => x.id === id));
  const updateItem = useContent((s) => s.updateItem);

  const [title, setTitle] = useState(item?.title ?? "Khóa học chưa đặt tên");
  const [publishOpen, setPublishOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragType, setActiveDragType] = useState<CourseBlockType | null>(null);
  const [activeDragMaterial, setActiveDragMaterial] = useState<ContentItem | null>(null);
  const [activeDragLabel, setActiveDragLabel] = useState<{ kind: "block" | "lesson"; label: string; color: string } | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  // Panel visibility
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showBottomStrip, setShowBottomStrip] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => { init(id); }, [id, init]);
  useEffect(() => { if (item) setTitle(item.title); }, [item?.id]); // eslint-disable-line

  // Esc exits preview mode (spec §8: "Bấm Esc hoặc toggle lại quay về edit")
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  // Prefer collisions with individual block items; only fall back to the
  // whole-canvas droppable when the pointer is over empty space (e.g. an
  // empty lesson, or below the last block). Without this, the large
  // "canvas-drop" droppable wins every collision and drops land at the end.
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
    if (data?.source === "palette") {
      setActiveDragType((data.blockType as CourseBlockType) ?? null);
    } else if (data?.source === "material") {
      setActiveDragMaterial((data.item as ContentItem) ?? null);
    } else if (data?.source === "block") {
      const blk = activeBlocks.find((b) => b.id === String(e.active.id));
      const meta = blk ? BLOCK_TYPES.find((t) => t.type === blk.type) : undefined;
      if (meta) setActiveDragLabel({ kind: "block", label: meta.label, color: meta.color });
    } else if (data?.source === "strip") {
      const ls = lessons.find((l) => l.id === String(e.active.id));
      if (ls) setActiveDragLabel({ kind: "lesson", label: ls.title, color: "#2563EB" });
    }
  };

  // Compute the insertion index (0..blocks.length) the drop would land at,
  // given the block currently hovered. Returns null for non-canvas drags.
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
    if (src !== "palette" && src !== "material" && src !== "block") {
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

    if (data?.source === "palette" && data.blockType) {
      addBlock(id, activeLessonId, data.blockType as CourseBlockType, targetIndex ?? undefined);
      return;
    }
    if (data?.source === "material" && data.item) {
      const mat = data.item as ContentItem;
      const blockId = addBlock(id, activeLessonId, "embed", targetIndex ?? undefined);
      if (blockId) {
        updateBlock(id, activeLessonId, blockId, {
          embedMaterialId: mat.id, embedTitle: mat.title, embedType: mat.materialSubtype ?? "document",
        });
      }
      toast.success(`Đã embed "${mat.title}"`);
      return;
    }
    if (data?.source === "block") {
      const fromIndex = activeBlocks.findIndex((b) => b.id === String(active.id));
      if (fromIndex < 0 || targetIndex === null) return;
      // targetIndex is computed against the current array (dragged item still
      // present); after removal everything past it shifts down by one.
      const to = targetIndex > fromIndex ? targetIndex - 1 : targetIndex;
      if (to === fromIndex) return;
      moveBlockToIndex(id, activeLessonId, String(active.id), to);
      return;
    }
    if (data?.source === "strip" && over.id !== active.id && lessons.some((l) => l.id === String(over.id))) {
      reorderLessons(id, String(active.id), String(over.id));
      return;
    }
  };

  const handleAddBlock = useCallback((type: CourseBlockType, atIndex?: number) => {
    if (!activeLessonId) { toast.info("Hãy chọn bài học trước"); return; }
    addBlock(id, activeLessonId, type, atIndex);
  }, [id, activeLessonId, addBlock]);

  const handleAttachMaterial = useCallback((mat: ContentItem) => {
    if (!activeLessonId) { toast.info("Hãy chọn bài học trước"); return; }
    const blockId = addBlock(id, activeLessonId, "embed");
    if (blockId) {
      updateBlock(id, activeLessonId, blockId, {
        embedMaterialId: mat.id, embedTitle: mat.title, embedType: mat.materialSubtype ?? "document",
      });
    }
    toast.success(`Đã embed "${mat.title}"`);
  }, [id, activeLessonId, addBlock, updateBlock]);

  const handleDuplicateBlock = useCallback((blockId: string) => {
    if (!activeLessonId) return;
    duplicateBlock(id, activeLessonId, blockId);
  }, [id, activeLessonId, duplicateBlock]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex h-screen flex-col bg-[#f8f9fb]">
        {/* ─── Header (clean — no panel toggles) ────── */}
        <div className="z-20 flex h-12 shrink-0 items-center gap-2 border-b border-border bg-card px-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Quay lại" onClick={() => navigate({ to: backTo })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-[10px] font-bold text-white">C</div>
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={saveTitle}
              aria-label="Tiêu đề khóa học"
              className="min-w-0 flex-1 rounded bg-transparent px-1 py-1 text-sm font-semibold text-foreground outline-none hover:bg-muted/50 focus:bg-muted/50" />
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {/* Preview toggle */}
            <div className="flex rounded-lg border p-0.5">
              <button
                onClick={() => setPreviewMode(true)}
                className={cn("flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition",
                  previewMode ? "bg-[#2563EB] text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                <Eye className="h-3 w-3" /> Preview
              </button>
              <button
                onClick={() => setPreviewMode(false)}
                className={cn("flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition",
                  !previewMode ? "bg-[#2563EB] text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                <Edit3 className="h-3 w-3" /> Soạn
              </button>
            </div>
            <Button size="sm" className="h-8 bg-[#2563EB] text-xs text-white hover:bg-[#1d4ed8]" onClick={() => setPublishOpen(true)}>
              Xuất bản
            </Button>
          </div>
        </div>

        {/* ─── Body ───────────────────────────────────── */}
        <div className="flex min-h-0 flex-1">
          {/* Left: Palette + toggle */}
          {!previewMode && (
            <div className="relative hidden shrink-0 md:flex">
            {showLeftPanel && (
              <CoursePalette onAddBlock={handleAddBlock} onAttachMaterial={handleAttachMaterial} />
            )}
            {/* Toggle tab gắn vào cạnh phải của panel */}
            <button
              onClick={() => setShowLeftPanel(!showLeftPanel)}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 z-10 flex h-8 w-5 items-center justify-center rounded-r-md border border-l-0 border-border bg-card text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground",
                showLeftPanel ? "left-full" : "left-0",
              )}
              title={showLeftPanel ? "Ẩn palette" : "Hiện palette"}
            >
              {showLeftPanel ? <PanelLeftClose className="h-3 w-3" /> : <PanelLeft className="h-3 w-3" />}
            </button>
          </div>
          )}

          {/* Center: Canvas + Strip */}
          <div className="flex min-w-0 flex-1 flex-col">
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
                  lessonTitle={activeLesson.title}
                  previewMode={previewMode}
                  dropIndex={dropIndex}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <FolderTree className="mx-auto h-12 w-12 text-muted-foreground/20" />
                    <p className="mt-3 text-sm font-medium text-muted-foreground">Chọn bài học để bắt đầu soạn</p>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      Bấm <strong>"Cấu trúc"</strong> ở thanh dưới hoặc chọn bài trực tiếp
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom strip — only in edit mode */}
            {!previewMode && (
              <LessonStrip
              chapters={chapters}
              lessons={lessons}
              activeLessonId={activeLessonId}
              collapsed={!showBottomStrip}
              onToggleCollapse={() => setShowBottomStrip(!showBottomStrip)}
              onSelectLesson={setActiveLesson}
              onAddLesson={(chId) => addLesson(id, chId)}
              onAddChapter={() => addChapter(id)}
              onRenameChapter={(chId, t) => renameChapter(id, chId, t)}
              onRenameLesson={(lsId, t) => renameLesson(id, lsId, t)}
              onOpenStructure={() => setDrawerOpen(true)}
            />
            )}
          </div>

          {/* Right: AI Panel + toggle */}
          {!previewMode && (
            <div className="relative hidden shrink-0 lg:flex">
            {showRightPanel && (
              <div className="w-[280px] border-l border-border">
                <CourseAiPanel courseId={id} />
              </div>
            )}
            {/* Toggle tab gắn vào cạnh trái của panel */}
            <button
              onClick={() => setShowRightPanel(!showRightPanel)}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 z-10 flex h-8 w-5 items-center justify-center rounded-l-md border border-r-0 border-border bg-card text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground",
                showRightPanel ? "right-full" : "right-0",
              )}
              title={showRightPanel ? "Ẩn AI" : "Hiện AI"}
            >
              {showRightPanel ? <PanelRightClose className="h-3 w-3" /> : <PanelRight className="h-3 w-3" />}
            </button>
          </div>
          )}
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
            className="max-w-[220px] truncate rounded-md border border-[#10B981] bg-card px-3 py-2 text-xs font-medium text-[#10B981] shadow-lg">
            📎 {activeDragMaterial.title}
          </motion.div>
        )}
        {activeDragId && activeDragLabel && (
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
            className="flex max-w-[220px] items-center gap-1.5 truncate rounded-md border bg-card px-3 py-2 text-xs font-medium shadow-lg"
            style={{ borderColor: activeDragLabel.color, color: activeDragLabel.color }}>
            {activeDragLabel.kind === "lesson" ? "📖" : "⠿"} <span className="truncate">{activeDragLabel.label}</span>
          </motion.div>
        )}
      </DragOverlay>

      {/* Structure drawer */}
      <StructureDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        chapters={chapters}
        lessons={lessons}
        activeLessonId={activeLessonId}
        onSelectLesson={(lsId) => { setActiveLesson(lsId); setDrawerOpen(false); }}
        onAddChapter={() => addChapter(id)}
        onAddLesson={(chId) => addLesson(id, chId)}
        onRenameChapter={(chId, t) => renameChapter(id, chId, t)}
        onRenameLesson={(lsId, t) => renameLesson(id, lsId, t)}
        onDeleteChapter={(chId) => deleteChapter(id, chId)}
        onDeleteLesson={(lsId) => deleteLesson(id, lsId)}
      />

      <PublishSheet open={publishOpen} onOpenChange={setPublishOpen} contentId={id} title={title}
        onPublished={() => navigate({ to: backTo })} />
    </DndContext>
  );
}
