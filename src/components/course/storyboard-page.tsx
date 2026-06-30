import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, rectSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft, Plus, Trash2, Wand2, Loader2, GripVertical, ArrowRight, Sparkles,
  ChevronDown, Library, BookOpen, BookText, ListTree, X, ImagePlus, Copy, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { aiClient } from "@/lib/ai";
import { fillStoryboard } from "@/lib/ai/fill-orchestrator";
import type { Storyboard, StoryboardItem } from "@/lib/ai/types";
import { useCourse } from "@/stores/course";
import { useContent } from "@/stores/content";
import { useStoryboard } from "@/stores/storyboard";
import {
  useStoryboardLibrary, allStoryboardItems, type StoryboardLibraryItem,
} from "@/stores/storyboard-library";
import { allTopics } from "@/lib/registry/topics";
import { sceneSrc, SCENE_KEYS, SCENE_LABELS, type SceneKey } from "@/lib/storyboard/scene-art";
import { courseBuilderRoutePattern, storyboardRoutePattern, isSeededModuleId, type BuilderScope } from "@/lib/builder-url";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const makeId = (p: string) => `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

/* ─── Khung phẳng: storyboard lưu trong 1 section "Khung cảnh" ─────── */
const flatFrames = (b?: Storyboard): StoryboardItem[] => b?.sections.flatMap((s) => s.items) ?? [];
const boardFromFrames = (frames: StoryboardItem[]): Storyboard => ({
  sections: [{ id: "sec_main", title: "Khung cảnh", items: frames }],
});

interface StoryboardPageProps {
  courseId: string;
  scope: BuilderScope;
  /** Module độc lập (mở từ "Tạo mới"): không gắn khoá học. */
  standalone?: boolean;
}

type Reference = { id: string; title: string; label: string; detail: string };

export function StoryboardPage({ courseId, scope, standalone = false }: StoryboardPageProps) {
  const navigate = useNavigate();
  const init = useCourse((s) => s.init);
  const courseData = useCourse((s) => s.courseData[courseId]);
  const globalActiveLesson = useCourse((s) => s.activeLessonId);
  const contentItem = useContent((s) => s.items.find((x) => x.id === courseId));

  // Module CRUD: nếu id trỏ tới một mục trong kho → đang Sửa/Xem mục đó.
  const userItems = useStoryboardLibrary((s) => s.items);
  const addToLibrary = useStoryboardLibrary((s) => s.add);
  const updateLibrary = useStoryboardLibrary((s) => s.update);
  const libItem = useMemo<StoryboardLibraryItem | undefined>(
    () => allStoryboardItems(userItems).find((i) => i.id === courseId),
    [userItems, courseId],
  );

  // Chế độ trang: new (tạo mới) · edit (sửa của tôi) · view (xem preset) · course.
  const pageMode: "new" | "edit" | "view" | "course" =
    standalone ? "new" : libItem ? (libItem.source === "system" ? "view" : "edit") : "course";
  const moduleMode = pageMode !== "course"; // không gắn khoá học

  useEffect(() => { if (!moduleMode) init(courseId); }, [courseId, init, moduleMode]);

  const lessons = moduleMode ? [] : (courseData?.lessons ?? []);
  const [lessonId, setLessonId] = useState<string>(globalActiveLesson ?? lessons[0]?.id ?? "");
  const activeLesson = lessons.find((l) => l.id === lessonId) ?? lessons[0];
  const effectiveLessonId = moduleMode ? courseId : (activeLesson?.id ?? "");

  const board = useStoryboard((s) => (effectiveLessonId ? s.byLesson[effectiveLessonId] : undefined));
  const setStoryboard = useStoryboard((s) => s.setStoryboard);

  const [topic, setTopic] = useState(libItem?.name ?? "");
  const [objectives, setObjectives] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [refs, setRefs] = useState<Reference[]>([]);
  const [refPickerOpen, setRefPickerOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const subject = contentItem?.subject ?? libItem?.subject ?? "";
  const grade = contentItem?.grade ?? "";

  const frames = flatFrames(board);
  const setFrames = (next: StoryboardItem[]) => {
    if (effectiveLessonId) setStoryboard(effectiveLessonId, boardFromFrames(next));
  };

  // Nạp dữ liệu mục đang sửa/xem vào slot làm việc (một lần).
  useEffect(() => {
    if (!libItem || !effectiveLessonId) return;
    if (useStoryboard.getState().byLesson[effectiveLessonId]) return;
    setStoryboard(effectiveLessonId, boardFromFrames(flatFrames(libItem.storyboard)));
    setTopic(libItem.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libItem?.id, effectiveLessonId]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const reduceMotion = useReducedMotion();

  /* ─── AI generate ───────────────────────────────────────────────── */
  const handleGenerate = async () => {
    if (!effectiveLessonId || generating) return;
    setGenerating(true);
    try {
      const refLine = refs.length
        ? `Tài liệu tham chiếu: ${refs.map((r) => r.title).join("; ")}.`
        : "";
      const src = [sourceText.trim(), refLine].filter(Boolean).join("\n");
      const sb = await aiClient.generateStoryboard({
        subject, grade,
        topic: topic.trim() || activeLesson?.title || subject || "Chủ đề bài học",
        objectives: objectives.trim() || undefined,
        sourceText: src || undefined,
      });
      setFrames(flatFrames(sb));
      toast.success("Đã dựng storyboard — bạn chỉnh lại từng khung nếu cần nhé.");
    } catch {
      toast.error("Chưa dựng được storyboard, bạn thử lại nhé.");
    } finally {
      setGenerating(false);
    }
  };

  // Bản nháp mẫu (id `mods_…`): seed sẵn vài khung một lần khi mở.
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current || pageMode !== "new" || !isSeededModuleId(courseId)) return;
    seededRef.current = true;
    if (flatFrames(useStoryboard.getState().byLesson[courseId]).length) return;
    (async () => {
      setGenerating(true);
      try {
        const sb = await aiClient.generateStoryboard({ subject, grade, topic: subject || "Bài học mẫu" });
        setFrames(flatFrames(sb));
      } catch {
        toast.error("Chưa dựng được bản mẫu, bạn thử lại nhé.");
      } finally {
        setGenerating(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Áp dụng vào bài (chỉ course mode) ─────────────────────────── */
  const handleApply = async () => {
    if (!frames.length || !effectiveLessonId || applying) return;
    setApplying(true);
    try {
      await fillStoryboard({
        storyboard: boardFromFrames(frames),
        meta: { subject, grade, topic: topic.trim() || activeLesson?.title || subject },
        addBlock: (type) => useCourse.getState().addBlock(courseId, effectiveLessonId, type),
        updateBlock: (id, patch) => useCourse.getState().updateBlock(courseId, effectiveLessonId, id, patch),
      });
      useCourse.getState().setActiveLesson(effectiveLessonId);
      toast.success("Đã áp storyboard vào bài học");
      navigate({ to: courseBuilderRoutePattern(scope), params: { id: courseId } });
    } catch {
      toast.error("Có lỗi khi áp storyboard.");
    } finally {
      setApplying(false);
    }
  };

  /* ─── Lưu vào kho / cập nhật / nhân bản ─────────────────────────── */
  const handleSave = () => {
    if (!frames.length) {
      toast.error("Storyboard đang trống — tạo vài khung trước đã nhé.");
      return;
    }
    const name = topic.trim() || libItem?.name || "Storyboard chưa đặt tên";
    const storyboard = boardFromFrames(frames);
    if (pageMode === "edit") {
      updateLibrary(courseId, { name, subject, storyboard });
      toast.success("Đã lưu thay đổi vào kho");
    } else {
      addToLibrary({ name, subject, storyboard });
      toast.success(`Đã lưu "${name}" vào kho storyboard`);
    }
  };

  const handleDuplicate = () => {
    const name = `${libItem?.name ?? topic.trim() ?? "Storyboard"} (bản sao)`;
    const id = addToLibrary({ name, subject, storyboard: boardFromFrames(frames) });
    toast.success("Đã tạo bản sao — bạn chỉnh thoải mái nhé.");
    navigate({ to: storyboardRoutePattern(scope), params: { id } });
  };

  /* ─── Frame mutations ───────────────────────────────────────────── */
  const addFrame = () => {
    setFrames([
      ...frames,
      { id: makeId("frame"), blockType: "text", title: `Cảnh ${frames.length + 1}`, intent: "Mô tả nội dung cảnh này…", learningGoal: "", image: "explain" },
    ]);
  };
  const updateFrame = (id: string, patch: Partial<StoryboardItem>) =>
    setFrames(frames.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const deleteFrame = (id: string) => setFrames(frames.filter((f) => f.id !== id));

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = frames.findIndex((f) => f.id === active.id);
    const newIdx = frames.findIndex((f) => f.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    setFrames(arrayMove(frames, oldIdx, newIdx));
  };

  const activeFrame = frames.find((f) => f.id === activeId);
  const readOnly = pageMode === "view";

  const headerTitle =
    pageMode === "new" ? "Trình tạo Storyboard"
    : pageMode === "edit" ? "Chỉnh sửa storyboard"
    : pageMode === "view" ? "Xem storyboard mẫu"
    : "Storyboard bài học";
  const headerSub =
    moduleMode ? (pageMode === "view" ? "Mẫu hệ thống · nhân bản để chỉnh sửa" : "Module độc lập · lưu vào kho để dùng lại")
    : (contentItem?.title ?? "Khoá học");

  return (
    <div className="flex h-screen flex-col bg-muted/30">
      {/* Header */}
      <header className="z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
        <Button variant="ghost" size="icon" className="h-8 w-8"
          aria-label={moduleMode ? "Quay lại Thư viện" : "Quay lại bài"}
          onClick={() =>
            moduleMode
              ? navigate({ to: scope === "org" ? "/org/library" : "/creator/library" })
              : navigate({ to: courseBuilderRoutePattern(scope), params: { id: courseId } })
          }>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{headerTitle}</p>
          <p className="truncate text-[11px] text-muted-foreground">{headerSub}</p>
        </div>

        {lessons.length > 0 && (
          <div className="relative">
            <select
              value={effectiveLessonId}
              onChange={(e) => setLessonId(e.target.value)}
              className="h-8 appearance-none rounded-lg border border-border bg-card pl-3 pr-7 text-xs font-medium text-foreground outline-none focus:border-primary"
              aria-label="Chọn bài học"
            >
              {lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground sm:inline">
            {frames.length} khung
          </span>
          {readOnly ? (
            <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary-hover" onClick={handleDuplicate} disabled={!frames.length}>
              <Copy className="h-4 w-4" /> Nhân bản để chỉnh sửa
            </Button>
          ) : (
            <Button
              variant={moduleMode ? "default" : "outline"}
              size="sm"
              className={cn("gap-2", moduleMode && "bg-primary text-primary-foreground hover:bg-primary-hover")}
              disabled={!frames.length}
              onClick={handleSave}
            >
              <Library className="h-4 w-4" /> {pageMode === "edit" ? "Lưu thay đổi" : "Lưu vào kho"}
            </Button>
          )}
          {!moduleMode && (
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary-hover" size="sm" disabled={!frames.length || applying} onClick={handleApply}>
              {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Áp dụng vào bài
            </Button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Left: intake + references */}
        {!readOnly && (
          <aside className="hidden w-[300px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-border bg-card p-4 lg:flex">
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">Chủ đề</label>
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={activeLesson?.title || "Vd: Tốc độ phản ứng…"} className="h-9 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">Mục tiêu <span className="font-normal text-muted-foreground">(tuỳ chọn)</span></label>
              <Input value={objectives} onChange={(e) => setObjectives(e.target.value)} placeholder="Học sinh sẽ làm được gì?" className="h-9 text-sm" />
            </div>

            {/* Tài liệu tham chiếu */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Tài liệu tham chiếu</label>
                <button type="button" onClick={() => setRefPickerOpen(true)} className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
                  <Plus className="h-3 w-3" /> Thêm
                </button>
              </div>
              {refs.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-2.5 py-2 text-[11px] text-muted-foreground">
                  Thêm sách, học liệu hoặc chủ đề để AI bám theo khi dựng khung.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {refs.map((r) => (
                    <div key={r.id} className="flex items-start gap-2 rounded-lg border border-border bg-card p-2">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-50 text-primary">
                        {r.label === "Chủ đề" ? <ListTree className="h-3.5 w-3.5" /> : r.label === "Sách" ? <BookText className="h-3.5 w-3.5" /> : <BookOpen className="h-3.5 w-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-medium text-foreground">{r.title}</span>
                        <span className="block truncate text-[10px] text-muted-foreground">{r.label} · {r.detail}</span>
                      </span>
                      <button type="button" onClick={() => setRefs((cur) => cur.filter((x) => x.id !== r.id))} aria-label="Bỏ tham chiếu" className="text-muted-foreground transition hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <details>
              <summary className="cursor-pointer text-xs font-semibold text-foreground">Hướng dẫn AI nên làm thế nào <span className="font-normal text-muted-foreground">(tuỳ chọn)</span></summary>
              <Textarea value={sourceText} onChange={(e) => setSourceText(e.target.value)} placeholder="Vd: chia 6 cảnh, mỗi cảnh một ý chính, giọng gần gũi, có ví dụ thực tế…" className="mt-1.5 min-h-[80px] text-xs" />
            </details>

            <Button className="mt-auto w-full gap-2 bg-primary text-primary-foreground hover:bg-primary-hover" disabled={generating || !effectiveLessonId} onClick={handleGenerate}>
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {frames.length ? "Tạo lại storyboard" : "Tạo storyboard"}
            </Button>
          </aside>
        )}

        {/* Main: scene grid */}
        <main className="min-h-0 flex-1 overflow-auto p-5">
          {frames.length === 0 ? (
            <EmptyBoard generating={generating} onGenerate={handleGenerate} />
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
              <SortableContext items={frames.map((f) => f.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {frames.map((frame, i) => (
                    <motion.div
                      key={frame.id}
                      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.28, ease: "easeOut" }}
                    >
                      <SortableScene
                        frame={frame}
                        index={i}
                        readOnly={readOnly}
                        onUpdate={(p) => updateFrame(frame.id, p)}
                        onDelete={() => deleteFrame(frame.id)}
                      />
                    </motion.div>
                  ))}
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={addFrame}
                      className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground transition hover:border-primary hover:bg-accent/40 hover:text-primary"
                    >
                      <Plus className="h-6 w-6" /> Thêm khung cảnh
                    </button>
                  )}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeFrame && (
                  <div className="w-[260px] overflow-hidden rounded-xl border border-primary bg-card shadow-xl">
                    <div className="h-24 bg-cover bg-center" style={{ backgroundImage: `url("${sceneSrc(activeFrame.image)}")` }} />
                    <p className="truncate px-3 py-2 text-sm font-medium text-foreground">{activeFrame.title || activeFrame.intent}</p>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}
        </main>
      </div>

      <ReferencePicker open={refPickerOpen} onClose={() => setRefPickerOpen(false)} existing={refs} onPick={(r) => { setRefs((cur) => [...cur, r]); setRefPickerOpen(false); }} />
    </div>
  );
}

/* ─── Empty state ───────────────────────────────────────────────── */

function EmptyBoard({ generating, onGenerate }: { generating: boolean; onGenerate: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-primary">
        <Wand2 className="h-8 w-8" />
      </div>
      <p className="mt-4 text-base font-semibold text-foreground">Bắt đầu một storyboard</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Nhập chủ đề bên trái rồi bấm <span className="font-medium text-foreground">Tạo storyboard</span> — AI sẽ phác các khung cảnh kèm ảnh minh hoạ sẵn.
      </p>
      <Button className="mt-4 gap-2 bg-primary text-primary-foreground hover:bg-primary-hover" disabled={generating} onClick={onGenerate}>
        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
        Tạo storyboard
      </Button>
    </div>
  );
}

/* ─── Scene frame (sortable) ────────────────────────────────────── */

function SortableScene({
  frame, index, readOnly, onUpdate, onDelete,
}: {
  frame: StoryboardItem;
  index: number;
  readOnly: boolean;
  onUpdate: (p: Partial<StoryboardItem>) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: frame.id, disabled: readOnly });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const [imgOpen, setImgOpen] = useState(false);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        isDragging && "opacity-50",
      )}
    >
      {/* Ảnh cảnh */}
      <div className="relative h-32 bg-cover bg-center" style={{ backgroundImage: `url("${sceneSrc(frame.image)}")` }}>
        <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground shadow">
          {index + 1}
        </span>
        {!readOnly && (
          <span {...listeners} {...attributes} className="absolute right-2 top-2 cursor-grab rounded-md bg-card/85 p-1 text-muted-foreground opacity-0 transition hover:text-foreground group-hover:opacity-100 active:cursor-grabbing" aria-label="Kéo để sắp xếp">
            <GripVertical className="h-4 w-4" />
          </span>
        )}
        {!readOnly && (
          <div className="absolute bottom-2 right-2">
            <button type="button" onClick={() => setImgOpen((v) => !v)} className="flex items-center gap-1 rounded-md bg-card/85 px-2 py-1 text-[10px] font-medium text-foreground opacity-0 shadow-sm transition hover:bg-card group-hover:opacity-100">
              <ImagePlus className="h-3 w-3" /> Đổi ảnh
            </button>
            {imgOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setImgOpen(false)} />
                <div className="absolute bottom-full right-0 z-50 mb-1.5 grid w-[232px] grid-cols-3 gap-1.5 rounded-xl border border-border bg-card p-2 shadow-xl">
                  {SCENE_KEYS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => { onUpdate({ image: k }); setImgOpen(false); }}
                      className={cn("overflow-hidden rounded-md border bg-cover bg-center text-[0px]", frame.image === k ? "border-primary ring-2 ring-primary" : "border-border")}
                      style={{ backgroundImage: `url("${sceneSrc(k)}")`, height: 40 }}
                      title={SCENE_LABELS[k as SceneKey]}
                      aria-label={SCENE_LABELS[k as SceneKey]}
                    >
                      {SCENE_LABELS[k as SceneKey]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Nội dung cảnh */}
      <div className="space-y-1.5 p-3">
        <input
          value={frame.title ?? ""}
          onChange={(e) => onUpdate({ title: e.target.value })}
          readOnly={readOnly}
          placeholder="Tiêu đề cảnh"
          className="w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground/60"
          aria-label="Tiêu đề cảnh"
        />
        <textarea
          value={frame.intent}
          onChange={(e) => onUpdate({ intent: e.target.value })}
          readOnly={readOnly}
          rows={2}
          placeholder="Mô tả nội dung / lời dẫn của cảnh…"
          className="w-full resize-none bg-transparent text-xs text-muted-foreground outline-none placeholder:text-muted-foreground/60"
          aria-label="Mô tả cảnh"
        />
        <div className="flex items-center gap-1.5 pt-0.5">
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Ảnh + văn bản</span>
          {!readOnly && (
            <button type="button" onClick={onDelete} className="ml-auto rounded p-1 text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100" aria-label="Xoá khung">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Reference picker (sách / học liệu / chủ đề chung) ─────────── */

function ReferencePicker({
  open, onClose, existing, onPick,
}: {
  open: boolean;
  onClose: () => void;
  existing: Reference[];
  onPick: (r: Reference) => void;
}) {
  const items = useContent((s) => s.items);
  const [tab, setTab] = useState<"content" | "topic">("content");
  const [q, setQ] = useState("");
  const taken = (id: string) => existing.some((e) => e.id === id);
  const ql = q.trim().toLowerCase();

  const pickableContent = items
    .filter((it) => it.category === "book" || it.category === "learning_material")
    .filter((it) => !taken(it.id))
    .filter((it) => !ql || it.title.toLowerCase().includes(ql))
    .slice(0, 40);
  const pickableTopics = allTopics()
    .filter((tp) => !taken(tp.id))
    .filter((tp) => !ql || tp.path.toLowerCase().includes(ql))
    .slice(0, 40);

  const showContent = tab === "content";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm tài liệu tham chiếu</DialogTitle>
          <DialogDescription>Chọn sách/học liệu, hoặc một chủ đề trong Khung chung — AI sẽ bám theo khi dựng các khung cảnh.</DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {([["content", "Sách & học liệu"], ["topic", "Chủ đề chung"]] as const).map(([id, label]) => (
            <button key={id} type="button" onClick={() => setTab(id)}
              className={cn("relative px-3 py-2 text-xs font-semibold transition", tab === id ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
              {label}{tab === id && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={showContent ? "Tìm sách / học liệu…" : "Tìm chủ đề / chuyên đề…"} className="h-9 pl-8 text-sm" />
        </div>

        <div className="max-h-[300px] space-y-1.5 overflow-y-auto">
          {showContent ? (
            pickableContent.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Không tìm thấy mục phù hợp.</p>
            ) : (
              pickableContent.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => onPick({ id: it.id, title: it.title, label: it.category === "book" ? "Sách" : "Học liệu", detail: it.subject || "Chung" })}
                  className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-card p-2.5 text-left transition hover:border-primary hover:bg-accent"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-50 text-primary">
                    {it.category === "book" ? <BookText className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{it.title}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{it.category === "book" ? "Sách" : "Học liệu"}{it.subject ? ` · ${it.subject}` : ""}</span>
                  </span>
                  <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))
            )
          ) : (
            pickableTopics.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Không tìm thấy chủ đề phù hợp.</p>
            ) : (
              pickableTopics.map((tp) => (
                <button
                  key={tp.id}
                  type="button"
                  onClick={() => onPick({ id: tp.id, title: tp.name, label: "Chủ đề", detail: `${tp.subject} · ${tp.strand} · ${tp.grade}` })}
                  className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-card p-2.5 text-left transition hover:border-primary hover:bg-accent"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-50 text-primary">
                    <ListTree className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{tp.name}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{tp.subject} · {tp.strand} · {tp.grade}</span>
                  </span>
                  <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
