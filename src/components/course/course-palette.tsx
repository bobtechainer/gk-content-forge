import { useState, useRef, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import {
  Type,
  ImageIcon,
  VideoIcon,
  MessageSquare,
  Minus,
  Link2,
  Code2,
  Sigma,
  Columns2,
  ListChecks,
  Boxes,
  SplitSquareVertical,
  BookOpen,
  Search,
  Layers,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ContentItem, LearningMaterialSubtype, MaterialType } from "@/lib/types";
import type { CourseBlockType } from "@/stores/course";
import {
  LEARNING_MATERIAL_TYPES,
  MATERIAL_TYPE_ICONS,
  MATERIAL_TYPE_LABELS,
} from "@/lib/taxonomy";
import { MATERIAL_TYPE_ACCENT } from "@/components/shared/material-type-icon";
import { useContent } from "@/stores/content";
import { useSession } from "@/stores/session";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

/* ─── Block type data ──────────────────────────────────────────── */

export interface BlockItem {
  type: CourseBlockType;
  label: string;
  icon: LucideIcon;
  color: string;
}

export const BLOCK_TYPES: BlockItem[] = [
  { type: "text", label: "Văn bản", icon: Type, color: "#2563EB" },
  { type: "image", label: "Hình ảnh", icon: ImageIcon, color: "#059669" },
  { type: "video", label: "Video", icon: VideoIcon, color: "#DC2626" },
  { type: "callout", label: "Callout", icon: MessageSquare, color: "#D97706" },
  { type: "divider", label: "Phân cách", icon: Minus, color: "#6B7280" },
  { type: "section", label: "Phần mới", icon: SplitSquareVertical, color: "#0EA5E9" },
  { type: "embed", label: "Học liệu", icon: Link2, color: "#10B981" },
  { type: "html", label: "HTML / Tương tác", icon: Boxes, color: "#EC4899" },
  { type: "code", label: "Code", icon: Code2, color: "#7C3AED" },
  { type: "math", label: "Công thức", icon: Sigma, color: "#0891B2" },
  { type: "columns", label: "Nhiều cột", icon: Columns2, color: "#8B5CF6" },
  { type: "quiz", label: "Câu hỏi", icon: ListChecks, color: "#F59E0B" },
];

/* ─── Rail Tab definitions ──────────────────────────────────────── */

type RailTab = "blocks" | "materials" | null;

interface RailTabDef {
  id: RailTab;
  icon: LucideIcon;
  label: string;
}

const RAIL_TABS: RailTabDef[] = [
  { id: "blocks", icon: Layers, label: "Blocks" },
  { id: "materials", icon: BookOpen, label: "Học liệu" },
];

/* ─── Main Export ────────────────────────────────────────────────── */

export function CoursePalette({
  onAddBlock,
  onAttachMaterial,
}: {
  onAddBlock: (type: CourseBlockType) => void;
  onAttachMaterial: (item: ContentItem) => void;
}) {
  const [activeTab, setActiveTab] = useState<RailTab>("blocks");

  const handleTabClick = (tab: RailTabDef) => {
    setActiveTab((cur) => (cur === tab.id ? null : tab.id));
  };

  const panelOpen = activeTab !== null;

  return (
    <div className="flex h-full">
      {/* Icon Rail — always visible */}
      <div className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-border bg-sidebar py-2">
        {RAIL_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab)}
              aria-label={tab.label}
              aria-pressed={isActive}
              className={cn(
                "flex h-10 w-10 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-medium transition",
                isActive
                  ? "bg-[#2563EB]/10 text-[#2563EB]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4.5 w-4.5" />
            </button>
          );
        })}
      </div>

      {/* Expandable Panel */}
      <div
        className={cn(
          "shrink-0 overflow-hidden border-r border-border bg-sidebar transition-all duration-200",
          panelOpen ? "w-[260px]" : "w-0 border-r-0",
        )}
      >
        <div className="h-full w-[260px] overflow-y-auto">
          {activeTab === "blocks" && <BlocksPanel onAddBlock={onAddBlock} />}
          {activeTab === "materials" && <MaterialPanel onAttach={onAttachMaterial} />}
        </div>
      </div>
    </div>
  );
}

/* ─── Blocks Panel ─────────────────────────────────────────────── */

function BlocksPanel({ onAddBlock }: { onAddBlock: (type: CourseBlockType) => void }) {
  return (
    <div className="space-y-1 p-3">
      <div className="px-1 pb-2">
        <h3 className="text-xs font-semibold text-[#2563EB]">Khối nội dung</h3>
        <p className="mt-0.5 text-[10px] text-muted-foreground">Kéo hoặc bấm để thêm vào bài</p>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {BLOCK_TYPES.map((item) => (
          <DraggableBlockItem key={item.type} item={item} onAdd={onAddBlock} />
        ))}
      </div>
      <div className="mt-3 rounded-md border border-dashed border-border p-2.5 text-center text-[11px] text-muted-foreground">
        ✦ Kéo block vào canvas hoặc gõ <kbd className="rounded bg-muted px-1 font-mono text-[10px]">/</kbd> trong bài
      </div>
    </div>
  );
}

function DraggableBlockItem({
  item,
  onAdd,
}: {
  item: BlockItem;
  onAdd: (type: CourseBlockType) => void;
}) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: `block-${item.type}`,
    data: { source: "palette", blockType: item.type },
  });
  const Icon = item.icon;
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onAdd(item.type)}
      className={cn(
        "flex flex-col items-center gap-1 rounded-lg border border-border bg-card p-2.5 text-center text-[11px] font-medium text-foreground transition",
        "hover:border-[#2563EB] hover:bg-[#EFF6FF] active:scale-95",
        isDragging && "opacity-40",
      )}
    >
      <Icon className="h-5 w-5" style={{ color: item.color }} />
      <span className="leading-tight">{item.label}</span>
    </button>
  );
}

/* ─── Material Panel ───────────────────────────────────────────── */

function MaterialPanel({ onAttach }: { onAttach: (item: ContentItem) => void }) {
  const items = useContent((s) => s.items);
  const roleId = useSession((s) => s.roleId);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<LearningMaterialSubtype | null>(null);

  const library = useMemo(
    () =>
      items.filter(
        (i) =>
          i.category === "learning_material" &&
          (i.ownerId === roleId || i.status === "published"),
      ),
    [items, roleId],
  );

  const availableSubtypes = useMemo(() => {
    const present = new Set(library.map((i) => i.materialSubtype).filter(Boolean));
    return LEARNING_MATERIAL_TYPES.filter((t) => present.has(t));
  }, [library]);

  const filtered = useMemo(
    () =>
      library.filter((i) => {
        if (typeFilter && i.materialSubtype !== typeFilter) return false;
        if (query) {
          const q = query.toLowerCase();
          return (
            i.title.toLowerCase().includes(q) ||
            i.subject.toLowerCase().includes(q) ||
            i.tags.some((t) => t.toLowerCase().includes(q))
          );
        }
        return true;
      }),
    [library, typeFilter, query],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2 p-3 pb-2">
        <h3 className="px-1 text-xs font-semibold text-[#10B981]">Kho học liệu</h3>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm học liệu…"
            className="h-8 pl-8 text-xs"
          />
        </div>
        {availableSubtypes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <FilterChip active={typeFilter === null} onClick={() => setTypeFilter(null)}>
              Tất cả
            </FilterChip>
            {availableSubtypes.map((t) => (
              <FilterChip
                key={t}
                active={typeFilter === t}
                onClick={() => setTypeFilter((cur) => (cur === t ? null : t))}
              >
                {MATERIAL_TYPE_LABELS[t]}
              </FilterChip>
            ))}
          </div>
        )}
      </div>
      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 pb-2">
        {filtered.length === 0 ? (
          <p className="px-1 py-6 text-center text-[11px] text-muted-foreground">
            Không tìm thấy học liệu phù hợp.
          </p>
        ) : (
          filtered.map((item) => <MaterialRow key={item.id} item={item} onAttach={onAttach} />)
        )}
      </div>
      <div className="border-t border-border p-3">
        <div className="rounded-md border border-dashed border-border p-2.5 text-center text-[11px] text-muted-foreground">
          ✦ Kéo học liệu vào bài học
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-medium transition",
        active
          ? "border-[#10B981] bg-[#10B981] text-white"
          : "border-border bg-card text-muted-foreground hover:border-muted-foreground/40",
      )}
    >
      {children}
    </button>
  );
}

function MaterialRow({ item, onAttach }: { item: ContentItem; onAttach: (item: ContentItem) => void }) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: `material-${item.id}`,
    data: { source: "material", item },
  });
  const type = (item.materialSubtype ?? "document") as MaterialType;
  const Icon = MATERIAL_TYPE_ICONS[type];
  const accent = MATERIAL_TYPE_ACCENT[type];
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onAttach(item)}
      title={item.title}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg border border-border bg-card p-2 text-left transition",
        "hover:border-[#10B981] hover:bg-emerald-50 active:scale-[0.98]",
        isDragging && "opacity-40",
      )}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: `${accent}1A`, color: accent }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11px] font-medium text-foreground">{item.title}</span>
        <span className="block truncate text-[10px] text-muted-foreground">
          {MATERIAL_TYPE_LABELS[type]} • {item.subject}
        </span>
      </span>
    </button>
  );
}
