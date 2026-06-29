import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter,
  useDroppable, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronRight, Plus, Trash2, Check, FileText, Folder, Layers, FolderTree, CornerDownRight,
} from "lucide-react";
import {
  useCourse, buildCourseTree,
  type CourseData, type CourseNodeType, type CourseTreeNode,
} from "@/stores/course";
import { cn } from "@/lib/utils";

type PublishState = "never" | "published" | "dirty";
type ParentRef = { id: string; type: "part" | "chapter" } | null;
type Selected = { id: string; type: CourseNodeType } | null;

const PUBLISH_DOT: Record<PublishState, { className: string; label: string }> = {
  never: { className: "bg-muted-foreground/40", label: "Chưa xuất bản" },
  published: { className: "bg-success", label: "Đã xuất bản" },
  dirty: { className: "bg-warning-500", label: "Có thay đổi chưa xuất bản" },
};

const NODE_META: Record<CourseNodeType, { icon: typeof Folder; chip: string }> = {
  part: { icon: Layers, chip: "bg-brand-50 text-primary" },
  chapter: { icon: Folder, chip: "bg-muted text-muted-foreground" },
  lesson: { icon: FileText, chip: "" },
};

const EMPTY: CourseData = { parts: [], chapters: [], lessons: [] };

interface LessonTreeProps {
  courseId: string;
  activeLessonId: string | null;
  onSelectLesson: (id: string) => void;
  getPublishState: (lessonId: string) => PublishState;
}

export function LessonTree({ courseId, activeLessonId, onSelectLesson, getPublishState }: LessonTreeProps) {
  const data = useCourse((s) => s.courseData[courseId]) ?? EMPTY;
  const addPart = useCourse((s) => s.addPart);
  const addChapterUnder = useCourse((s) => s.addChapterUnder);
  const addLessonUnder = useCourse((s) => s.addLessonUnder);
  const renameNode = useCourse((s) => s.renameNode);
  const deleteNode = useCourse((s) => s.deleteNode);
  const moveNode = useCourse((s) => s.moveNode);

  const tree = useMemo(() => buildCourseTree(data), [data]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Selected>(null);
  const [dragLabel, setDragLabel] = useState<string | null>(null);

  const toggle = (id: string) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  /* ─── Resolve "add target" from current selection ─────────────── */
  const partIdOf = (sel: Selected): string | null => {
    if (!sel) return null;
    if (sel.type === "part") return sel.id;
    if (sel.type === "chapter") return data.chapters.find((c) => c.id === sel.id)?.partId ?? null;
    const l = data.lessons.find((x) => x.id === sel.id);
    if (l?.chapterId) return data.chapters.find((c) => c.id === l.chapterId)?.partId ?? null;
    return l?.partId ?? null;
  };
  const containerForLesson = (sel: Selected): ParentRef => {
    if (!sel) return null;
    if (sel.type === "chapter") return { id: sel.id, type: "chapter" };
    if (sel.type === "part") return { id: sel.id, type: "part" };
    const l = data.lessons.find((x) => x.id === sel.id);
    if (l?.chapterId) return { id: l.chapterId, type: "chapter" };
    if (l?.partId) return { id: l.partId, type: "part" };
    return null;
  };

  const handleAddPart = () => { const id = addPart(courseId); setSelected({ id, type: "part" }); };
  const handleAddChapter = () => { const id = addChapterUnder(courseId, partIdOf(selected)); setSelected({ id, type: "chapter" }); };
  const handleAddLesson = () => {
    const id = addLessonUnder(courseId, containerForLesson(selected));
    setSelected({ id, type: "lesson" });
    onSelectLesson(id);
  };

  /* ─── DnD reparent (self-contained context) ───────────────────── */
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const nodeTypeOf = (id: string): CourseNodeType | null => {
    if ((data.parts ?? []).some((p) => p.id === id)) return "part";
    if (data.chapters.some((c) => c.id === id)) return "chapter";
    if (data.lessons.some((l) => l.id === id)) return "lesson";
    return null;
  };
  const parentRefOf = (id: string, type: CourseNodeType): ParentRef => {
    if (type === "part") return null;
    if (type === "chapter") { const c = data.chapters.find((x) => x.id === id); return c?.partId ? { id: c.partId, type: "part" } : null; }
    const l = data.lessons.find((x) => x.id === id);
    if (l?.chapterId) return { id: l.chapterId, type: "chapter" };
    if (l?.partId) return { id: l.partId, type: "part" };
    return null;
  };

  const onDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id);
    const title =
      (data.parts ?? []).find((p) => p.id === id)?.title ??
      data.chapters.find((c) => c.id === id)?.title ??
      data.lessons.find((l) => l.id === id)?.title ?? "";
    setDragLabel(title);
  };

  const onDragEnd = (e: DragEndEvent) => {
    setDragLabel(null);
    const { active, over } = e;
    if (!over) return;
    const aid = String(active.id);
    const oid = String(over.id);
    if (aid === oid) return;
    const aType = nodeTypeOf(aid);
    if (!aType) return;

    if (oid === "tree-root") { moveNode(courseId, aid, aType, null); return; }
    const oType = nodeTypeOf(oid);
    if (!oType) return;

    let targetParent: ParentRef = null;
    let beforeId: string | null = null;
    if (oType === "lesson") { targetParent = parentRefOf(oid, "lesson"); beforeId = oid; }
    else if (oType === "chapter") {
      if (aType === "lesson") { targetParent = { id: oid, type: "chapter" }; }
      else { targetParent = parentRefOf(oid, "chapter"); beforeId = oid; }
    } else { // over a part
      if (aType === "part") { targetParent = null; beforeId = oid; }
      else { targetParent = { id: oid, type: "part" }; }
    }
    if (aType === "part") targetParent = null;
    if (aType === "chapter" && targetParent && targetParent.type === "chapter") {
      targetParent = parentRefOf(targetParent.id, "chapter");
    }
    moveNode(courseId, aid, aType, targetParent, beforeId);
  };

  const allIds = useMemo(() => {
    const ids: string[] = [];
    const walk = (nodes: CourseTreeNode[]) => nodes.forEach((n) => { ids.push(n.id); walk(n.children); });
    walk(tree);
    return ids;
  }, [tree]);

  return (
    <div className="flex h-full w-[268px] shrink-0 flex-col border-r border-border bg-sidebar">
      {/* Header + add bar */}
      <div className="border-b border-border px-3 py-2.5">
        <div className="mb-2 flex items-center gap-2">
          <FolderTree className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-sidebar-foreground">Nội dung khoá học</span>
        </div>
        <div className="flex gap-1">
          {([["part", "Phần", handleAddPart], ["chapter", "Chương", handleAddChapter], ["lesson", "Bài", handleAddLesson]] as const).map(
            ([type, label, fn]) => (
              <button
                key={type}
                type="button"
                onClick={fn}
                className="flex flex-1 items-center justify-center gap-1 rounded-md border border-border bg-card px-1.5 py-1 text-[11px] font-medium text-foreground transition hover:border-primary hover:text-primary"
                title={`Thêm ${label}${selected ? " vào mục đang chọn" : ""}`}
              >
                <Plus className="h-3 w-3" /> {label}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Tree */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          <SortableContext items={allIds} strategy={verticalListSortingStrategy}>
            {tree.length === 0 ? (
              <p className="px-2 py-6 text-center text-[11px] text-muted-foreground">
                Chưa có nội dung. Bấm <b>＋ Phần / Chương / Bài</b> ở trên để bắt đầu.
              </p>
            ) : (
              tree.map((node) => (
                <TreeRow
                  key={node.id}
                  node={node}
                  depth={0}
                  collapsed={collapsed}
                  onToggle={toggle}
                  selectedId={selected?.id ?? null}
                  activeLessonId={activeLessonId}
                  onSelect={(n) => {
                    setSelected({ id: n.id, type: n.type });
                    if (n.type === "lesson") onSelectLesson(n.id);
                    else toggle(n.id);
                  }}
                  onRename={(n, t) => renameNode(courseId, n.id, n.type, t)}
                  onDelete={(n) => deleteNode(courseId, n.id, n.type)}
                  onAddChild={(n) => {
                    if (n.type === "part") { const id = addChapterUnder(courseId, n.id); setSelected({ id, type: "chapter" }); }
                    else if (n.type === "chapter") { const id = addLessonUnder(courseId, { id: n.id, type: "chapter" }); setSelected({ id, type: "lesson" }); onSelectLesson(id); }
                  }}
                  getPublishState={getPublishState}
                />
              ))
            )}
            <RootDropZone visible={!!dragLabel} />
          </SortableContext>
        </div>

        <DragOverlay>
          {dragLabel && (
            <div className="flex items-center gap-1.5 rounded-md border border-primary bg-card px-2.5 py-1.5 text-xs font-medium text-foreground shadow-lg">
              <CornerDownRight className="h-3.5 w-3.5 text-primary" /> {dragLabel}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

/* ─── Root drop zone (kéo ra ngoài cùng) ────────────────────────── */

function RootDropZone({ visible }: { visible: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: "tree-root" });
  if (!visible) return <div ref={setNodeRef} className="h-3" />;
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "mt-1 rounded-md border border-dashed px-2 py-2 text-center text-[10px] transition",
        isOver ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground",
      )}
    >
      Thả vào đây để đưa ra ngoài cùng
    </div>
  );
}

/* ─── Tree row (recursive) ──────────────────────────────────────── */

function TreeRow({
  node, depth, collapsed, onToggle, selectedId, activeLessonId,
  onSelect, onRename, onDelete, onAddChild, getPublishState,
}: {
  node: CourseTreeNode;
  depth: number;
  collapsed: Record<string, boolean>;
  onToggle: (id: string) => void;
  selectedId: string | null;
  activeLessonId: string | null;
  onSelect: (n: CourseTreeNode) => void;
  onRename: (n: CourseTreeNode, t: string) => void;
  onDelete: (n: CourseTreeNode) => void;
  onAddChild: (n: CourseTreeNode) => void;
  getPublishState: (lessonId: string) => PublishState;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(node.title);

  const isContainer = node.type !== "lesson";
  const isOpen = !collapsed[node.id];
  const isActive = node.type === "lesson" ? activeLessonId === node.id : selectedId === node.id;
  const meta = NODE_META[node.type];
  const Icon = meta.icon;
  const save = () => { if (val.trim() && val !== node.title) onRename(node, val.trim()); setEditing(false); };

  return (
    <div>
      <div
        ref={setNodeRef}
        style={{ ...style, paddingLeft: depth * 14 + 4 }}
        className={cn(
          "group relative flex items-center gap-1 rounded-md py-1.5 pr-1.5 transition",
          isActive ? "bg-accent" : "hover:bg-accent/50",
          isDragging && "opacity-50",
        )}
      >
        {isActive && node.type === "lesson" && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />}

        {isContainer ? (
          <button type="button" onClick={() => onToggle(node.id)} className="flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground" aria-label={isOpen ? "Thu gọn" : "Mở"}>
            <motion.span animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.15 }}>
              <ChevronRight className="h-3.5 w-3.5" />
            </motion.span>
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}

        <span {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing" title="Kéo để chuyển cấp / sắp xếp">
          <Icon className={cn("h-3.5 w-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
        </span>

        {editing ? (
          <input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
            autoFocus
            className="min-w-0 flex-1 rounded border border-primary bg-card px-1.5 py-0.5 text-xs outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => onSelect(node)}
            onDoubleClick={() => { setVal(node.title); setEditing(true); }}
            className={cn("min-w-0 flex-1 truncate text-left text-xs", isActive ? "font-semibold text-primary" : "text-sidebar-foreground")}
            title="Bấm để chọn · double-click để đổi tên"
          >
            {node.title}
          </button>
        )}

        {node.type === "lesson" && (
          <span className={cn("h-2 w-2 shrink-0 rounded-full", PUBLISH_DOT[getPublishState(node.id)].className)} title={PUBLISH_DOT[getPublishState(node.id)].label} />
        )}

        <div className="flex shrink-0 items-center opacity-0 transition group-hover:opacity-100">
          {isContainer && (
            <button type="button" onClick={() => onAddChild(node)} className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition hover:bg-card hover:text-primary" title={node.type === "part" ? "Thêm chương" : "Thêm bài"} aria-label="Thêm mục con">
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
          <button type="button" onClick={() => onDelete(node)} className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition hover:bg-error-50 hover:text-destructive" title="Xoá" aria-label="Xoá">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {isContainer && (
        <AnimatePresence initial={false}>
          {isOpen && node.children.length > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
              {node.children.map((child) => (
                <TreeRow
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  collapsed={collapsed}
                  onToggle={onToggle}
                  selectedId={selectedId}
                  activeLessonId={activeLessonId}
                  onSelect={onSelect}
                  onRename={onRename}
                  onDelete={onDelete}
                  onAddChild={onAddChild}
                  getPublishState={getPublishState}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

/* Giữ export tên cũ để builder import không đổi. */
export default LessonTree;
