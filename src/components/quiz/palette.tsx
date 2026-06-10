import { useState } from "react";
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
  FileText,
  BookOpen,
  Image as ImageIcon,
  Music,
  Box,
  GraduationCap,
  Sparkles,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { QuestionType } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ─── Data ──────────────────────────────────────────────────────── */

type QuestionItem = { type: QuestionType; label: string; icon: LucideIcon };
type MaterialItem = { id: string; label: string; icon: LucideIcon };

const QUESTION_TYPES: QuestionItem[] = [
  { type: "multiple_choice", label: "Trắc nghiệm", icon: Grid3x3 },
  { type: "essay", label: "Tự luận", icon: AlignLeft },
  { type: "matching", label: "Ghép đôi", icon: ArrowLeftRight },
  { type: "dropbox", label: "Hộp thả", icon: PackageOpen },
  { type: "drag_drop", label: "Kéo thả", icon: Hand },
  { type: "ordering", label: "Sắp xếp", icon: ListOrdered },
  { type: "video", label: "Trả lời video", icon: Video },
  { type: "audio", label: "Trả lời ghi âm", icon: Mic },
  { type: "recognition", label: "Nhận dạng", icon: ScanSearch },
  { type: "marker", label: "Điểm đánh dấu", icon: MapPin },
];

const MATERIAL_TYPES: MaterialItem[] = [
  { id: "quiz", label: "Bộ đề", icon: FileText },
  { id: "lesson", label: "Bài giảng", icon: GraduationCap },
  { id: "image", label: "Hình ảnh", icon: ImageIcon },
  { id: "video", label: "Video", icon: Video },
  { id: "audio", label: "Âm thanh", icon: Music },
  { id: "3d", label: "3D", icon: Box },
  { id: "advanced", label: "Học liệu nâng cao", icon: Sparkles },
];

/* ─── Rail Tab definitions ──────────────────────────────────────── */

type RailTab = "questions" | "materials" | "settings" | "upload" | null;

interface RailTabItem {
  id: RailTab;
  icon: LucideIcon;
  label: string;
  hasPanel: boolean;
}

const RAIL_TABS: RailTabItem[] = [
  { id: "questions", icon: FileText, label: "Câu hỏi", hasPanel: true },
  { id: "materials", icon: BookOpen, label: "Học liệu", hasPanel: true },
  { id: "settings", icon: Settings, label: "Thiết lập", hasPanel: true },
  { id: "upload", icon: ScanSearch, label: "AI OCR", hasPanel: false },
];

/* ─── Main Export ────────────────────────────────────────────────── */

export function QuizSidebar({
  onAddQuestion,
  onOpenSettings,
}: {
  onAddQuestion: (type: QuestionType) => void;
  onOpenSettings?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<RailTab>("questions");

  const handleTabClick = (tab: RailTabItem) => {
    if (tab.id === "upload") {
      toast.info("AI OCR — Quét tài liệu và tạo câu hỏi tự động (demo)");
      return;
    }
    if (tab.id === "settings") {
      onOpenSettings?.();
      return;
    }
    setActiveTab((cur) => (cur === tab.id ? null : tab.id));
  };

  const panelOpen = activeTab === "questions" || activeTab === "materials";

  return (
    <div className="flex h-full">
      {/* Icon Rail — always visible, 48px */}
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

      {/* Expandable Panel — 220px, animated */}
      <div
        className={cn(
          "shrink-0 overflow-hidden border-r border-border bg-sidebar transition-all duration-200",
          panelOpen ? "w-[220px]" : "w-0 border-r-0",
        )}
      >
        <div className="h-full w-[220px] overflow-y-auto">
          {activeTab === "questions" && (
            <QuestionsPanel onAddQuestion={onAddQuestion} />
          )}
          {activeTab === "materials" && <MaterialsPanel />}
        </div>
      </div>
    </div>
  );
}

/* ─── Questions Panel ───────────────────────────────────────────── */

function QuestionsPanel({ onAddQuestion }: { onAddQuestion: (type: QuestionType) => void }) {
  return (
    <div className="space-y-1 p-3">
      <div className="px-1 pb-2">
        <h3 className="text-xs font-semibold text-[#2563EB]">Các loại câu hỏi</h3>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {QUESTION_TYPES.map((item) => (
          <DraggableQuestionItem key={item.type} item={item} onAdd={onAddQuestion} />
        ))}
      </div>
      <div className="mt-3 rounded-md border border-dashed border-border p-2.5 text-center text-[11px] text-muted-foreground">
        ✦ Kéo loại câu hỏi vào canvas
      </div>
    </div>
  );
}

function DraggableQuestionItem({
  item,
  onAdd,
}: {
  item: QuestionItem;
  onAdd: (type: QuestionType) => void;
}) {
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
      onClick={() => onAdd(item.type)}
      className={cn(
        "flex flex-col items-center gap-1 rounded-lg border border-border bg-card p-2.5 text-center text-[11px] font-medium text-foreground transition",
        "hover:border-[#2563EB] hover:bg-[#EFF6FF] active:scale-95",
        isDragging && "opacity-40",
      )}
    >
      <Icon className="h-5 w-5 text-[#2563EB]" />
      <span className="leading-tight">{item.label}</span>
    </button>
  );
}

/* ─── Materials Panel ───────────────────────────────────────────── */

function MaterialsPanel() {
  return (
    <div className="space-y-1 p-3">
      <div className="px-1 pb-2">
        <h3 className="text-xs font-semibold text-[#2563EB]">Các loại học liệu</h3>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {MATERIAL_TYPES.map((item) => (
          <MaterialCard key={item.id} item={item} />
        ))}
      </div>
      <div className="mt-3 rounded-md border border-dashed border-border p-2.5 text-center text-[11px] text-muted-foreground">
        ✦ Kéo học liệu vào đề bài
      </div>
    </div>
  );
}

function MaterialCard({ item }: { item: MaterialItem }) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: `material-${item.id}`,
    data: { source: "material", materialType: item.id },
  });
  const Icon = item.icon;
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => toast.info(`Chèn ${item.label} vào câu hỏi đang chọn (demo)`)}
      className={cn(
        "flex flex-col items-center gap-1 rounded-lg border border-border bg-card p-2.5 text-center text-[11px] font-medium text-foreground transition",
        "hover:border-[#10B981] hover:bg-emerald-50 active:scale-95",
        isDragging && "opacity-40",
      )}
    >
      <Icon className="h-5 w-5 text-[#10B981]" />
      <span className="leading-tight">{item.label}</span>
    </button>
  );
}
