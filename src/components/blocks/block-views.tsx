import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw } from "lucide-react";
import type { CourseBlock, BlockLayout } from "@/stores/course";
import { useContent } from "@/stores/content";
import type { BlockRendererProps } from "./block-renderer";
import { VideoEmbed } from "@/components/course/block-media";
import { CodeHighlight, MathPreview } from "@/components/course/block-render";
import { HtmlEmbed } from "@/components/course/html-embed";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/* ─── Layout wrapper ───────────────────────────────────────────── */

export function LayoutWrapper({ layout, children }: { layout?: BlockLayout; children: React.ReactNode }) {
  switch (layout) {
    case "full":
      return <div className="w-full">{children}</div>;
    case "centered":
    default:
      return <div className="mx-auto max-w-2xl">{children}</div>;
  }
}

/* ─── Text view ────────────────────────────────────────────────── */

export function TextView({ block }: { block: CourseBlock }) {
  return (
    <div
      className="prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{
        __html: block.content || "<p class='text-muted-foreground italic'>Chưa có nội dung</p>",
      }}
    />
  );
}

/* ─── Image view ───────────────────────────────────────────────── */

export function ImageView({ block }: { block: CourseBlock }) {
  if (!block.content) {
    return (
      <div className="rounded-lg bg-muted/30 py-12 text-center text-sm text-muted-foreground">
        📷 Ảnh chưa có
      </div>
    );
  }
  return (
    <figure>
      <img src={block.content} alt={block.caption || ""} className="w-full rounded-lg" />
      {block.caption && (
        <figcaption className="mt-2 text-center text-xs text-muted-foreground">{block.caption}</figcaption>
      )}
    </figure>
  );
}

/* ─── Video view ───────────────────────────────────────────────── */

export function VideoView({ block }: { block: CourseBlock }) {
  return <VideoEmbed src={block.content} />;
}

/* ─── Callout view ─────────────────────────────────────────────── */

const CALLOUT_STYLES: Record<string, string> = {
  info: "border-callout-info-line bg-callout-info text-callout-info-fg",
  tip: "border-callout-tip-line bg-callout-tip text-callout-tip-fg",
  warning: "border-callout-warn-line bg-callout-warn text-callout-warn-fg",
  danger: "border-callout-danger-line bg-callout-danger text-callout-danger-fg",
};

export function CalloutView({ block }: { block: CourseBlock }) {
  const variant = block.calloutVariant ?? "info";
  return (
    <div className={cn("rounded-xl border p-4 text-sm", CALLOUT_STYLES[variant])}>
      {block.content || "..."}
    </div>
  );
}

/* ─── Embed view ───────────────────────────────────────────────── */

export function EmbedView({ block }: { block: CourseBlock }) {
  // Hoist useContent to top (before any conditional returns) to comply with Rules of Hooks
  const liveMaterial = useContent((s) =>
    block.embedMaterialId ? s.items.find((x) => x.id === block.embedMaterialId) : undefined,
  );

  // iframe embed — keep existing path unchanged
  if (block.embedUrl) {
    const aspect = block.embedAspect ?? "16:9";
    const paddingTop = aspect === "16:9" ? "56.25%" : aspect === "4:3" ? "75%" : undefined;
    const height = aspect === "auto" ? "600px" : undefined;
    return (
      <div
        className="w-full overflow-hidden rounded-xl border border-border bg-muted/20"
        style={paddingTop ? { position: "relative", paddingTop } : { height }}
      >
        <iframe
          src={block.embedUrl}
          title={block.embedTitle || "Embed"}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          className="h-full w-full border-0"
          style={paddingTop ? { position: "absolute", inset: 0, width: "100%", height: "100%" } : {}}
        />
      </div>
    );
  }

  // Live resolve: look up material by id when embedMaterialId is set

  if (block.embedMaterialId) {
    if (liveMaterial) {
      return (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-callout-tip/30 p-4">
          <span className="text-xl">📎</span>
          <div>
            <p className="font-medium text-foreground">{liveMaterial.title}</p>
            <p className="text-xs text-muted-foreground">
              {liveMaterial.materialSubtype ?? liveMaterial.type}
            </p>
          </div>
        </div>
      );
    }
    // Material no longer exists — stale state
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-4">
        <span className="text-xl">📎</span>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Học liệu không còn tồn tại</p>
          {block.embedTitle && (
            <p className="text-xs text-muted-foreground/50">{block.embedTitle}</p>
          )}
        </div>
      </div>
    );
  }

  // Fallback: denormalized title/type (no embedMaterialId set)
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-callout-tip/30 p-4">
      <span className="text-xl">📎</span>
      <div>
        <p className="font-medium text-foreground">{block.embedTitle || "Học liệu"}</p>
        <p className="text-xs text-muted-foreground">{block.embedType}</p>
      </div>
    </div>
  );
}

/* ─── Code view ────────────────────────────────────────────────── */

export function CodeView({ block }: { block: CourseBlock }) {
  return <CodeHighlight code={block.content} language={block.codeLanguage} />;
}

/* ─── Math view ────────────────────────────────────────────────── */

export function MathView({ block }: { block: CourseBlock }) {
  return <MathPreview content={block.content} />;
}

/* ─── Html view ────────────────────────────────────────────────── */

export function HtmlView({ block }: { block: CourseBlock }) {
  return <HtmlEmbed html={block.content} minHeight={360} />;
}

/* ─── Quiz view (interactive) ──────────────────────────────────── */

export function QuizView({ block, onResult }: { block: CourseBlock; onResult?: (correct: boolean) => void }) {
  const options = block.quizOptions ?? [];
  const correct = block.quizCorrect ?? 0;
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;

  const pick = (i: number) => { setPicked(i); onResult?.(i === correct); };
  const retry = () => { setPicked(null); onResult?.(false); };

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <p className="mb-3 text-base font-semibold text-foreground">{block.content || "Câu hỏi"}</p>
      <div className="space-y-2">
        {options.map((opt, i) => {
          const state = !answered ? "idle" : i === correct ? "correct" : i === picked ? "wrong" : "muted";
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => pick(i)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition",
                state === "idle" && "border-border hover:border-primary hover:bg-accent",
                state === "correct" && "border-callout-tip-line bg-callout-tip text-callout-tip-fg",
                state === "wrong" && "border-callout-danger-line bg-callout-danger text-callout-danger-fg",
                state === "muted" && "border-border opacity-60",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                  state === "correct" && "border-callout-tip-line bg-success text-white",
                  state === "wrong" && "border-callout-danger-line bg-destructive text-white",
                  (state === "idle" || state === "muted") && "border-border text-muted-foreground",
                )}
              >
                {state === "correct" ? "✓" : state === "wrong" ? "✕" : String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">{opt}</span>
            </button>
          );
        })}
      </div>
      <AnimatePresence>
        {answered && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              "mt-3 rounded-xl border p-3 text-sm",
              picked === correct
                ? "border-callout-tip-line bg-callout-tip text-callout-tip-fg"
                : "border-callout-warn-line bg-callout-warn text-callout-warn-fg",
            )}
          >
            <p className="font-semibold">{picked === correct ? "🎉 Chính xác!" : "💡 Chưa đúng — cùng xem lại nhé"}</p>
            {block.quizExplanation && (
              <p className="mt-1 text-[13px] leading-relaxed">{block.quizExplanation}</p>
            )}
            <button
              type="button"
              onClick={retry}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold shadow-sm transition hover:bg-muted/40 hover:shadow active:scale-95"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Thử lại
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Columns view (recursive via BlockRenderer) ───────────────── */
// Note: BlockRenderer is imported lazily to avoid circular dependency.
// ColumnsView delegates per-child rendering to BlockRenderer.

export function ColumnsView({
  block,
  mode,
  BlockRenderer,
}: {
  block: CourseBlock;
  mode: "preview" | "learn";
  BlockRenderer: (props: BlockRendererProps) => React.ReactElement | null;
}) {
  const count = block.columnCount ?? 2;
  const children = block.columnChildren ?? [];
  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}>
      {Array.from({ length: count }).map((_, colIdx) => (
        <div key={colIdx} className="space-y-4">
          {(children[colIdx] ?? []).map((child) => (
            <BlockRenderer key={child.id} block={child} mode={mode} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─── Accordion view ───────────────────────────────────────────── */

export function AccordionView({ block }: { block: CourseBlock }) {
  const items = block.accordionItems ?? [];
  if (items.length === 0) {
    return <div className="rounded-lg bg-muted/30 py-8 text-center text-sm text-muted-foreground">Accordion trống</div>;
  }
  return (
    <Accordion type="multiple" className="w-full rounded-xl border border-border overflow-hidden">
      {items.map((item) => (
        <AccordionItem key={item.id} value={item.id} className="border-b border-border last:border-b-0">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted/30">
            {item.title || "Tiêu đề"}
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 text-sm text-foreground">
            {item.body || <span className="text-muted-foreground italic">Chưa có nội dung</span>}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

/* ─── Process (step-by-step) view ─────────────────────────────── */

export function ProcessView({ block }: { block: CourseBlock }) {
  const steps = block.processSteps ?? [];
  if (steps.length === 0) {
    return <div className="rounded-lg bg-muted/30 py-8 text-center text-sm text-muted-foreground">Quy trình trống</div>;
  }
  return (
    <div className="space-y-0">
      {steps.map((step, idx) => (
        <div key={step.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm">
              {idx + 1}
            </div>
            {idx < steps.length - 1 && (
              <div className="mt-1 w-px flex-1 bg-border" style={{ minHeight: "24px" }} />
            )}
          </div>
          <div className="pb-6 flex-1 min-w-0">
            <p className="font-semibold text-foreground">{step.title || `Bước ${idx + 1}`}</p>
            {step.body && <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Flashcards view (flip on click) ─────────────────────────── */

export function FlashcardsView({ block }: { block: CourseBlock }) {
  const cards = block.flashcards ?? [];
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (cards.length === 0) {
    return <div className="rounded-lg bg-muted/30 py-8 text-center text-sm text-muted-foreground">Flashcards trống</div>;
  }

  const card = cards[current];
  const goTo = (i: number) => { setCurrent(i); setFlipped(false); };

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setFlipped((v) => !v)}
        onKeyDown={(e) => e.key === "Enter" && setFlipped((v) => !v)}
        className="relative min-h-[160px] cursor-pointer rounded-2xl border bg-card p-6 shadow-sm transition hover:shadow-md flex items-center justify-center"
        aria-label={flipped ? "Mặt sau — bấm để lật" : "Mặt trước — bấm để lật"}
      >
        <div className="text-center space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {flipped ? "Mặt sau" : "Mặt trước"}
          </p>
          <p className="text-base font-medium text-foreground">{flipped ? card.back : card.front}</p>
        </div>
        <span className="absolute bottom-3 right-4 text-[10px] text-muted-foreground/60">Bấm để lật</span>
      </div>
      {cards.length > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => goTo((current - 1 + cards.length) % cards.length)}
            className="rounded-lg border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary hover:text-primary"
          >
            ← Trước
          </button>
          <span className="text-xs text-muted-foreground">{current + 1} / {cards.length}</span>
          <button
            type="button"
            onClick={() => goTo((current + 1) % cards.length)}
            className="rounded-lg border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary hover:text-primary"
          >
            Tiếp →
          </button>
        </div>
      )}
    </div>
  );
}
