import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, FolderOpen, BookOpen, Plus, Trash2, Pencil, Check,
  ChevronDown, ChevronRight, GripVertical,
} from "lucide-react";
import type { CourseChapter, CourseLesson } from "@/stores/course";
import { cn } from "@/lib/utils";

interface StructureDrawerProps {
  open: boolean;
  onClose: () => void;
  chapters: CourseChapter[];
  lessons: CourseLesson[];
  activeLessonId: string | null;
  onSelectLesson: (id: string) => void;
  onAddChapter: () => void;
  onAddLesson: (chapterId: string) => void;
  onRenameChapter: (chapterId: string, title: string) => void;
  onRenameLesson: (lessonId: string, title: string) => void;
  onDeleteChapter: (chapterId: string) => void;
  onDeleteLesson: (lessonId: string) => void;
}

export function StructureDrawer({
  open, onClose, chapters, lessons, activeLessonId,
  onSelectLesson, onAddChapter, onAddLesson,
  onRenameChapter, onRenameLesson, onDeleteChapter, onDeleteLesson,
}: StructureDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="fixed left-0 top-[56px] bottom-0 z-50 flex w-[340px] flex-col border-r border-border bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <FolderOpen className="h-4 w-4 text-amber-600" />
                Cấu trúc khóa học
              </h3>
              <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tree */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {chapters.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Chưa có chương nào. Bấm nút bên dưới để tạo.
                </div>
              ) : (
                chapters.map((ch) => (
                  <ChapterNode
                    key={ch.id}
                    chapter={ch}
                    lessons={lessons.filter((l) => l.chapterId === ch.id)}
                    activeLessonId={activeLessonId}
                    onSelectLesson={onSelectLesson}
                    onAddLesson={onAddLesson}
                    onRename={(title) => onRenameChapter(ch.id, title)}
                    onDelete={() => onDeleteChapter(ch.id)}
                    onRenameLesson={onRenameLesson}
                    onDeleteLesson={onDeleteLesson}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t p-3">
              <button
                onClick={onAddChapter}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-amber-300 py-2.5 text-xs font-medium text-amber-600 transition hover:border-amber-500 hover:bg-amber-50"
              >
                <Plus className="h-4 w-4" />
                Thêm chương mới
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Chapter node ─────────────────────────────────────────────── */

function ChapterNode({
  chapter, lessons, activeLessonId, onSelectLesson,
  onAddLesson, onRename, onDelete, onRenameLesson, onDeleteLesson,
}: {
  chapter: CourseChapter;
  lessons: CourseLesson[];
  activeLessonId: string | null;
  onSelectLesson: (id: string) => void;
  onAddLesson: (chapterId: string) => void;
  onRename: (title: string) => void;
  onDelete: () => void;
  onRenameLesson: (lessonId: string, title: string) => void;
  onDeleteLesson: (lessonId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(chapter.title);

  const handleSave = () => {
    if (editVal.trim() && editVal !== chapter.title) onRename(editVal.trim());
    setEditing(false);
  };

  return (
    <div className="rounded-lg border border-border/50 bg-muted/20">
      {/* Chapter header */}
      <div className="group flex items-center gap-1.5 px-2 py-2">
        <button onClick={() => setExpanded(!expanded)} className="shrink-0 p-0.5 text-muted-foreground">
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
        <FolderOpen className="h-3.5 w-3.5 shrink-0 text-amber-600" />
        {editing ? (
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <input value={editVal} onChange={(e) => setEditVal(e.target.value)} onBlur={handleSave}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="min-w-0 flex-1 rounded bg-white px-1.5 py-0.5 text-xs outline-none ring-1 ring-[#2563EB]" autoFocus />
            <button onClick={handleSave} className="text-[#2563EB]"><Check className="h-3 w-3" /></button>
          </div>
        ) : (
          <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">{chapter.title}</span>
        )}
        <div className="hidden items-center gap-0.5 group-hover:flex">
          <button onClick={() => { setEditVal(chapter.title); setEditing(true); }} className="p-1 text-muted-foreground hover:text-foreground" title="Đổi tên">
            <Pencil className="h-3 w-3" />
          </button>
          <button onClick={onDelete} className="p-1 text-muted-foreground hover:text-red-500" title="Xóa chương">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Lessons */}
      {expanded && (
        <div className="space-y-0.5 pb-2 pl-4 pr-2">
          {lessons.map((ls) => (
            <LessonNode
              key={ls.id}
              lesson={ls}
              isActive={activeLessonId === ls.id}
              onSelect={() => onSelectLesson(ls.id)}
              onRename={(t) => onRenameLesson(ls.id, t)}
              onDelete={() => onDeleteLesson(ls.id)}
            />
          ))}
          <button
            onClick={() => onAddLesson(chapter.id)}
            className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-[11px] text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Plus className="h-3 w-3" />
            Thêm bài học
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Lesson node ──────────────────────────────────────────────── */

function LessonNode({
  lesson, isActive, onSelect, onRename, onDelete,
}: {
  lesson: CourseLesson;
  isActive: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(lesson.title);

  const handleSave = () => {
    if (editVal.trim() && editVal !== lesson.title) onRename(editVal.trim());
    setEditing(false);
  };

  return (
    <div
      onClick={!editing ? onSelect : undefined}
      className={cn(
        "group flex cursor-pointer items-center gap-1.5 rounded px-2 py-1.5 transition",
        isActive ? "bg-[#2563EB]/10 text-[#2563EB]" : "hover:bg-muted",
      )}
    >
      <BookOpen className={cn("h-3 w-3 shrink-0", isActive ? "text-[#2563EB]" : "text-muted-foreground")} />
      {editing ? (
        <div className="flex min-w-0 flex-1 items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <input value={editVal} onChange={(e) => setEditVal(e.target.value)} onBlur={handleSave}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="min-w-0 flex-1 rounded bg-white px-1 py-0.5 text-[11px] outline-none ring-1 ring-[#2563EB]" autoFocus />
        </div>
      ) : (
        <span className={cn("min-w-0 flex-1 truncate text-[11px] font-medium", isActive ? "text-[#2563EB]" : "text-foreground")}>
          {lesson.title}
        </span>
      )}
      <span className="text-[9px] text-muted-foreground">{lesson.blocks.length}</span>
      <div className="hidden items-center gap-0.5 group-hover:flex">
        <button onClick={(e) => { e.stopPropagation(); setEditVal(lesson.title); setEditing(true); }}
          className="p-0.5 text-muted-foreground hover:text-foreground"><Pencil className="h-2.5 w-2.5" /></button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-0.5 text-muted-foreground hover:text-red-500"><Trash2 className="h-2.5 w-2.5" /></button>
      </div>
    </div>
  );
}
