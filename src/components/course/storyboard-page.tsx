import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners, useDroppable,
  type DragEndEvent, type DragStartEvent, type DragOverEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, rectSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft, Plus, Trash2, Wand2, Loader2, GripVertical, ArrowRight, Sparkles,
  ChevronDown, ChevronUp, Library, BookOpen, BookText, ListTree, X, ImagePlus, Copy, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { aiClient } from "@/lib/ai";
import { applyStoryboardAsLessonOutline } from "@/lib/storyboard/apply-storyboard";
import type { Storyboard, StoryboardItem, StoryboardSection } from "@/lib/ai/types";
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

const EMPTY_BOARD: Storyboard = { sections: [] };
const countFrames = (b?: Storyboard): number => b?.sections.reduce((n, s) => n + s.items.length, 0) ?? 0;
const newFrame = (n: number): StoryboardItem => ({
  id: makeId("frame"), blockType: "text", title: `Cảnh ${n}`, intent: "Mô tả nội dung cảnh này…", learningGoal: "", image: "explain",
});
const newSection = (n: number): StoryboardSection => ({ id: makeId("sec"), title: `Phần ${n}`, items: [] });

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

  const sections = board?.sections ?? [];
  const totalFrames = countFrames(board);
  const setBoard = (next: Storyboard) => {
    if (effectiveLessonId) setStoryboard(effectiveLessonId, next);
  };

  // Nạp dữ liệu mục đang sửa/xem vào slot làm việc (một lần) — GIỮ NGUYÊN sections.
  useEffect(() => {
    if (!libItem || !effectiveLessonId) return;
    if (useStoryboard.getState().byLesson[effectiveLessonId]) return;
    setStoryboard(effectiveLessonId, libItem.storyboard);
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
      setBoard(sb); // giữ nhiều phần
      toast.success("Đã dựng storyboard — bạn chỉnh lại từng phần/khung nếu cần nhé.");
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
    if (countFrames(useStoryboard.getState().byLesson[courseId]) > 0) return;
    (async () => {
      setGenerating(true);
      try {
        const sb = await aiClient.generateStoryboard({ subject, grade, topic: subject || "Bài học mẫu" });
        setBoard(sb);
      } catch {
        toast.error("Chưa dựng được bản mẫu, bạn thử lại nhé.");
      } finally {
        setGenerating(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Áp dụng vào bài (chỉ course mode) — mỗi phần thành khối mục ── */
  const handleApply = async () => {
    if (!totalFrames || !effectiveLessonId || applying || !board) return;
    setApplying(true);
    try {
      await applyStoryboardAsLessonOutline(board, [effectiveLessonId], {
        addBlock: (lid, type) => useCourse.getState().addBlock(courseId, lid, type),
        updateBlock: (lid, bid, patch) => useCourse.getState().updateBlock(courseId, lid, bid, patch),
        fillBlock: (it) => aiClient.fillBlock({ item: it, subject, grade, topic: topic.trim() || activeLesson?.title || subject }),
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

  /* ─── Lưu vào kho / cập nhật / nhân bản — GIỮ NGUYÊN sections ────── */
  const handleSave = () => {
    if (!totalFrames || !board) {
      toast.error("Storyboard đang trống — tạo vài khung trước đã nhé.");
      return;
    }
    const name = topic.trim() || libItem?.name || "Storyboard chưa đặt tên";
    if (pageMode === "edit") {
      updateLibrary(courseId, { name, subject, storyboard: board });
      toast.success("Đã lưu thay đổi vào kho");
    } else {
      addToLibrary({ name, subject, storyboard: board });
      toast.success(`Đã lưu "${name}" vào kho storyboard`);
    }
  };

  const handleDuplicate = () => {
    const name = `${libItem?.name ?? topic.trim() ?? "Storyboard"} (bản sao)`;
    const id = addToLibrary({ name, subject, storyboard: board ?? EMPTY_BOARD });
    toast.success("Đã tạo bản sao — bạn chỉnh thoải mái nhé.");
    navigate({ to: storyboardRoutePattern(scope), params: { id } });
  };

  /* ─── Section CRUD ──────────────────────────────────────────────── */
  const addSection = () => setBoard({ sections: [...sections, newSection(sections.length + 1)] });
  const renameSection = (sid: string, title: string) =>
    setBoard({ sections: sections.map((s) => (s.id === sid ? { ...s, title } : s)) });
  const deleteSection = (sid: string) =>
    setBoard({ sections: sections.filter((s) => s.id !== sid) });
  const moveSection = (sid: string, dir: "up" | "down") => {
    const idx = sections.findIndex((s) => s.id === sid);
    const to = dir === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || to < 0 || to >= sections.length) return;
    setBoard({ sections: arrayMove(sections, idx, to) });
  };

  /* ─── Frame CRUD (theo section) ─────────────────────────────────── */
  const addFrame = (sid: string) =>
    setBoard({
      sections: sections.map((s) =>
        s.id === sid ? { ...s, items: [...s.items, newFrame(s.items.length + 1)] } : s,
      ),
    });
  const updateFrame = (sid: string, fid: string, patch: Partial<StoryboardItem>) =>
    setBoard({
      sections: sections.map((s) =>
        s.id === sid ? { ...s, items: s.items.map((f) => (f.id === fid ? { ...f, ...patch } : f)) } : s,
      ),
    });
  const deleteFrame = (sid: string, fid: string) =>
    setBoard({
      sections: sections.map((s) => (s.id === sid ? { ...s, items: s.items.filter((f) => f.id !== fid) } : s)),
    });

  /* ─── Kéo-thả khung (trong phần & giữa các phần) ────────────────── */
  const containerOf = (id: string): string | undefined => {
    if (sections.some((s) => s.id === id)) return id; // id là section
    return sections.find((s) => s.items.some((f) => f.id === id))?.id;
  };

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const onDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const from = containerOf(activeId);
    const to = containerOf(overId);
    if (!from || !to || from === to) return;
    // Chuyển khung sang phần khác ngay khi hover.
    const fromSec = sections.find((s) => s.id === from)!;
    const toSec = sections.find((s) => s.id === to)!;
    const item = fromSec.items.find((f) => f.id === activeId);
    if (!item) return;
    const overIdx = toSec.items.findIndex((f) => f.id === overId);
    const insertAt = overIdx >= 0 ? overIdx : toSec.items.length;
    setBoard({
      sections: sections.map((s) => {
        if (s.id === from) return { ...s, items: s.items.filter((f) => f.id !== activeId) };
        if (s.id === to) return { ...s, items: [...s.items.slice(0, insertAt), item, ...s.items.slice(insertAt)] };
        return s;
      }),
    });
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const from = containerOf(activeId);
    const to = containerOf(overId);
    if (!from || !to || from !== to) return; // chuyển giữa phần đã xử lý ở onDragOver
    const sec = sections.find((s) => s.id === from)!;
    const oldIdx = sec.items.findIndex((f) => f.id === activeId);
    const newIdx = overId === sec.id ? sec.items.length - 1 : sec.items.findIndex((f) => f.id === overId);
    if (oldIdx < 0 || newIdx < 0 || oldIdx === newIdx) return;
    setBoard({ sections: sections.map((s) => (s.id === from ? { ...s, items: arrayMove(s.items, oldIdx, newIdx) } : s)) });
  };

  const activeFrame = sections.flatMap((s) => s.items).find((f) => f.id === activeId);
  const readOnly = pageMode === "view";

  const headerTitle =
    pageMode === "new" ? "Trình tạo Storyboard"
    : pageMode === "edit" ? "Chỉnh sửa storyboard"
    : pageMode === "view" ? "Xem storyboard mẫu"
    : "Storyboard bài học";
  const headerSub =
    moduleMode ? (pageMode === "view" ? "Mẫu có sẵn — nhân bản để chỉnh theo ý bạn" : "Lưu vào thư viện để dùng cho nhiều bài")
    : (contentItem?.title ?? "Khoá học");

  // Số thứ tự khung liên tục qua các phần.
  let frameCounter = 0;

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
            {sections.length} mục · {totalFrames} khung
          </span>
          {readOnly ? (
            <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary-hover" onClick={handleDuplicate} disabled={!totalFrames}>
              <Copy className="h-4 w-4" /> Nhân bản để chỉnh sửa
            </Button>
          ) : (
            <Button
              variant={moduleMode ? "default" : "outline"}
              size="sm"
              className={cn("gap-2", moduleMode && "bg-primary text-primary-foreground hover:bg-primary-hover")}
              disabled={!totalFrames}
              onClick={handleSave}
            >
              <Library className="h-4 w-4" /> {pageMode === "edit" ? "Lưu thay đổi" : "Lưu vào kho"}
            </Button>
          )}
          {!moduleMode && (
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary-hover" size="sm" disabled={!totalFrames || applying} onClick={handleApply}>
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
              <Textarea value={sourceText} onChange={(e) => setSourceText(e.target.value)} placeholder="Vd: chia 5 phần theo 5E, mỗi phần vài khung, giọng gần gũi, có ví dụ thực tế…" className="mt-1.5 min-h-[80px] text-xs" />
            </details>

            <Button className="mt-auto w-full gap-2 bg-primary text-primary-foreground hover:bg-primary-hover" disabled={generating || !effectiveLessonId} onClick={handleGenerate}>
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {totalFrames ? "Tạo lại storyboard" : "Tạo storyboard"}
            </Button>
          </aside>
        )}

        {/* Main: sections + scene grid */}
        <main className="min-h-0 flex-1 overflow-auto p-5">
          {sections.length === 0 ? (
            <EmptyBoard generating={generating} onGenerate={handleGenerate} onAddSection={addSection} readOnly={readOnly} />
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
              <div className="space-y-4">
                {sections.map((section, si) => {
                  const start = frameCounter;
                  frameCounter += section.items.length;
                  return (
                    <SectionColumn
                      key={section.id}
                      section={section}
                      index={si}
                      total={sections.length}
                      frameStart={start}
                      readOnly={readOnly}
                      reduceMotion={!!reduceMotion}
                      onRename={(t) => renameSection(section.id, t)}
                      onDelete={() => deleteSection(section.id)}
                      onMove={(d) => moveSection(section.id, d)}
                      onAddFrame={() => addFrame(section.id)}
                      onUpdateFrame={(fid, p) => updateFrame(section.id, fid, p)}
                      onDeleteFrame={(fid) => deleteFrame(section.id, fid)}
                    />
                  );
                })}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={addSection}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition hover:border-primary hover:bg-accent/40 hover:text-primary"
                  >
                    <Plus className="h-4 w-4" /> Thêm phần
                  </button>
                )}
              </div>
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

function EmptyBoard({
  generating, onGenerate, onAddSection, readOnly,
}: {
  generating: boolean;
  onGenerate: () => void;
  onAddSection: () => void;
  readOnly: boolean;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-primary">
        <Wand2 className="h-8 w-8" />
      </div>
      <p className="mt-4 text-base font-semibold text-foreground">Bắt đầu một storyboard</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Nhập chủ đề bên trái rồi bấm <span className="font-medium text-foreground">Tạo storyboard</span> — AI sẽ phác các phần kèm khung cảnh có ảnh sẵn.
      </p>
      {!readOnly && (
        <div className="mt-4 flex items-center gap-2">
          <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary-hover" disabled={generating} onClick={onGenerate}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            Tạo storyboard
          </Button>
          <Button variant="outline" className="gap-2" onClick={onAddSection}>
            <Plus className="h-4 w-4" /> Thêm phần thủ công
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Phần (section) — vùng thả kéo-thả khung ───────────────────── */

function SectionColumn({
  section, index, total, frameStart, readOnly, reduceMotion,
  onRename, onDelete, onMove, onAddFrame, onUpdateFrame, onDeleteFrame,
}: {
  section: StoryboardSection;
  index: number;
  total: number;
  frameStart: number;
  readOnly: boolean;
  reduceMotion: boolean;
  onRename: (title: string) => void;
  onDelete: () => void;
  onMove: (dir: "up" | "down") => void;
  onAddFrame: () => void;
  onUpdateFrame: (frameId: string, patch: Partial<StoryboardItem>) => void;
  onDeleteFrame: (frameId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: section.id });
  return (
    <div className="rounded-xl border border-border bg-card/50 p-3">
      {/* Tiêu đề phần + điều khiển */}
      <div className="mb-2.5 flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-50 text-[11px] font-bold text-primary">{index + 1}</span>
        {readOnly ? (
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{section.title}</p>
        ) : (
          <input
            value={section.title}
            onChange={(e) => onRename(e.target.value)}
            placeholder="Tên phần"
            aria-label="Tên phần"
            className="min-w-0 flex-1 rounded bg-transparent px-1 py-0.5 text-sm font-semibold text-foreground outline-none hover:bg-muted/50 focus:bg-muted/50"
          />
        )}
        <span className="shrink-0 text-[11px] text-muted-foreground">{section.items.length} khung</span>
        {!readOnly && (
          <div className="flex shrink-0 items-center gap-0.5">
            <button type="button" onClick={() => onMove("up")} disabled={index === 0} className="rounded p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-30" aria-label="Chuyển phần lên"><ChevronUp className="h-4 w-4" /></button>
            <button type="button" onClick={() => onMove("down")} disabled={index === total - 1} className="rounded p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-30" aria-label="Chuyển phần xuống"><ChevronDown className="h-4 w-4" /></button>
            <button type="button" onClick={onDelete} className="rounded p-1 text-muted-foreground transition hover:text-destructive" aria-label="Xoá phần"><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      </div>

      {/* Lưới khung — vùng thả */}
      <div ref={setNodeRef} className={cn("rounded-lg transition", isOver && "ring-2 ring-primary/40")}>
        <SortableContext items={section.items.map((f) => f.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {section.items.map((frame, i) => (
              <motion.div
                key={frame.id}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.24, ease: "easeOut" }}
              >
                <SortableScene
                  frame={frame}
                  index={frameStart + i}
                  readOnly={readOnly}
                  onUpdate={(p) => onUpdateFrame(frame.id, p)}
                  onDelete={() => onDeleteFrame(frame.id)}
                />
              </motion.div>
            ))}
            {!readOnly ? (
              <button
                type="button"
                onClick={onAddFrame}
                className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground transition hover:border-primary hover:bg-accent/40 hover:text-primary"
              >
                <Plus className="h-6 w-6" /> Thêm khung cảnh
              </button>
            ) : (
              section.items.length === 0 && (
                <p className="col-span-full py-6 text-center text-xs text-muted-foreground">Phần này chưa có khung.</p>
              )
            )}
          </div>
        </SortableContext>
      </div>
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
