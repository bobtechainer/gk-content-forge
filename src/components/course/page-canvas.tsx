import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Plus, Move, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import type { CourseBlock, CourseBlockType, BlockLayout, BlockAnimation } from "@/stores/course";
import { splitIntoSections, collectQuizIds } from "@/stores/course";
import { BlockCard } from "./block-card";
import { VideoEmbed, HtmlEmbed } from "./block-media";
import { CodeHighlight, MathPreview } from "./block-render";
import { BLOCK_TYPES } from "./course-palette";
import { cn } from "@/lib/utils";

/* ─── Shared scroll-reveal animation variants ──────────────────── */

const ANIM_VARIANTS: Record<string, { hidden: Record<string, number>; visible: Record<string, number> }> = {
  "fade-up": { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } },
  parallax: { hidden: { opacity: 0, y: 40, scale: 0.97 }, visible: { opacity: 1, y: 0, scale: 1 } },
  progressive: { hidden: { opacity: 0, x: -24 }, visible: { opacity: 1, x: 0 } },
  none: { hidden: { opacity: 1 }, visible: { opacity: 1 } },
};

/* ─── Scroll-reveal wrapper ────────────────────────────────────── */

function ScrollReveal({ children, animation, disabled }: { children: React.ReactNode; animation?: string; disabled?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  if (disabled) return <>{children}</>;

  const v = ANIM_VARIANTS[animation ?? "fade-up"] ?? ANIM_VARIANTS["fade-up"];

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

/* ─── Layout wrapper ───────────────────────────────────────────── */

function LayoutWrapper({ layout, children }: { layout?: BlockLayout; children: React.ReactNode }) {
  switch (layout) {
    case "full":
      return <div className="w-full">{children}</div>;
    case "centered":
    default:
      return <div className="mx-auto max-w-2xl">{children}</div>;
  }
}

/* ─── Interactive preview blocks (Brilliant-style) ─────────────── */

function QuizPreview({ block, onResult }: { block: CourseBlock; onResult?: (correct: boolean) => void }) {
  const options = block.quizOptions ?? [];
  const correct = block.quizCorrect ?? 0;
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;

  const pick = (i: number) => {
    setPicked(i);
    onResult?.(i === correct);
  };
  const retry = () => {
    setPicked(null);
    onResult?.(false);
  };

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <p className="mb-3 text-base font-semibold text-foreground">{block.content || "Câu hỏi"}</p>
      <div className="space-y-2">
        {options.map((opt, i) => {
          const state = !answered ? "idle" : i === correct ? "correct" : i === picked ? "wrong" : "muted";
          return (
            <button key={i} type="button" disabled={answered} onClick={() => pick(i)}
              className={cn("flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition",
                state === "idle" && "border-border hover:border-[#2563EB] hover:bg-[#EFF6FF]",
                state === "correct" && "border-emerald-400 bg-emerald-50 text-emerald-800",
                state === "wrong" && "border-red-400 bg-red-50 text-red-800",
                state === "muted" && "border-border opacity-60")}>
              <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                state === "correct" && "border-emerald-500 bg-emerald-500 text-white",
                state === "wrong" && "border-red-500 bg-red-500 text-white",
                (state === "idle" || state === "muted") && "border-border text-muted-foreground")}>
                {state === "correct" ? "✓" : state === "wrong" ? "✕" : String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">{opt}</span>
            </button>
          );
        })}
      </div>
      <AnimatePresence>
        {answered && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={cn("mt-3 rounded-xl border p-3 text-sm",
              picked === correct ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800")}>
            <p className="font-semibold">{picked === correct ? "🎉 Chính xác!" : "💡 Chưa đúng — cùng xem lại nhé"}</p>
            {block.quizExplanation && <p className="mt-1 text-[13px] leading-relaxed">{block.quizExplanation}</p>}
            <button type="button" onClick={retry} className="mt-2 text-xs font-medium underline">Thử lại</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Preview Block Renderer ───────────────────────────────────── */

function PreviewBlock({ block, onQuizResult }: { block: CourseBlock; onQuizResult?: (id: string, correct: boolean) => void }) {
  const layout = block.layout ?? "centered";

  if (block.type === "divider") {
    return <hr className="my-6 border-border/30" />;
  }

  if (block.type === "columns") {
    const count = block.columnCount ?? 2;
    const children = block.columnChildren ?? [];
    return (
      <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}>
        {Array.from({ length: count }).map((_, colIdx) => (
          <div key={colIdx} className="space-y-4">
            {(children[colIdx] ?? []).map((child) => (
              <PreviewBlock key={child.id} block={child} onQuizResult={onQuizResult} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  const inner = (() => {
    switch (block.type) {
      case "text":
        return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: block.content || "<p class='text-muted-foreground italic'>Chưa có nội dung</p>" }} />;
      case "image":
        return block.content ? (
          <figure>
            <img src={block.content} alt={block.caption || ""} className="w-full rounded-lg" />
            {block.caption && <figcaption className="mt-2 text-center text-xs text-muted-foreground">{block.caption}</figcaption>}
          </figure>
        ) : <div className="rounded-lg bg-muted/30 py-12 text-center text-sm text-muted-foreground">📷 Ảnh chưa có</div>;
      case "video":
        return <VideoEmbed src={block.content} />;
      case "callout": {
        const variant = block.calloutVariant ?? "info";
        const styles: Record<string, string> = {
          info: "border-blue-200 bg-blue-50 text-blue-800",
          tip: "border-emerald-200 bg-emerald-50 text-emerald-800",
          warning: "border-amber-200 bg-amber-50 text-amber-800",
          danger: "border-red-200 bg-red-50 text-red-800",
        };
        return <div className={cn("rounded-xl border p-4 text-sm", styles[variant])}>{block.content || "..."}</div>;
      }
      case "embed":
        return block.embedHtml ? (
          <HtmlEmbed html={block.embedHtml} height={block.embedHeight} title={block.embedTitle} />
        ) : (
          <div className="flex items-center gap-3 rounded-lg border bg-emerald-50/30 p-4">
            <span className="text-xl">📎</span>
            <div>
              <p className="font-medium text-foreground">{block.embedTitle || "Học liệu"}</p>
              <p className="text-xs text-muted-foreground">{block.embedType}</p>
            </div>
          </div>
        );
      case "code":
        return <CodeHighlight code={block.content} language={block.codeLanguage} />;
      case "math":
        return <MathPreview content={block.content} />;
      case "quiz":
        return <QuizPreview block={block} onResult={(correct) => onQuizResult?.(block.id, correct)} />;
      default:
        return <div className="text-sm text-muted-foreground">{block.content}</div>;
    }
  })();

  return (
    <LayoutWrapper layout={layout}>
      {inner}
    </LayoutWrapper>
  );
}

/* ─── Gated Preview Player ─────────────────────────────────────────
 * Splits a lesson into sections (a `divider` block = section break) and
 * reveals them one at a time. The current section's quizzes must all be
 * answered correctly before "Tiếp tục" unlocks — so Preview mirrors the
 * real, gated learning flow a student actually experiences. A wider
 * canvas (max-w-6xl) gives full-width blocks room to breathe.
 * ────────────────────────────────────────────────────────────────── */

function AnimatedBlock({ block, onQuizResult, index }: { block: CourseBlock; index: number; onQuizResult: (id: string, correct: boolean) => void }) {
  const v = ANIM_VARIANTS[(block.animation as BlockAnimation) ?? "fade-up"] ?? ANIM_VARIANTS["fade-up"];
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={v}
      transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1], delay: Math.min(index * 0.06, 0.3) }}
    >
      <PreviewBlock block={block} onQuizResult={onQuizResult} />
    </motion.div>
  );
}

function PreviewPlayer({ blocks, lessonTitle }: { blocks: CourseBlock[]; lessonTitle: string }) {
  const sections = useMemo(() => splitIntoSections(blocks), [blocks]);
  const [revealed, setRevealed] = useState(1);
  const [quizState, setQuizState] = useState<Record<string, boolean>>({});
  const lastSectionRef = useRef<HTMLDivElement>(null);

  // Reset progress whenever the lesson (its block set) changes.
  useEffect(() => { setRevealed(1); setQuizState({}); }, [blocks]);

  // Bring each newly revealed section into view.
  useEffect(() => {
    if (revealed > 1) lastSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [revealed]);

  const handleQuizResult = useCallback((id: string, correct: boolean) => {
    setQuizState((s) => ({ ...s, [id]: correct }));
  }, []);

  const currentSection = sections[revealed - 1] ?? [];
  const currentQuizIds = collectQuizIds(currentSection);
  const correctCount = currentQuizIds.filter((id) => quizState[id] === true).length;
  const allCorrect = correctCount === currentQuizIds.length;
  const hasMore = revealed < sections.length;
  const multiSection = sections.length > 1;

  const goNext = () => { if (allCorrect && hasMore) setRevealed((r) => r + 1); };

  return (
    <div className="min-h-full bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
        {/* Lesson header + section progress */}
        <div className="mx-auto mb-8 max-w-3xl">
          <h1 className="text-3xl font-bold text-foreground">{lessonTitle}</h1>
          {multiSection && (
            <>
              <div className="mt-4 flex items-center gap-1.5">
                {sections.map((_, i) => (
                  <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors", i < revealed ? "bg-[#2563EB]" : "bg-muted")} />
                ))}
              </div>
              <p className="mt-2 text-xs font-medium text-muted-foreground">Phần {Math.min(revealed, sections.length)} / {sections.length}</p>
            </>
          )}
        </div>

        {/* Revealed sections */}
        {sections.slice(0, revealed).map((section, si) => (
          <motion.section
            key={si}
            ref={si === revealed - 1 ? lastSectionRef : undefined}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-12 space-y-6 scroll-mt-6"
          >
            {section.map((block, bi) => (
              <AnimatedBlock key={block.id} block={block} index={bi} onQuizResult={handleQuizResult} />
            ))}
          </motion.section>
        ))}

        {/* Section gate / completion */}
        <div className="mx-auto max-w-2xl">
          {hasMore ? (
            <div className="flex flex-col items-center gap-3 border-t border-dashed pt-8">
              {currentQuizIds.length > 0 && !allCorrect && (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" /> Trả lời đúng {correctCount}/{currentQuizIds.length} câu để mở phần tiếp theo
                </p>
              )}
              <button
                type="button"
                onClick={goNext}
                disabled={!allCorrect}
                className={cn("flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition",
                  allCorrect
                    ? "bg-[#2563EB] text-white shadow-sm hover:bg-[#1d4ed8] active:scale-[0.98]"
                    : "cursor-not-allowed bg-muted text-muted-foreground")}
              >
                {allCorrect ? <>Tiếp tục <ArrowRight className="h-4 w-4" /></> : <><Lock className="h-4 w-4" /> Hoàn thành phần này để tiếp tục</>}
              </button>
            </div>
          ) : (
            multiSection && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-8 text-center">
                <CheckCircle2 className="h-9 w-9 text-emerald-500" />
                <p className="text-lg font-bold text-emerald-800">🎉 Hoàn thành bài học!</p>
                <p className="text-sm text-emerald-700">Bạn đã đi hết {sections.length} phần của bài này.</p>
              </motion.div>
            )
          )}
        </div>
      </div>
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
        className="flex h-5 w-5 items-center justify-center rounded-full border border-transparent text-muted-foreground/0 transition group-hover:border-border group-hover:bg-card group-hover:text-muted-foreground group-hover:shadow-sm hover:!border-[#2563EB] hover:!text-[#2563EB]">
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
      <div className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
      <div className="h-0.5 flex-1 rounded-full bg-[#2563EB]" />
      <div className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
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
}

export function PageCanvas({
  blocks, activeBlockId, onSelectBlock, onAddBlock, onUpdateBlock, onDeleteBlock, onDuplicateBlock, lessonTitle, previewMode, dropIndex,
}: PageCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas-drop" });
  const [slashMenu, setSlashMenu] = useState<{ index: number } | null>(null);

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

  /* ─── Preview Mode ────────────── */
  if (previewMode) {
    return <PreviewPlayer blocks={blocks} lessonTitle={lessonTitle} />;
  }

  /* ─── Edit Mode ──────────────── */
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative flex min-h-full flex-1 flex-col transition",
        isOver && "bg-[#EFF6FF]/30 ring-2 ring-inset ring-dashed ring-[#2563EB]/20",
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
        <Move className="h-7 w-7 text-[#2563EB]" />
      </div>
      <div className="mt-4 text-base font-semibold text-foreground">Bài học trống</div>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Kéo block từ bên trái hoặc gõ <kbd className="rounded bg-muted px-1 font-mono text-[10px]">/</kbd>
      </p>
      <button onClick={onAdd}
        className="mt-4 flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1d4ed8] active:scale-[0.98]">
        <Plus className="h-4 w-4" /> Thêm block đầu tiên
      </button>
    </motion.div>
  );
}
