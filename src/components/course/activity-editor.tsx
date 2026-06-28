import { useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight } from "lucide-react";
import type { CourseBlock } from "@/stores/course";
import { BlockCard } from "./block-card";
import { BLOCK_TYPES } from "./course-palette";
import { cn } from "@/lib/utils";

/* ─── Props ─────────────────────────────────────────────────────── */

interface ActivityEditorProps {
  block: CourseBlock;
  blockIndex: number;
  lessonTitle: string;
  onBack: () => void;
  onUpdate: (patch: Partial<CourseBlock>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

/* ─── Component ─────────────────────────────────────────────────── */

export function ActivityEditor({
  block,
  blockIndex,
  lessonTitle,
  onBack,
  onUpdate,
  onDelete,
  onDuplicate,
}: ActivityEditorProps) {
  const blockMeta = BLOCK_TYPES.find((b) => b.type === block.type);
  const blockLabel = blockMeta?.label ?? block.type;

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") onBack();
  }, [onBack]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="flex h-full flex-col"
      onKeyDown={handleKeyDown}
    >
      {/* Breadcrumb header */}
      <div className="flex items-center gap-2 border-b bg-card px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className={cn(
            "flex items-center gap-1.5 rounded-[var(--builder-radius-sm)] px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition",
            "hover:bg-accent hover:text-foreground",
          )}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Quay lại</span>
        </button>

        <ChevronRight className="h-3 w-3 text-muted-foreground/50" />

        <span className="text-xs text-muted-foreground truncate max-w-[120px]">
          {lessonTitle}
        </span>

        <ChevronRight className="h-3 w-3 text-muted-foreground/50" />

        <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <span
            className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white"
            style={{ backgroundColor: blockMeta?.color ?? "var(--colors-brand-600)" }}
          >
            {blockIndex + 1}
          </span>
          {blockLabel}
        </span>
      </div>

      {/* Full block editor */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <BlockCard
            block={block}
            isActive={true}
            onSelect={() => {}}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
          />
        </div>
      </div>
    </motion.div>
  );
}
