import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronRight, Plus, GripVertical, Trash2, Check, FileText, FolderTree, Settings2,
} from "lucide-react";
import type { CourseChapter, CourseLesson } from "@/stores/course";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PublishState = "never" | "published" | "dirty";

const PUBLISH_DOT: Record<PublishState, { className: string; label: string }> = {
  never: { className: "bg-muted-foreground/40", label: "Chưa xuất bản" },
  published: { className: "bg-success", label: "Đã xuất bản" },
  dirty: { className: "bg-warning-500", label: "Có thay đổi chưa xuất bản" },
};

/* ─── Props ─────────────────────────────────────────────────────── */

interface LessonTreeProps {
  chapters: CourseChapter[];
  lessons: CourseLesson[];
  activeLessonId: string | null;
  onSelectLesson: (id: string) => void;
  onAddChapter: () => void;
  onAddLesson: (chapterId: string) => void;
  onRenameChapter: (id: string, title: string) => void;
  onRenameLesson: (id: string, title: string) => void;
  onDeleteChapter: (id: string) => void;
  onDeleteLesson: (id: string) => void;
  getPublishState: (lessonId: string) => PublishState;
  onOpenStructure: () => void;
}

/* ─── Tree ──────────────────────────────────────────────────────── */

export function LessonTree({
  chapters, lessons, activeLessonId,
  onSelectLesson, onAddChapter, onAddLesson,
  onRenameChapter, onRenameLesson, onDeleteChapter, onDeleteLesson,
  getPublishState, onOpenStructure,
}: LessonTreeProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  return (
    <div className="flex h-full w-[268px] shrink-0 flex-col border-r border-border bg-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <FolderTree className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-sidebar-foreground">Nội dung khoá học</span>
        </div>
        <button
          type="button"
          onClick={onAddChapter}
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-primary"
          title="Thêm chương" aria-label="Thêm chương"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Tree body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <SortableContext items={lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {chapters.map((chapter, ci) => {
            const chLessons = lessons.filter((l) => l.chapterId === chapter.id);
            const isCollapsed = collapsed[chapter.id];
            return (
              <div key={chapter.id} className="mb-1">
                <ChapterRow
                  chapter={chapter}
                  index={ci}
                  lessonCount={chLessons.length}
                  collapsed={!!isCollapsed}
                  canDelete={chapters.length > 1}
                  onToggle={() => toggle(chapter.id)}
                  onRename={(t) => onRenameChapter(chapter.id, t)}
                  onAddLesson={() => onAddLesson(chapter.id)}
                  onDelete={() => onDeleteChapter(chapter.id)}
                />
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="ml-3 mt-0.5 space-y-0.5 border-l border-border pl-2">
                        {chLessons.map((lesson, li) => (
                          <LessonRow
                            key={lesson.id}
                            lesson={lesson}
                            number={li + 1}
                            isActive={activeLessonId === lesson.id}
                            publishState={getPublishState(lesson.id)}
                            canDelete={chLessons.length > 1 || chapters.length > 1}
                            onSelect={() => onSelectLesson(lesson.id)}
                            onRename={(t) => onRenameLesson(lesson.id, t)}
                            onDelete={() => onDeleteLesson(lesson.id)}
                          />
                        ))}
                        <button
                          type="button"
                          onClick={() => onAddLesson(chapter.id)}
                          className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition hover:bg-accent hover:text-primary"
                        >
                          <Plus className="h-3.5 w-3.5" /> Thêm bài học
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </SortableContext>
      </div>

      {/* Footer */}
      <div className="border-t border-border p-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-xs"
          onClick={onOpenStructure}
        >
          <Settings2 className="h-3.5 w-3.5" /> Cấu trúc nâng cao
        </Button>
      </div>
    </div>
  );
}

/* ─── Chapter row ───────────────────────────────────────────────── */

function ChapterRow({
  chapter, index, lessonCount, collapsed, canDelete, onToggle, onRename, onAddLesson, onDelete,
}: {
  chapter: CourseChapter;
  index: number;
  lessonCount: number;
  collapsed: boolean;
  canDelete: boolean;
  onToggle: () => void;
  onRename: (t: string) => void;
  onAddLesson: () => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(chapter.title);
  const save = () => { if (val.trim() && val !== chapter.title) onRename(val.trim()); setEditing(false); };

  return (
    <div className="group flex items-center gap-1 rounded-md px-1.5 py-1.5 transition hover:bg-accent/60">
      <button
        type="button"
        onClick={onToggle}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground transition hover:text-foreground"
        aria-label={collapsed ? "Mở chương" : "Thu gọn chương"}
      >
        <motion.span animate={{ rotate: collapsed ? 0 : 90 }} transition={{ duration: 0.18 }}>
          <ChevronRight className="h-3.5 w-3.5" />
        </motion.span>
      </button>

      {editing ? (
        <div className="flex flex-1 items-center gap-1">
          <input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
            autoFocus
            className="w-full rounded border border-primary bg-card px-1.5 py-0.5 text-xs font-semibold text-foreground outline-none"
          />
          <button onClick={save} className="text-primary" aria-label="Lưu tên chương"><Check className="h-3.5 w-3.5" /></button>
        </div>
      ) : (
        <button
          type="button"
          onDoubleClick={() => { setVal(chapter.title); setEditing(true); }}
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
          title="Bấm để thu gọn · double-click để đổi tên"
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-brand-50 text-[10px] font-bold text-primary">
            {index + 1}
          </span>
          <span className="truncate text-xs font-semibold text-sidebar-foreground">{chapter.title}</span>
          <span className="shrink-0 text-[10px] text-muted-foreground">{lessonCount}</span>
        </button>
      )}

      <div className="flex shrink-0 items-center opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          onClick={onAddLesson}
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition hover:bg-card hover:text-primary"
          title="Thêm bài vào chương" aria-label="Thêm bài vào chương"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition hover:bg-error-50 hover:text-destructive"
            title="Xoá chương" aria-label="Xoá chương"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Lesson row (sortable) ─────────────────────────────────────── */

function LessonRow({
  lesson, number, isActive, publishState, canDelete, onSelect, onRename, onDelete,
}: {
  lesson: CourseLesson;
  number: number;
  isActive: boolean;
  publishState: PublishState;
  canDelete: boolean;
  onSelect: () => void;
  onRename: (t: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(lesson.title);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id,
    data: { source: "strip", lessonId: lesson.id },
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const save = () => { if (val.trim() && val !== lesson.title) onRename(val.trim()); setEditing(false); };
  const dot = PUBLISH_DOT[publishState];

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={!editing ? onSelect : undefined}
      className={cn(
        "group/lesson relative flex cursor-pointer select-none items-center gap-1.5 rounded-md px-2 py-1.5 transition",
        isActive ? "bg-accent" : "hover:bg-accent/50",
        isDragging && "z-50 opacity-60",
      )}
    >
      {isActive && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />}

      <span
        {...listeners}
        {...attributes}
        onClick={(e) => e.stopPropagation()}
        className="flex h-4 w-4 shrink-0 cursor-grab items-center justify-center text-muted-foreground/0 transition group-hover/lesson:text-muted-foreground/60 active:cursor-grabbing"
        title="Kéo để sắp xếp"
      >
        <GripVertical className="h-3 w-3" />
      </span>

      <FileText className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />

      {editing ? (
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
          onClick={(e) => e.stopPropagation()}
          autoFocus
          className="min-w-0 flex-1 rounded border border-primary bg-card px-1.5 py-0.5 text-xs outline-none"
        />
      ) : (
        <span
          onDoubleClick={(e) => { e.stopPropagation(); setVal(lesson.title); setEditing(true); }}
          className={cn("min-w-0 flex-1 truncate text-xs", isActive ? "font-semibold text-primary" : "text-sidebar-foreground")}
          title="Double-click để đổi tên"
        >
          {number}. {lesson.title}
        </span>
      )}

      <span className={cn("h-2 w-2 shrink-0 rounded-full", dot.className)} title={dot.label} aria-label={dot.label} />

      {canDelete && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition hover:text-destructive group-hover/lesson:opacity-100"
          title="Xoá bài" aria-label="Xoá bài học"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
