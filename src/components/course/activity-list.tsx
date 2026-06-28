import { useState, useMemo, useCallback } from "react";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { motion, AnimatePresence } from "framer-motion";
import {
  GripVertical, Plus, Sparkles, Move,
  Type, ImageIcon, VideoIcon, MessageSquare, Minus, Link2, Code2,
  Sigma, Columns2, ListChecks, Boxes, SplitSquareVertical,
  ChevronsUpDown, ListOrdered, Layers,
} from "lucide-react";
import type { CourseBlock, CourseBlockType, LessonSection } from "@/stores/course";
import { partitionSections } from "@/stores/course";
import { BLOCK_TYPES } from "./course-palette";
import { cn } from "@/lib/utils";

/* ─── Block icon map ──────────────────────────────────────────────── */

const ICON_MAP: Record<string, typeof Type> = {
  text: Type, image: ImageIcon, video: VideoIcon, callout: MessageSquare,
  divider: Minus, embed: Link2, code: Code2, math: Sigma,
  columns: Columns2, quiz: ListChecks, html: Boxes,
  section: SplitSquareVertical, accordion: ChevronsUpDown,
  process: ListOrdered, flashcards: Layers,
};

const BLOCK_LABELS: Record<string, string> = {
  text: "Văn bản", image: "Hình ảnh", video: "Video", callout: "Callout",
  divider: "Phân cách", embed: "Học liệu", code: "Code", math: "Công thức",
  columns: "Nhiều cột", quiz: "Câu hỏi", html: "HTML",
  section: "Phần mới", accordion: "Accordion", process: "Quy trình",
  flashcards: "Thẻ nhớ",
};

/* ─── Activity metadata helpers ───────────────────────────────────── */

function getActivityPreview(block: CourseBlock): string {
  switch (block.type) {
    case "text": return block.content?.slice(0, 60) || "Văn bản trống";
    case "quiz": return block.content || "Câu hỏi";
    case "callout": return block.content?.slice(0, 50) || "Callout";
    case "section": return block.content || "Phần mới";
    case "embed": return block.embedTitle || "Học liệu nhúng";
    case "code": return `${block.codeLanguage || "code"} snippet`;
    case "accordion": return `${block.accordionItems?.length ?? 0} mục`;
    case "process": return `${block.processSteps?.length ?? 0} bước`;
    case "flashcards": return `${block.flashcards?.length ?? 0} thẻ`;
    case "image": return block.caption || "Hình ảnh";
    case "video": return block.caption || "Video";
    case "math": return block.content?.slice(0, 40) || "Công thức";
    case "columns": return `${block.columnCount ?? 2} cột`;
    default: return block.type;
  }
}

function getActivityMeta(block: CourseBlock): string | null {
  if (block.type === "quiz") return `${block.quizOptions?.length ?? 0} lựa chọn`;
  if (block.type === "flashcards") return `${block.flashcards?.length ?? 0} thẻ`;
  if (block.type === "process") return `${block.processSteps?.length ?? 0} bước`;
  if (block.type === "accordion") return `${block.accordionItems?.length ?? 0} mục`;
  if (block.type === "video") return "00:00";
  return null;
}

/* ─── Props ────────────────────────────────────────────────────────── */

interface ActivityListProps {
  blocks: CourseBlock[];
  lessonTitle: string;
  onSelectBlock: (blockId: string) => void;
  onAddBlock: (type: CourseBlockType, atIndex?: number) => void;
  dropIndex?: number | null;
}

/* ─── Main Component ──────────────────────────────────────────────── */

export function ActivityList({
  blocks, lessonTitle, onSelectBlock, onAddBlock, dropIndex,
}: ActivityListProps) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas-drop" });
  const sections = useMemo(() => partitionSections(blocks), [blocks]);

  // Compute global index for each block across sections
  let globalIdx = 0;
  const sectionData = sections.map((section) => {
    const items = section.blocks.map((block) => {
      const idx = globalIdx;
      globalIdx++;
      return { block, globalIndex: idx };
    });
    return { section, items };
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-full flex-1 overflow-y-auto transition",
        isOver && "bg-accent/20",
      )}
    >
      <div className="mx-auto max-w-3xl px-6 py-6">
        {/* Lesson title */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground">{lessonTitle}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {blocks.length} hoạt động • Bấm vào hoạt động để chỉnh sửa
          </p>
        </div>

        {blocks.length === 0 ? (
          <EmptyState onAdd={() => onAddBlock("text", 0)} />
        ) : (
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            {sectionData.map((sd, sectionIdx) => (
              <SectionGroup
                key={sectionIdx}
                sectionIndex={sectionIdx}
                sectionTitle={sd.section.title}
                items={sd.items}
                onSelectBlock={onSelectBlock}
                onAddBlock={onAddBlock}
                dropIndex={dropIndex}
                totalSections={sectionData.length}
              />
            ))}
          </SortableContext>
        )}

        {/* Bottom add buttons */}
        {blocks.length > 0 && (
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => onAddBlock("text")}
              className="flex items-center gap-2 rounded-[var(--builder-radius)] border-2 border-dashed border-border px-4 py-3 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:bg-accent hover:text-primary"
            >
              <Plus className="h-4 w-4" /> Thêm hoạt động
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-[var(--builder-radius)] border-2 border-dashed border-violet-200 px-4 py-3 text-xs font-medium text-violet-500 transition hover:border-violet-400 hover:bg-violet-50"
            >
              <Sparkles className="h-4 w-4" /> Tạo bằng AI
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Section Group ───────────────────────────────────────────────── */

function SectionGroup({
  sectionIndex, sectionTitle, items, onSelectBlock, onAddBlock, dropIndex, totalSections,
}: {
  sectionIndex: number;
  sectionTitle: string | null;
  items: { block: CourseBlock; globalIndex: number }[];
  onSelectBlock: (id: string) => void;
  onAddBlock: (type: CourseBlockType, atIndex?: number) => void;
  dropIndex?: number | null;
  totalSections: number;
}) {
  const showNumber = totalSections > 1 || sectionTitle;
  const displayNum = String(sectionIndex + 1).padStart(2, "0");

  return (
    <div className="mb-8">
      {/* Section header */}
      {showNumber && (
        <div className="mb-3 flex items-start gap-3">
          <span className="flex h-[var(--activity-number-size)] w-[var(--activity-number-size)] shrink-0 items-center justify-center text-2xl font-bold text-foreground/20">
            {displayNum}
          </span>
          <div className="pt-2">
            <h3 className="text-base font-bold text-foreground">
              {sectionTitle || `Phần ${sectionIndex + 1}`}
            </h3>
          </div>
        </div>
      )}

      {/* Activities */}
      <div className="space-y-1 pl-0">
        {items.map(({ block, globalIndex }) => (
          <div key={block.id}>
            {dropIndex === globalIndex && <DropIndicator />}
            <ActivityRow
              block={block}
              index={globalIndex}
              onClick={() => onSelectBlock(block.id)}
            />
          </div>
        ))}
        {items.length > 0 && dropIndex === items[items.length - 1].globalIndex + 1 && (
          <DropIndicator />
        )}
      </div>
    </div>
  );
}

/* ─── Activity Row ────────────────────────────────────────────────── */

function ActivityRow({
  block, index, onClick,
}: {
  block: CourseBlock;
  index: number;
  onClick: () => void;
}) {
  const { setNodeRef, listeners, attributes, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { source: "block" },
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const Icon = ICON_MAP[block.type] || Type;
  const meta = BLOCK_TYPES.find((b) => b.type === block.type);
  const preview = getActivityPreview(block);
  const metaText = getActivityMeta(block);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className={cn(
        "group relative flex cursor-pointer items-center gap-3 rounded-[var(--builder-radius-sm)] border border-transparent px-3 py-2.5 transition-all",
        "hover:border-border hover:bg-card hover:shadow-[var(--builder-shadow)]",
        isDragging && "z-50 opacity-50 shadow-lg",
      )}
    >
      {/* Drag handle */}
      <div
        {...listeners}
        {...attributes}
        onClick={(e) => e.stopPropagation()}
        className="flex h-6 w-6 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground/0 transition group-hover:text-muted-foreground"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>

      {/* Icon */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--builder-radius-sm)]"
        style={{
          backgroundColor: `color-mix(in srgb, ${meta?.color ?? "var(--colors-brand-600)"} 12%, transparent)`,
          color: meta?.color ?? "var(--colors-brand-600)",
        }}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {preview}
        </p>
        {metaText && (
          <p className="text-[11px] text-muted-foreground">{metaText}</p>
        )}
      </div>

      {/* Badge */}
      <span
        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium opacity-0 transition group-hover:opacity-100"
        style={{
          backgroundColor: `color-mix(in srgb, ${meta?.color ?? "var(--colors-brand-600)"} 10%, transparent)`,
          color: meta?.color ?? "var(--colors-brand-600)",
        }}
      >
        {index + 1} · {BLOCK_LABELS[block.type] || block.type}
      </span>

      {/* AI badge */}
      {block.aiGenerated && (
        <span className="flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-600">
          <Sparkles className="h-2.5 w-2.5" /> AI
        </span>
      )}
    </motion.div>
  );
}

/* ─── Drop Indicator ──────────────────────────────────────────────── */

function DropIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-0.5" aria-hidden>
      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
      <div className="h-0.5 flex-1 rounded-full bg-primary" />
      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
    </div>
  );
}

/* ─── Empty State ─────────────────────────────────────────────────── */

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-[var(--builder-radius-lg)] border-2 border-dashed border-border/50 bg-card py-16 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50">
        <Move className="h-7 w-7 text-primary" />
      </div>
      <div className="mt-4 text-base font-semibold text-foreground">Bài học trống</div>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Kéo block từ bên trái, dùng AI, hoặc thêm thủ công
      </p>
      <div className="mt-5 flex gap-3">
        <button
          onClick={onAdd}
          className="flex items-center gap-2 rounded-[var(--builder-radius)] bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> Thêm hoạt động
        </button>
        <button
          className="flex items-center gap-2 rounded-[var(--builder-radius)] border-2 border-violet-200 px-4 py-2.5 text-sm font-medium text-violet-600 transition hover:bg-violet-50"
        >
          <Sparkles className="h-4 w-4" /> Tạo bằng AI
        </button>
      </div>
    </motion.div>
  );
}
