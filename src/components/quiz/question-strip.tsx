import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { GripVertical, Plus } from "lucide-react";
import type { Question } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE_SHORT: Record<Question["type"], string> = {
  multiple_choice: "TN",
  essay: "TL",
  matching: "GĐ",
  dropbox: "HT",
  drag_drop: "KT",
  ordering: "SX",
  video: "VD",
  audio: "AM",
  recognition: "ND",
  marker: "ĐD",
};

const TYPE_COLOR: Record<Question["type"], string> = {
  multiple_choice: "#2563EB",
  essay: "#7C3AED",
  matching: "#0891B2",
  dropbox: "#D97706",
  drag_drop: "#059669",
  ordering: "#DC2626",
  video: "#DB2777",
  audio: "#9333EA",
  recognition: "#0D9488",
  marker: "#EA580C",
};

export function QuestionStrip({
  questions,
  activeIndex,
  blankIds,
  onSelect,
  onAdd,
}: {
  questions: Question[];
  activeIndex: number;
  blankIds: Set<string>;
  onSelect: (index: number) => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex h-[76px] shrink-0 items-center gap-2 border-t border-border bg-card px-4 overflow-x-auto [scrollbar-width:thin]">
      <SortableContext items={questions.map((q) => q.id)} strategy={horizontalListSortingStrategy}>
        {questions.map((q, i) => (
          <SortableStripItem
            key={q.id}
            question={q}
            index={i}
            isActive={i === activeIndex}
            isBlank={blankIds.has(q.id)}
            onSelect={() => onSelect(i)}
          />
        ))}
      </SortableContext>

      {/* Add button */}
      <button
        type="button"
        onClick={onAdd}
        className="flex h-[56px] w-[84px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition hover:border-[#2563EB] hover:bg-[#EFF6FF] hover:text-[#2563EB]"
      >
        <Plus className="h-5 w-5" />
        <span className="text-[10px] font-medium">Thêm</span>
      </button>
    </div>
  );
}

function SortableStripItem({
  question,
  index,
  isActive,
  isBlank,
  onSelect,
}: {
  question: Question;
  index: number;
  isActive: boolean;
  isBlank: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
    data: { source: "strip", questionId: question.id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const color = TYPE_COLOR[question.type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex h-[56px] w-[84px] shrink-0 cursor-pointer select-none flex-col items-center justify-center rounded-lg border-2 bg-card transition",
        isActive
          ? "border-[#2563EB] shadow-md shadow-[#2563EB]/20"
          : "border-border hover:border-muted-foreground/50",
        isDragging && "z-50 opacity-60",
      )}
      onClick={onSelect}
    >
      {/* Drag handle — top-right, visible on hover */}
      <div
        {...listeners}
        {...attributes}
        className="absolute -top-1 -right-1 z-10 hidden h-5 w-5 cursor-grab items-center justify-center rounded bg-muted text-muted-foreground shadow-sm group-hover:flex"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-3 w-3" />
      </div>

      {isBlank ? (
        <>
          <div className="flex h-6 w-6 items-center justify-center rounded border-2 border-dashed border-muted-foreground/40">
            <Plus className="h-3 w-3 text-muted-foreground/60" />
          </div>
          <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">Trống</span>
        </>
      ) : (
        <>
          <span
            className="flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {TYPE_SHORT[question.type]}
          </span>
          <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">
            Câu {index + 1}
          </span>
        </>
      )}

      {/* Active dot */}
      {isActive && (
        <span className="absolute -bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#2563EB]" />
      )}
    </div>
  );
}
