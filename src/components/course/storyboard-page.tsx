import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners,
  useDroppable, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft, Plus, Trash2, Wand2, Loader2, GripVertical, ArrowRight, Sparkles, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { aiClient } from "@/lib/ai";
import { fillStoryboard } from "@/lib/ai/fill-orchestrator";
import type { Storyboard, StoryboardItem } from "@/lib/ai/types";
import { useCourse, type CourseBlockType } from "@/stores/course";
import { useContent } from "@/stores/content";
import { useStoryboard } from "@/stores/storyboard";
import { BLOCK_TYPES } from "./course-palette";
import { courseBuilderRoutePattern, type BuilderScope } from "@/lib/builder-url";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const makeId = (p: string) => `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

interface StoryboardPageProps {
  courseId: string;
  scope: BuilderScope;
}

export function StoryboardPage({ courseId, scope }: StoryboardPageProps) {
  const navigate = useNavigate();
  const init = useCourse((s) => s.init);
  const courseData = useCourse((s) => s.courseData[courseId]);
  const globalActiveLesson = useCourse((s) => s.activeLessonId);
  const contentItem = useContent((s) => s.items.find((x) => x.id === courseId));

  useEffect(() => { init(courseId); }, [courseId, init]);

  const lessons = courseData?.lessons ?? [];
  const [lessonId, setLessonId] = useState<string>(globalActiveLesson ?? lessons[0]?.id ?? "");
  const activeLesson = lessons.find((l) => l.id === lessonId) ?? lessons[0];
  const effectiveLessonId = activeLesson?.id ?? "";

  const board = useStoryboard((s) => (effectiveLessonId ? s.byLesson[effectiveLessonId] : undefined));
  const setStoryboard = useStoryboard((s) => s.setStoryboard);

  const [topic, setTopic] = useState("");
  const [objectives, setObjectives] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const subject = contentItem?.subject ?? "";
  const grade = contentItem?.grade ?? "";

  const setBoard = (next: Storyboard) => {
    if (effectiveLessonId) setStoryboard(effectiveLessonId, next);
  };
  const cloneBoard = (b: Storyboard): Storyboard => ({
    sections: b.sections.map((s) => ({ ...s, items: s.items.map((i) => ({ ...i })) })),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  /* ─── AI generate ───────────────────────────────────────────── */
  const handleGenerate = async () => {
    if (!effectiveLessonId || generating) return;
    setGenerating(true);
    try {
      const sb = await aiClient.generateStoryboard({
        subject, grade,
        topic: topic.trim() || activeLesson?.title || subject || "Chủ đề bài học",
        objectives: objectives.trim() || undefined,
        sourceText: sourceText.trim() || undefined,
      });
      setBoard(sb);
    } catch {
      toast.error("Chưa tạo được dàn ý, bạn thử lại nhé.");
    } finally {
      setGenerating(false);
    }
  };

  /* ─── Apply onto the lesson ─────────────────────────────────── */
  const handleApply = async () => {
    if (!board || !effectiveLessonId || applying) return;
    setApplying(true);
    try {
      await fillStoryboard({
        storyboard: board,
        meta: { subject, grade, topic: topic.trim() || activeLesson?.title || subject },
        addBlock: (type) => useCourse.getState().addBlock(courseId, effectiveLessonId, type),
        updateBlock: (id, patch) => useCourse.getState().updateBlock(courseId, effectiveLessonId, id, patch),
      });
      useCourse.getState().setActiveLesson(effectiveLessonId);
      toast.success("Đã áp dàn ý vào bài học");
      navigate({ to: courseBuilderRoutePattern(scope), params: { id: courseId } });
    } catch {
      toast.error("Có lỗi khi áp dàn ý.");
    } finally {
      setApplying(false);
    }
  };

  /* ─── Board mutations ───────────────────────────────────────── */
  const addSection = () => {
    const base = board ?? { sections: [] };
    const next = cloneBoard(base);
    next.sections.push({ id: makeId("sec"), title: `Phần ${next.sections.length + 1}`, items: [] });
    setBoard(next);
  };
  const renameSection = (sid: string, title: string) => {
    if (!board) return;
    const next = cloneBoard(board);
    const sec = next.sections.find((s) => s.id === sid);
    if (sec) sec.title = title;
    setBoard(next);
  };
  const deleteSection = (sid: string) => {
    if (!board) return;
    setBoard({ sections: board.sections.filter((s) => s.id !== sid).map((s) => ({ ...s, items: s.items.map((i) => ({ ...i })) })) });
  };
  const addCard = (sid: string) => {
    if (!board) return;
    const next = cloneBoard(board);
    const sec = next.sections.find((s) => s.id === sid);
    if (sec) sec.items.push({ id: makeId("item"), blockType: "text", intent: "Mô tả nội dung khối…", learningGoal: "" });
    setBoard(next);
  };
  const updateCard = (id: string, patch: Partial<StoryboardItem>) => {
    if (!board) return;
    const next = cloneBoard(board);
    for (const sec of next.sections) {
      const it = sec.items.find((i) => i.id === id);
      if (it) { Object.assign(it, patch); break; }
    }
    setBoard(next);
  };
  const deleteCard = (id: string) => {
    if (!board) return;
    setBoard({ sections: board.sections.map((s) => ({ ...s, items: s.items.filter((i) => i.id !== id).map((i) => ({ ...i })) })) });
  };

  /* ─── DnD: move card across columns ─────────────────────────── */
  const onDragStart = (e: DragStartEvent) => setActiveCardId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveCardId(null);
    const { active, over } = e;
    if (!over || !board) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const next = cloneBoard(board);
    let moved: StoryboardItem | undefined;
    for (const sec of next.sections) {
      const idx = sec.items.findIndex((i) => i.id === activeId);
      if (idx >= 0) { moved = sec.items.splice(idx, 1)[0]; break; }
    }
    if (!moved) return;

    const overSection = next.sections.find((s) => s.id === overId);
    if (overSection) {
      overSection.items.push(moved);
    } else {
      let placed = false;
      for (const sec of next.sections) {
        const idx = sec.items.findIndex((i) => i.id === overId);
        if (idx >= 0) { sec.items.splice(idx, 0, moved); placed = true; break; }
      }
      if (!placed) next.sections[0]?.items.push(moved);
    }
    setBoard(next);
  };

  const allCardIds = (board?.sections ?? []).flatMap((s) => s.items.map((i) => i.id));
  const activeCard = (board?.sections ?? []).flatMap((s) => s.items).find((i) => i.id === activeCardId);

  return (
    <div className="flex h-screen flex-col bg-muted/30">
      {/* Header */}
      <header className="z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Quay lại bài"
          onClick={() => navigate({ to: courseBuilderRoutePattern(scope), params: { id: courseId } })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">Dàn ý bài học</p>
          <p className="truncate text-[11px] text-muted-foreground">{contentItem?.title ?? "Khoá học"}</p>
        </div>

        {/* Lesson selector */}
        {lessons.length > 0 && (
          <div className="relative">
            <select
              value={effectiveLessonId}
              onChange={(e) => setLessonId(e.target.value)}
              className="h-8 appearance-none rounded-lg border border-border bg-card pl-3 pr-7 text-xs font-medium text-foreground outline-none focus:border-primary"
              aria-label="Chọn bài học để dựng dàn ý"
            >
              {lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary-hover"
            size="sm"
            disabled={!board || applying || (board?.sections.flatMap((s) => s.items).length ?? 0) === 0}
            onClick={handleApply}
          >
            {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Áp dụng vào bài
          </Button>
        </div>
      </header>

      {/* Intake bar */}
      <div className="shrink-0 border-b border-border bg-card/60 px-4 py-3">
        <div className="mx-auto flex max-w-5xl flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-[11px] font-medium text-foreground">Chủ đề bài học</label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={activeLesson?.title || "Vd: Tốc độ phản ứng…"} className="h-9 text-sm" />
          </div>
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-[11px] font-medium text-foreground">Mục tiêu <span className="text-muted-foreground">(tuỳ chọn)</span></label>
            <Input value={objectives} onChange={(e) => setObjectives(e.target.value)} placeholder="Học sinh sẽ làm được gì?" className="h-9 text-sm" />
          </div>
          <details className="min-w-[180px] flex-1">
            <summary className="mb-1 cursor-pointer text-[11px] font-medium text-foreground">Dán văn bản nguồn</summary>
            <Textarea value={sourceText} onChange={(e) => setSourceText(e.target.value)} placeholder="Dán nội dung… AI sẽ tách thành dàn ý." className="mt-1 min-h-[60px] text-xs" />
          </details>
          <Button className="h-9 gap-2 bg-primary text-primary-foreground hover:bg-primary-hover" disabled={generating || !effectiveLessonId} onClick={handleGenerate}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {board ? "Tạo lại dàn ý" : "Tạo dàn ý"}
          </Button>
        </div>
      </div>

      {/* Board */}
      <div className="min-h-0 flex-1 overflow-auto p-4">
        {!board || board.sections.length === 0 ? (
          <EmptyBoard generating={generating} onGenerate={handleGenerate} />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <div className="flex h-full items-start gap-3 overflow-x-auto pb-2">
              {board.sections.map((section) => (
                <BoardColumn
                  key={section.id}
                  id={section.id}
                  title={section.title}
                  itemIds={section.items.map((i) => i.id)}
                  onRename={(t) => renameSection(section.id, t)}
                  onAddCard={() => addCard(section.id)}
                  onDelete={() => deleteSection(section.id)}
                  canDelete={board.sections.length > 1}
                >
                  {section.items.map((item) => (
                    <BoardCard key={item.id} item={item} onUpdate={(p) => updateCard(item.id, p)} onDelete={() => deleteCard(item.id)} />
                  ))}
                </BoardColumn>
              ))}
              <button
                type="button"
                onClick={addSection}
                className="flex h-10 w-[180px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-dashed border-border text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
              >
                <Plus className="h-4 w-4" /> Thêm phần
              </button>
            </div>

            <DragOverlay>
              {activeCard && (
                <div className="w-[248px] rounded-lg border border-primary bg-card p-2.5 shadow-xl">
                  <BlockTypeChip type={activeCard.blockType} />
                  <p className="mt-1.5 text-xs text-foreground">{activeCard.intent}</p>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
}

/* ─── Empty board ───────────────────────────────────────────────── */

function EmptyBoard({ generating, onGenerate }: { generating: boolean; onGenerate: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-primary">
        <Wand2 className="h-7 w-7" />
      </div>
      <p className="mt-4 text-base font-semibold text-foreground">Chưa có dàn ý</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Nhập chủ đề ở trên rồi bấm <span className="font-medium text-foreground">Tạo dàn ý</span> để AI phác khung bài thành các phần và khối nội dung.
      </p>
      <Button className="mt-4 gap-2 bg-primary text-primary-foreground hover:bg-primary-hover" disabled={generating} onClick={onGenerate}>
        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
        Tạo dàn ý
      </Button>
    </div>
  );
}

/* ─── Column ────────────────────────────────────────────────────── */

function BoardColumn({
  id, title, itemIds, onRename, onAddCard, onDelete, canDelete, children,
}: {
  id: string;
  title: string;
  itemIds: string[];
  onRename: (t: string) => void;
  onAddCard: () => void;
  onDelete: () => void;
  canDelete: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(title);

  return (
    <div className={cn("flex w-[270px] shrink-0 flex-col rounded-xl border border-border bg-muted/40 transition", isOver && "border-primary bg-accent/40")}>
      <div className="flex items-center gap-1.5 px-3 py-2.5">
        {editing ? (
          <input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={() => { if (val.trim()) onRename(val.trim()); setEditing(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") { if (val.trim()) onRename(val.trim()); setEditing(false); } }}
            autoFocus
            className="min-w-0 flex-1 rounded border border-primary bg-card px-1.5 py-0.5 text-sm font-semibold outline-none"
          />
        ) : (
          <button type="button" onDoubleClick={() => { setVal(title); setEditing(true); }} className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-foreground" title="Double-click để đổi tên">
            {title}
          </button>
        )}
        <span className="rounded-full bg-card px-1.5 text-[10px] font-medium text-muted-foreground">{itemIds.length}</span>
        {canDelete && (
          <button type="button" onClick={onDelete} className="rounded p-1 text-muted-foreground transition hover:text-destructive" aria-label="Xoá phần">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div ref={setNodeRef} className="min-h-[60px] flex-1 space-y-2 px-2.5 pb-2">
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>
        <button
          type="button"
          onClick={onAddCard}
          className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-border py-1.5 text-[11px] font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5" /> Thêm khối
        </button>
      </div>
    </div>
  );
}

/* ─── Card ──────────────────────────────────────────────────────── */

function BoardCard({ item, onUpdate, onDelete }: { item: StoryboardItem; onUpdate: (p: Partial<StoryboardItem>) => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const [typeOpen, setTypeOpen] = useState(false);

  return (
    <div ref={setNodeRef} style={style} className={cn("group rounded-lg border border-border bg-card p-2.5 shadow-sm transition", isDragging && "opacity-50")}>
      <div className="flex items-center gap-1.5">
        <span {...listeners} {...attributes} className="cursor-grab text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing" aria-label="Kéo">
          <GripVertical className="h-3.5 w-3.5" />
        </span>
        <div className="relative">
          <button type="button" onClick={() => setTypeOpen((v) => !v)} className="flex items-center gap-1">
            <BlockTypeChip type={item.blockType} />
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
          {typeOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setTypeOpen(false)} />
              <div className="absolute left-0 top-full z-50 mt-1 max-h-56 w-[170px] overflow-y-auto rounded-xl border border-border bg-card p-1.5 shadow-xl">
                {BLOCK_TYPES.map((b) => {
                  const Icon = b.icon;
                  return (
                    <button
                      key={b.type}
                      type="button"
                      onClick={() => { onUpdate({ blockType: b.type as CourseBlockType }); setTypeOpen(false); }}
                      className={cn("flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] transition hover:bg-muted", item.blockType === b.type && "bg-accent text-primary")}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color: b.color }} /> {b.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
        <button type="button" onClick={onDelete} className="ml-auto rounded p-0.5 text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100" aria-label="Xoá khối">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <textarea
        value={item.intent}
        onChange={(e) => onUpdate({ intent: e.target.value })}
        rows={2}
        className="mt-1.5 w-full resize-none rounded-md bg-muted/40 px-2 py-1.5 text-xs text-foreground outline-none focus:bg-muted"
        aria-label="Mô tả khối"
      />
    </div>
  );
}

function BlockTypeChip({ type }: { type: CourseBlockType }) {
  const meta = BLOCK_TYPES.find((b) => b.type === type);
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
      style={{ background: `color-mix(in srgb, ${meta.color} 12%, transparent)`, color: meta.color }}
    >
      <Icon className="h-3 w-3" /> {meta.label}
    </span>
  );
}
