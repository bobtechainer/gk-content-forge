import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Plus, Move, Lock, CheckCircle2, ArrowRight } from "lucide-react";
import type { CourseBlock, CourseBlockType, LessonSection } from "@/stores/course";
import { partitionSections } from "@/stores/course";
import { viewportMaxWidth, type Viewport } from "@/lib/preview/viewport";
import { BlockCard } from "./block-card";
import { BLOCK_TYPES } from "./course-palette";
import { LayoutWrapper } from "@/components/blocks/block-views";
import { BlockRenderer } from "@/components/blocks/block-renderer";
import { cn } from "@/lib/utils";
import { useCourseTheme } from "@/stores/course-theme";
import { getResolvedThemeVars } from "@/lib/theme/resolve";

/* ─── Scroll-reveal wrapper ────────────────────────────────────── */

function ScrollReveal({ children, animation, disabled }: { children: React.ReactNode; animation?: string; disabled?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  if (disabled) return <>{children}</>;

  const variants: Record<string, { hidden: Record<string, number>; visible: Record<string, number> }> = {
    "fade-up": { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } },
    parallax: { hidden: { opacity: 0, y: 40, scale: 0.97 }, visible: { opacity: 1, y: 0, scale: 1 } },
    progressive: { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } },
    none: { hidden: { opacity: 1 }, visible: { opacity: 1 } },
  };

  const v = variants[animation ?? "fade-up"] ?? variants["fade-up"];

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={v}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Gated Journey Preview ─────────────────────────────────────────
 * The learner's real experience: parts are revealed one at a time, and the
 * next part stays locked until every quiz in the current part is answered
 * correctly. With no section markers it falls back to a single open part.
 * ────────────────────────────────────────────────────────────────── */

function sectionQuizIds(section: LessonSection): string[] {
  return section.blocks.filter((b) => b.type === "quiz").map((b) => b.id);
}

function PreviewJourney({ blocks, lessonTitle, viewport, themeVars }: { blocks: CourseBlock[]; lessonTitle: string; viewport?: Viewport; themeVars?: React.CSSProperties }) {
  const sections = useMemo(() => partitionSections(blocks), [blocks]);
  const [unlockedUpTo, setUnlockedUpTo] = useState(0);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Restart the journey whenever the lesson content changes.
  useEffect(() => { setUnlockedUpTo(0); setResults({}); }, [blocks]);

  // Bring a freshly unlocked part into view so the new content animates in.
  useEffect(() => {
    if (unlockedUpTo === 0) return;
    sectionRefs.current[unlockedUpTo]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [unlockedUpTo]);

  const isComplete = (i: number) => sectionQuizIds(sections[i]).every((id) => results[id]);
  const hasGate = sections.length > 1;

  return (
    <div className="min-h-full bg-white" data-course-theme style={themeVars}>
      <div className={cn("mx-auto w-full px-4 py-10 sm:px-6 lg:px-10", viewport ? viewportMaxWidth(viewport) : "max-w-6xl")}>
        <div className="mx-auto mb-8 max-w-2xl">
          <h1 className="text-2xl font-bold text-foreground">{lessonTitle}</h1>
          {hasGate && (
            <p className="mt-1 text-sm text-muted-foreground">
              Phần {Math.min(unlockedUpTo + 1, sections.length)} / {sections.length}
            </p>
          )}
        </div>

        {sections.map((section, i) => {
          if (i > unlockedUpTo) return null;
          const quizIds = sectionQuizIds(section);
          const answered = quizIds.filter((id) => results[id]).length;
          const complete = answered === quizIds.length;
          const isCurrent = i === unlockedUpTo;
          const isLast = i === sections.length - 1;
          return (
            <div key={i} ref={(el) => { sectionRefs.current[i] = el; }} className="mb-10 scroll-mt-6">
              {section.title && (
                <div className="mx-auto mb-5 max-w-2xl">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <h2 className="text-lg font-bold text-foreground">{section.title}</h2>
                  </div>
                </div>
              )}
              <div className="space-y-6">
                {section.blocks.map((block) => (
                  <ScrollReveal key={block.id} animation={block.animation}>
                    <BlockRenderer
                      block={block}
                      mode="preview"
                      onQuizResult={
                        block.type === "quiz"
                          ? (correct) => setResults((r) => ({ ...r, [block.id]: correct }))
                          : undefined
                      }
                    />
                  </ScrollReveal>
                ))}
              </div>

              {hasGate && !isCurrent && (
                <div className="mx-auto mt-6 flex max-w-2xl items-center gap-1.5 text-xs font-medium text-callout-tip-fg">
                  <CheckCircle2 className="h-4 w-4" /> Đã hoàn thành phần này
                </div>
              )}
              {hasGate && isCurrent && !isLast && (
                <div className="mx-auto mt-6 max-w-2xl">
                  <SectionGate
                    complete={complete}
                    answered={answered}
                    total={quizIds.length}
                    onContinue={() => setUnlockedUpTo((u) => u + 1)}
                  />
                </div>
              )}
              {hasGate && isCurrent && isLast && complete && (
                <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-callout-tip-line bg-callout-tip p-5 text-center">
                  <p className="text-base font-bold text-callout-tip-fg">Hoàn thành bài học</p>
                  <p className="mt-1 text-sm text-callout-tip-fg">
                    Em đã đi hết hành trình và trả lời đúng các câu hỏi. Làm tốt lắm!
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionGate({
  complete, answered, total, onContinue,
}: { complete: boolean; answered: number; total: number; onContinue: () => void }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      {total > 0 && !complete && (
        <p className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" /> Trả lời đúng hết câu hỏi để mở phần sau ({answered}/{total})
        </p>
      )}
      <button
        type="button"
        disabled={!complete}
        onClick={onContinue}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition",
          complete
            ? "bg-primary text-white hover:bg-primary-hover active:scale-[0.99]"
            : "cursor-not-allowed bg-muted text-muted-foreground",
        )}
      >
        Tiếp tục phần sau <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ─── Slash Command Menu ───────────────────────────────────────── */

function SlashMenu({ onSelect, onClose }: { onSelect: (type: CourseBlockType) => void; onClose: () => void }) {
  const [filter, setFilter] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handleClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => { document.removeEventListener("mousedown", handleClick); document.removeEventListener("keydown", handleKey); };
  }, [onClose]);

  const filtered = BLOCK_TYPES.filter((b) =>
    b.label.toLowerCase().includes(filter.toLowerCase()) || b.type.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.15 }}
      className="z-50 w-[220px] rounded-xl border bg-card p-1.5 shadow-xl">
      <input ref={inputRef} value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Tìm block..."
        className="mb-1 w-full rounded-lg bg-muted/50 px-3 py-2 text-xs outline-none" />
      <div className="max-h-[240px] overflow-y-auto">
        {filtered.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.type} onClick={() => { onSelect(item.type); onClose(); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs transition hover:bg-muted">
              <Icon className="h-4 w-4 shrink-0" style={{ color: item.color }} />
              <span className="font-medium text-foreground">{item.label}</span>
            </button>
          );
        })}
        {filtered.length === 0 && <p className="px-3 py-4 text-center text-[11px] text-muted-foreground">Không tìm thấy</p>}
      </div>
    </motion.div>
  );
}

/* ─── Insert Button ────────────────────────────────────────────── */

function InsertButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="group flex items-center justify-center py-0.5">
      <div className="h-px flex-1 bg-transparent transition group-hover:bg-border/50" />
      <button type="button" onClick={onClick}
        className="flex h-5 w-5 items-center justify-center rounded-full border border-transparent text-muted-foreground/0 transition group-hover:border-border group-hover:bg-card group-hover:text-muted-foreground group-hover:shadow-sm hover:!border-primary hover:!text-primary">
        <Plus className="h-3 w-3" />
      </button>
      <div className="h-px flex-1 bg-transparent transition group-hover:bg-border/50" />
    </div>
  );
}

/* ─── Drag insertion indicator ─────────────────────────────────── */

function DropIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-1" aria-hidden>
      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
      <div className="h-0.5 flex-1 rounded-full bg-primary" />
      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
    </div>
  );
}

/* ─── Main Canvas ──────────────────────────────────────────────── */

interface PageCanvasProps {
  blocks: CourseBlock[];
  activeBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onAddBlock: (type: CourseBlockType, atIndex?: number) => void;
  onUpdateBlock: (blockId: string, patch: Partial<CourseBlock>) => void;
  onDeleteBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  lessonTitle: string;
  previewMode?: boolean;
  /** Live insertion index while dragging (0..blocks.length), or null when not dragging over the canvas. */
  dropIndex?: number | null;
  /** Active viewport for preview max-width constraint. Ephemeral — not persisted. */
  viewport?: Viewport;
  /** Course ID used to read the per-course theme. */
  courseId?: string;
}

export function PageCanvas({
  blocks, activeBlockId, onSelectBlock, onAddBlock, onUpdateBlock, onDeleteBlock, onDuplicateBlock, lessonTitle, previewMode, dropIndex, viewport, courseId,
}: PageCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas-drop" });
  const [slashMenu, setSlashMenu] = useState<{ index: number } | null>(null);
  const courseTheme = useCourseTheme((s) => courseId ? s.byCourse[courseId] : undefined);
  const themeVars = getResolvedThemeVars(courseTheme) as React.CSSProperties;

  const handleSlashCommand = useCallback((index: number) => setSlashMenu({ index }), []);
  const handleSlashSelect = useCallback((type: CourseBlockType) => {
    if (slashMenu !== null) { onAddBlock(type, slashMenu.index); setSlashMenu(null); }
  }, [slashMenu, onAddBlock]);

  // Slash command: pressing "/" outside any text field opens the block menu
  // (spec §5: "gõ `/` hiện menu block types"). Inserts after the selected
  // block, or at the end when nothing is selected.
  useEffect(() => {
    if (previewMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/") return;
      const el = document.activeElement as HTMLElement | null;
      const editing = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (editing) return;
      e.preventDefault();
      const idx = activeBlockId ? blocks.findIndex((b) => b.id === activeBlockId) : -1;
      setSlashMenu({ index: idx >= 0 ? idx + 1 : blocks.length });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewMode, activeBlockId, blocks]);

  /* ─── Preview Mode (gated journey, exactly what a learner sees) ─── */
  if (previewMode) {
    return <PreviewJourney blocks={blocks} lessonTitle={lessonTitle} viewport={viewport} themeVars={themeVars} />;
  }

  /* ─── Edit Mode ──────────────── */
  return (
    <div
      ref={setNodeRef}
      data-course-theme
      style={themeVars}
      className={cn(
        "relative flex min-h-full flex-1 flex-col transition",
        isOver && "bg-accent/30 ring-2 ring-inset ring-dashed ring-primary/20",
      )}
    >
      <div className="mx-auto w-full max-w-4xl flex-1 space-y-0.5 px-6 py-6">
        <div className="mb-6 px-1 mx-auto max-w-2xl">
          <h2 className="text-xl font-bold text-foreground">{lessonTitle}</h2>
          <p className="mt-1 text-xs text-muted-foreground/70">
            {blocks.length} block{blocks.length !== 1 ? "s" : ""} •{" "}
            <kbd className="rounded bg-muted px-1 font-mono text-[10px]">/</kbd> thêm block
          </p>
        </div>

        {blocks.length === 0 ? (
          <EmptyCanvasPlaceholder onAdd={() => handleSlashCommand(0)} />
        ) : (
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            {blocks.map((block, i) => (
              <div key={block.id}>
                {dropIndex === i && <DropIndicator />}
                <InsertButton onClick={() => handleSlashCommand(i)} />
                <ScrollReveal animation={block.animation} disabled>
                  <LayoutWrapper layout={block.type === "columns" ? "full" : block.layout}>
                    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.12 }}>
                      <BlockCard
                        block={block}
                        isActive={activeBlockId === block.id}
                        onSelect={() => onSelectBlock(block.id)}
                        onUpdate={(patch) => onUpdateBlock(block.id, patch)}
                        onDelete={() => onDeleteBlock(block.id)}
                        onDuplicate={() => onDuplicateBlock(block.id)}
                      />
                    </motion.div>
                  </LayoutWrapper>
                </ScrollReveal>
              </div>
            ))}
            {dropIndex === blocks.length && <DropIndicator />}
            <InsertButton onClick={() => handleSlashCommand(blocks.length)} />
          </SortableContext>
        )}
      </div>

      <AnimatePresence>
        {slashMenu && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5" onClick={() => setSlashMenu(null)}>
            <div onClick={(e) => e.stopPropagation()}>
              <SlashMenu onSelect={handleSlashSelect} onClose={() => setSlashMenu(null)} />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Empty Canvas ─────────────────────────────────────────────── */

function EmptyCanvasPlaceholder({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/50 bg-card py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50">
        <Move className="h-7 w-7 text-primary" />
      </div>
      <div className="mt-4 text-base font-semibold text-foreground">Bài học trống</div>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Kéo block từ bên trái hoặc gõ <kbd className="rounded bg-muted px-1 font-mono text-[10px]">/</kbd>
      </p>
      <button onClick={onAdd}
        className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover active:scale-[0.98]">
        <Plus className="h-4 w-4" /> Thêm block đầu tiên
      </button>
    </motion.div>
  );
}
