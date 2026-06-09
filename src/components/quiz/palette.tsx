import { useDraggable } from "@dnd-kit/core";
import {
  Grid3x3,
  AlignLeft,
  ArrowLeftRight,
  PackageOpen,
  Hand,
  ListOrdered,
  Video,
  Mic,
  ScanSearch,
  MapPin,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { QuestionType } from "@/lib/types";

type Item = { type: QuestionType; label: string; icon: LucideIcon };

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "Trắc nghiệm",
    items: [
      { type: "multiple_choice", label: "Trắc nghiệm", icon: Grid3x3 },
      { type: "essay", label: "Tự luận", icon: AlignLeft },
    ],
  },
  {
    title: "Tương tác",
    items: [
      { type: "matching", label: "Ghép đôi", icon: ArrowLeftRight },
      { type: "dropbox", label: "Hộp thả", icon: PackageOpen },
      { type: "drag_drop", label: "Kéo thả", icon: Hand },
      { type: "ordering", label: "Sắp xếp", icon: ListOrdered },
    ],
  },
  {
    title: "Đa phương tiện",
    items: [
      { type: "video", label: "Trả lời video", icon: Video },
      { type: "audio", label: "Trả lời ghi âm", icon: Mic },
    ],
  },
  {
    title: "Nâng cao",
    items: [
      { type: "recognition", label: "Nhận dạng", icon: ScanSearch },
      { type: "marker", label: "Điểm đánh dấu", icon: MapPin },
    ],
  },
];

function PaletteItem({ item }: { item: Item }) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: { source: "palette", questionType: item.type },
  });
  const Icon = item.icon;
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex flex-col items-center gap-1.5 rounded-md border border-border bg-card p-3 text-center text-xs font-medium text-foreground transition hover:border-[#2563EB] hover:bg-[#EFF6FF] active:scale-95 ${isDragging ? "opacity-40" : ""}`}
    >
      <Icon className="h-5 w-5 text-[#2563EB]" />
      <span className="leading-tight">{item.label}</span>
    </button>
  );
}

export function QuestionPalette({ isDragActive }: { isDragActive: boolean }) {
  return (
    <div className={`flex h-full flex-col gap-4 overflow-y-auto border-r border-border bg-sidebar p-4 transition ${isDragActive ? "ring-2 ring-inset ring-[#2563EB]/40" : ""}`}>
      <div>
        <h3 className="text-sm font-semibold text-foreground">Các loại câu hỏi</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Kéo thả vào canvas</p>
      </div>
      {GROUPS.map((g) => (
        <div key={g.title}>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {g.title}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {g.items.map((it) => (
              <PaletteItem key={it.type} item={it} />
            ))}
          </div>
        </div>
      ))}
      <div className="mt-auto rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
        + Kéo loại câu hỏi vào canvas
      </div>
    </div>
  );
}