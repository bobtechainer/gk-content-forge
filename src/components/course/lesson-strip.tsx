import { useState } from "react";
import { SortableContext, horizontalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, BookOpen, FolderOpen, FolderTree, ChevronUp, ChevronDown, Check } from "lucide-react";
import type { CourseChapter, CourseLesson } from "@/stores/course";
import { cn } from "@/lib/utils";

type PublishState = "never" | "published" | "dirty";

/* ─── Main strip ───────────────────────────────────────────────── */

interface LessonStripProps {
  chapters: CourseChapter[];
  lessons: CourseLesson[];
  activeLessonId: string | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSelectLesson: (id: string) => void;
  onAddLesson: (chapterId: string) => void;
  onAddChapter: () => void;
  onRenameChapter: (chapterId: string, title: string) => void;
  onRenameLesson: (lessonId: string, title: string) => void;
  onOpenStructure: () => void;
  getPublishState?: (lessonId: string) => PublishState;
}

export function LessonStrip({
  chapters, lessons, activeLessonId, collapsed, onToggleCollapse,
  onSelectLesson, onAddLesson, onAddChapter,
  onRenameChapter, onRenameLesson, onOpenStructure,
  getPublishState,
}: LessonStripProps) {
  const items: { type: "chapter" | "lesson" | "add-lesson" | "add-chapter"; chapter?: CourseChapter; lesson?: CourseLesson; chapterId?: string }[] = [];

  for (const ch of chapters) {
    items.push({ type: "chapter", chapter: ch });
    const chLessons = lessons.filter((l) => l.chapterId === ch.id);
    for (const ls of chLessons) items.push({ type: "lesson", lesson: ls });
    items.push({ type: "add-lesson", chapterId: ch.id });
  }
  items.push({ type: "add-chapter" });

  const sortableIds = lessons.map((l) => l.id);

  return (
    <div className="shrink-0 border-t border-border bg-card">
      {/* Collapse handle */}
      <button
        onClick={onToggleCollapse}
        className="flex h-5 w-full items-center justify-center text-muted-foreground/50 transition hover:bg-muted/50 hover:text-muted-foreground"
        title={collapsed ? "Mở thanh bài học" : "Thu gọn thanh bài học"}
      >
        {collapsed ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {!collapsed && (
        <div className="flex h-[72px] items-center gap-1.5 px-2 overflow-x-auto [scrollbar-width:thin]">
          {/* Structure button */}
          <button
            onClick={onOpenStructure}
            className="flex h-[48px] shrink-0 items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/50 px-2.5 text-amber-700 transition hover:bg-amber-100 hover:border-amber-300"
            title="Mở cấu trúc khóa học"
          >
            <FolderTree className="h-4 w-4" />
            <span className="text-[10px] font-semibold">Cấu trúc</span>
          </button>

          <div className="mx-1 h-8 w-px bg-border shrink-0" />

          <SortableContext items={sortableIds} strategy={horizontalListSortingStrategy}>
            {items.map((item, i) => {
              if (item.type === "chapter") {
                return (
                  <EditableChapterBadge
                    key={item.chapter!.id}
                    chapter={item.chapter!}
                    showSeparator={i > 0}
                    onRename={(t) => onRenameChapter(item.chapter!.id, t)}
                  />
                );
              }
              if (item.type === "lesson") {
                return (
                  <SortableLessonItem
                    key={item.lesson!.id}
                    lesson={item.lesson!}
                    isActive={activeLessonId === item.lesson!.id}
                    onSelect={() => onSelectLesson(item.lesson!.id)}
                    onRename={(t) => onRenameLesson(item.lesson!.id, t)}
                    publishState={getPublishState?.(item.lesson!.id) ?? "never"}
                  />
                );
              }
              if (item.type === "add-lesson") {
                return (
                  <button key={`add-${item.chapterId}`} type="button"
                    onClick={() => onAddLesson(item.chapterId!)}
                    className="flex h-[48px] w-[40px] shrink-0 flex-col items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground transition hover:border-primary hover:bg-accent hover:text-primary"
                    title="Thêm bài học">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                );
              }
              if (item.type === "add-chapter") {
                return (
                  <button key="add-chapter" type="button" onClick={onAddChapter}
                    className="flex h-[48px] shrink-0 items-center gap-1 rounded-lg border border-dashed border-amber-300 px-2.5 text-amber-600 transition hover:border-amber-500 hover:bg-amber-50"
                    title="Thêm chương mới">
                    <Plus className="h-3.5 w-3.5" />
                    <span className="text-[9px] font-medium">Chương</span>
                  </button>
                );
              }
              return null;
            })}
          </SortableContext>
        </div>
      )}
    </div>
  );
}

/* ─── Editable chapter badge ───────────────────────────────────── */

function EditableChapterBadge({
  chapter, showSeparator, onRename,
}: {
  chapter: CourseChapter;
  showSeparator: boolean;
  onRename: (title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(chapter.title);

  const save = () => { if (val.trim() && val !== chapter.title) onRename(val.trim()); setEditing(false); };

  return (
    <div className="flex shrink-0 items-center gap-1">
      {showSeparator && <div className="mx-0.5 h-6 w-px bg-border" />}
      {editing ? (
        <div className="flex items-center gap-1 rounded-md bg-amber-50 border border-amber-300 px-1.5 py-0.5">
          <FolderOpen className="h-3 w-3 text-amber-600 shrink-0" />
          <input value={val} onChange={(e) => setVal(e.target.value)} onBlur={save}
            onKeyDown={(e) => e.key === "Enter" && save()}
            className="w-[80px] bg-transparent text-[10px] font-semibold outline-none" autoFocus />
          <button onClick={save} className="text-amber-600"><Check className="h-3 w-3" /></button>
        </div>
      ) : (
        <div
          onDoubleClick={() => { setVal(chapter.title); setEditing(true); }}
          className="flex cursor-pointer items-center gap-1 rounded-md bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 px-2 py-1 transition hover:border-amber-300 hover:shadow-sm"
          title="Double-click để đổi tên"
        >
          <FolderOpen className="h-3 w-3 text-amber-600" />
          <span className="max-w-[90px] truncate text-[10px] font-semibold text-amber-800">
            {chapter.title}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── Sortable lesson item ─────────────────────────────────────── */

const PUBLISH_DOT: Record<PublishState, { className: string; label: string }> = {
  never: { className: "bg-muted-foreground/40", label: "Chưa xuất bản" },
  published: { className: "bg-success", label: "Đã xuất bản" },
  dirty: { className: "bg-warning", label: "Có thay đổi chưa xuất bản" },
};

function SortableLessonItem({
  lesson, isActive, onSelect, onRename, publishState,
}: {
  lesson: CourseLesson;
  isActive: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  publishState: PublishState;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(lesson.title);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id,
    data: { source: "strip", lessonId: lesson.id },
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const save = () => { if (val.trim() && val !== lesson.title) onRename(val.trim()); setEditing(false); };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={!editing ? onSelect : undefined}
      onDoubleClick={(e) => { e.stopPropagation(); setVal(lesson.title); setEditing(true); }}
      className={cn(
        "group relative flex h-[48px] shrink-0 cursor-pointer select-none items-center gap-1.5 rounded-lg border bg-card px-2.5 transition",
        isActive
          ? "border-primary bg-accent shadow-sm shadow-primary/15"
          : "border-border hover:border-muted-foreground/40 hover:bg-muted/30",
        isDragging && "z-50 opacity-50",
      )}
      title={editing ? undefined : "Double-click để đổi tên"}
    >
      {/* Drag handle */}
      <div {...listeners} {...attributes}
        className="absolute -top-1 -right-1 z-10 hidden h-4 w-4 cursor-grab items-center justify-center rounded bg-muted text-muted-foreground shadow-sm group-hover:flex"
        onClick={(e) => e.stopPropagation()}>
        <GripVertical className="h-2.5 w-2.5" />
      </div>

      <BookOpen className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />

      {/* Publish state dot */}
      <span
        role="img"
        className={cn("absolute top-1 right-1 h-2 w-2 rounded-full", PUBLISH_DOT[publishState].className)}
        aria-label={PUBLISH_DOT[publishState].label}
        title={PUBLISH_DOT[publishState].label}
      />

      {editing ? (
        <input value={val} onChange={(e) => setVal(e.target.value)} onBlur={save}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
          onClick={(e) => e.stopPropagation()}
          className="w-[70px] bg-transparent text-[10px] font-medium outline-none" autoFocus />
      ) : (
        <span className={cn("max-w-[70px] truncate text-[10px] font-medium", isActive ? "text-primary" : "text-foreground")}>
          {lesson.title}
        </span>
      )}

      {isActive && <span className="absolute -bottom-1 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-primary" />}
    </div>
  );
}
