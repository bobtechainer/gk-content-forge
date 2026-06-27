import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw } from "lucide-react";
import type { CourseBlock, BlockLayout } from "@/stores/course";
import type { BlockRendererProps } from "./block-renderer";
import { VideoEmbed } from "@/components/course/block-media";
import { CodeHighlight, MathPreview } from "@/components/course/block-render";
import { HtmlEmbed } from "@/components/course/html-embed";
import { cn } from "@/lib/utils";

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
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-callout-tip/30 p-4">
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
