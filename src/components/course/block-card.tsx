import { useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import {
  Trash2, Copy, ChevronUp, ChevronDown, Settings,
  Type, ImageIcon, VideoIcon, MessageSquare, Minus, Link2, Code2, Sigma, Columns2,
  ListChecks, Boxes, SplitSquareVertical, Check,
  Info, Lightbulb, AlertTriangle, ShieldAlert,
  AlignCenter, Maximize2, Plus, MoveVertical,
  ChevronsUpDown, ListOrdered, Layers,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { FontSize } from "@/components/blocks/font-size-extension";
import type { CourseBlock, CourseBlockType, CalloutVariant, BlockLayout, BlockAnimation } from "@/stores/course";
import type { ContentItem, MaterialType } from "@/lib/types";
import { useContent } from "@/stores/content";
import { useSession } from "@/stores/session";
import { MATERIAL_TYPE_LABELS } from "@/lib/taxonomy";
import { MediaUploadField, VideoEmbed } from "./block-media";
import { CodeHighlight, MathPreview } from "./block-render";
import { BubbleToolbar } from "@/components/blocks/bubble-toolbar";
import { HtmlEmbed } from "./html-embed";
import { WIDGET_TEMPLATES } from "@/lib/widgets";
import { cn } from "@/lib/utils";

/* ─── Block type metadata ──────────────────────────────────────── */

const BLOCK_META: Record<CourseBlockType, { icon: typeof Type; color: string; label: string }> = {
  text: { icon: Type, color: "var(--colors-brand-600)", label: "Văn bản" },
  image: { icon: ImageIcon, color: "var(--colors-success-600)", label: "Hình ảnh" },
  video: { icon: VideoIcon, color: "var(--colors-error-600)", label: "Video" },
  callout: { icon: MessageSquare, color: "var(--colors-orange-600)", label: "Callout" },
  divider: { icon: Minus, color: "var(--colors-gray-light-mode-500)", label: "Phân cách" },
  embed: { icon: Link2, color: "var(--colors-teal-600)", label: "Học liệu" },
  code: { icon: Code2, color: "var(--colors-purple-600)", label: "Code" },
  math: { icon: Sigma, color: "var(--colors-cyan-600)", label: "Công thức" },
  columns: { icon: Columns2, color: "var(--colors-violet-600)", label: "Nhiều cột" },
  quiz: { icon: ListChecks, color: "var(--colors-warning-500)", label: "Câu hỏi" },
  html: { icon: Boxes, color: "var(--colors-pink-600)", label: "HTML / Tương tác" },
  section: { icon: SplitSquareVertical, color: "var(--colors-blue-light-500)", label: "Phần mới" },
  accordion: { icon: ChevronsUpDown, color: "var(--colors-indigo-600)", label: "Accordion" },
  process: { icon: ListOrdered, color: "var(--colors-orange-600)", label: "Quy trình" },
  flashcards: { icon: Layers, color: "var(--colors-violet-600)", label: "Flashcards" },
};

const CALLOUT_STYLES: Record<CalloutVariant, { icon: typeof Info; bg: string; border: string; text: string; label: string }> = {
  info: { icon: Info, bg: "bg-callout-info", border: "border-callout-info-line", text: "text-callout-info-fg", label: "Thông tin" },
  tip: { icon: Lightbulb, bg: "bg-callout-tip", border: "border-callout-tip-line", text: "text-callout-tip-fg", label: "Mẹo" },
  warning: { icon: AlertTriangle, bg: "bg-callout-warn", border: "border-callout-warn-line", text: "text-callout-warn-fg", label: "Cảnh báo" },
  danger: { icon: ShieldAlert, bg: "bg-callout-danger", border: "border-callout-danger-line", text: "text-callout-danger-fg", label: "Nguy hiểm" },
};

const ANIM_OPTIONS: { value: BlockAnimation; label: string }[] = [
  { value: "fade-up", label: "Fade Up" },
  { value: "parallax", label: "Parallax" },
  { value: "progressive", label: "Hiện dần" },
  { value: "none", label: "Không" },
];

/* ─── Block settings menu (gear: layout + scroll animation) ──────── */

function BlockSettingsMenu({
  block, onUpdate, onAnimChange,
}: {
  block: CourseBlock;
  onUpdate: (p: Partial<CourseBlock>) => void;
  onAnimChange: (a: BlockAnimation) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const layout = block.layout ?? "centered";
  const anim = block.animation ?? "fade-up";
  const showLayout = block.type !== "columns" && block.type !== "divider" && block.type !== "section";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition hover:bg-muted hover:text-foreground"
        title="Cài đặt khối"
        aria-label="Cài đặt khối"
      >
        <Settings className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-full top-0 z-50 mr-1.5 w-[212px] rounded-xl border bg-card p-2 text-left shadow-xl"
        >
          {showLayout && (
            <div className="mb-2">
              <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Bố cục</p>
              <div className="flex gap-1">
                {([["centered", "Giữa", AlignCenter], ["full", "Rộng", Maximize2]] as const).map(([val, label, LIcon]) => (
                  <button
                    key={val}
                    onClick={() => onUpdate({ layout: val as BlockLayout })}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-[11px] font-medium transition",
                      layout === val ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <LIcon className="h-3 w-3" /> {label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Hiệu ứng xuất hiện</p>
            <div className="grid grid-cols-2 gap-1">
              {ANIM_OPTIONS.map((a) => (
                <button
                  key={a.value}
                  onClick={() => onAnimChange(a.value)}
                  className={cn(
                    "rounded-md border px-2 py-1 text-[11px] transition",
                    anim === a.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main BlockCard ───────────────────────────────────────────── */

interface BlockCardProps {
  block: CourseBlock;
  isActive: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<CourseBlock>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  /** Vị trí (0-based) của khối trong bài — hiển thị số thứ tự trên pill. */
  index: number;
  /** Tổng số khối — để khoá nút ▲/▼ ở hai đầu. */
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function BlockCard({ block, isActive, onSelect, onUpdate, onDelete, onDuplicate, index, total, onMoveUp, onMoveDown }: BlockCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { source: "block", blockId: block.id },
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const meta = BLOCK_META[block.type];
  const Icon = meta.icon;
  const layout = block.layout ?? "centered";
  const anim = block.animation ?? "fade-up";
  const [animKey, setAnimKey] = useState(0);

  const ANIM_PREVIEW: Record<string, Record<string, number | number[]>> = {
    "fade-up": { opacity: [0, 1], y: [20, 0] },
    parallax: { opacity: [0, 1], y: [30, 0], scale: [0.97, 1] },
    progressive: { opacity: [0, 1], x: [-20, 0] },
    none: {},
  };

  const handleAnimChange = (val: BlockAnimation) => {
    onUpdate({ animation: val });
    setAnimKey((k) => k + 1);
  };

  return (
    <div ref={setNodeRef}
      style={isActive
        ? { ...style, borderColor: "color-mix(in srgb, var(--course-accent) 45%, transparent)", outline: "3px solid color-mix(in srgb, var(--course-accent) 18%, transparent)", outlineOffset: "1px" }
        : style}
      onClick={onSelect}
      className={cn("group relative rounded-xl border bg-card transition-all",
        isActive ? "shadow-md" : "border-border/60 hover:border-border hover:shadow-sm",
        isDragging && "z-50 opacity-50 shadow-xl")}>
      {/* TalentLMS-style floating control pill (right edge): số thứ tự + ▲▼ + nhân đôi + xoá + cài đặt */}
      <div className={cn(
        "absolute -right-3.5 top-2 z-10 flex flex-col items-center gap-0.5 rounded-xl border bg-card p-1 shadow-md transition-opacity",
        isActive || isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100")}
      >
        <div {...listeners} {...attributes}
          className="flex h-6 w-6 cursor-grab items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground active:cursor-grabbing"
          title={`Khối ${index + 1} — kéo để di chuyển`}
          aria-label={`Khối ${index + 1}, kéo để di chuyển`}
        >
          {index + 1}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} disabled={index === 0}
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-30"
          title="Di chuyển lên" aria-label="Di chuyển lên">
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} disabled={index === total - 1}
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-30"
          title="Di chuyển xuống" aria-label="Di chuyển xuống">
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition hover:bg-muted hover:text-foreground"
          title="Nhân đôi" aria-label="Nhân đôi khối">
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition hover:bg-error-50 hover:text-destructive"
          title="Xoá" aria-label="Xoá khối">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <BlockSettingsMenu block={block} onUpdate={onUpdate} onAnimChange={handleAnimChange} />
      </div>
      {/* Block header (nhãn loại block, cạnh trái) */}
      <div className="flex items-center gap-2 px-3 py-1.5">
        <Icon className="h-3 w-3" style={{ color: meta.color }} />
        <span className="text-[10px] font-medium text-muted-foreground">{meta.label}</span>
        {block.aiGenerated && (
          <span className="ml-1 rounded px-1 py-0.5 text-[9px] font-medium bg-brand-50 text-primary">
            AI
          </span>
        )}
        {block.type !== "columns" && block.type !== "divider" && block.type !== "section" && (
          <span className="ml-auto text-[9px] text-muted-foreground/50">{layout === "full" ? "Rộng" : "Giữa"}</span>
        )}
        {block.type === "columns" && (
          <span className="ml-auto text-[9px] text-muted-foreground/50">{block.columnCount ?? 2} cột</span>
        )}
      </div>
      {/* Content editor with animation preview */}
      <motion.div key={animKey}
        animate={animKey > 0 && anim !== "none" ? ANIM_PREVIEW[anim] : {}}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn("min-h-[40px]", block.type !== "divider" && "border-t border-border/30")}>
        {block.type === "text" && <TextBlockEditor block={block} onUpdate={onUpdate} />}
        {block.type === "image" && <ImageBlockEditor block={block} onUpdate={onUpdate} />}
        {block.type === "video" && <VideoBlockEditor block={block} onUpdate={onUpdate} />}
        {block.type === "callout" && <CalloutBlockEditor block={block} onUpdate={onUpdate} />}
        {block.type === "divider" && <DividerBlock />}
        {block.type === "embed" && <EmbedBlockEditor block={block} onUpdate={onUpdate} />}
        {block.type === "code" && <CodeBlockEditor block={block} onUpdate={onUpdate} />}
        {block.type === "math" && <MathBlockEditor block={block} onUpdate={onUpdate} />}
        {block.type === "columns" && <ColumnsBlockEditor block={block} onUpdate={onUpdate} />}
        {block.type === "quiz" && <QuizBlockEditor block={block} onUpdate={onUpdate} />}
        {block.type === "html" && <HtmlBlockEditor block={block} onUpdate={onUpdate} />}
        {block.type === "section" && <SectionBlockEditor block={block} onUpdate={onUpdate} />}
        {block.type === "accordion" && <AccordionBlockEditor block={block} onUpdate={onUpdate} />}
        {block.type === "process" && <ProcessBlockEditor block={block} onUpdate={onUpdate} />}
        {block.type === "flashcards" && <FlashcardsBlockEditor block={block} onUpdate={onUpdate} />}
      </motion.div>
    </div>
  );
}

/* ─── Individual Block Editors ─────────────────────────────────── */

function TextBlockEditor({ block, onUpdate }: { block: CourseBlock; onUpdate: (p: Partial<CourseBlock>) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      FontSize,
      Placeholder.configure({ placeholder: "Nhập nội dung văn bản..." }),
    ],
    content: block.content || "",
    onUpdate: ({ editor: e }) => onUpdate({ content: e.getHTML() }),
    editorProps: { attributes: { class: "prose prose-sm max-w-none px-4 py-3 outline-none min-h-[60px] text-foreground" } },
  });
  return (
    <>
      <BubbleToolbar editor={editor} />
      <EditorContent editor={editor} onClick={(e) => e.stopPropagation()} />
    </>
  );
}

function ImageBlockEditor({ block, onUpdate }: { block: CourseBlock; onUpdate: (p: Partial<CourseBlock>) => void }) {
  return (
    <div className="space-y-2 p-3">
      <MediaUploadField kind="image" value={block.content || ""} accent="var(--colors-success-600)"
        onChange={(v) => onUpdate({ content: v })} />
      {block.content && (
        <img src={block.content} alt={block.caption || ""} className="max-h-48 w-full rounded-lg object-contain" />
      )}
      <input type="text" value={block.caption || ""} onChange={(e) => onUpdate({ caption: e.target.value })}
        placeholder="Chú thích (tùy chọn)" onClick={(e) => e.stopPropagation()}
        className="w-full rounded-lg border bg-muted/30 px-3 py-1.5 text-[10px] outline-none" />
    </div>
  );
}

function VideoBlockEditor({ block, onUpdate }: { block: CourseBlock; onUpdate: (p: Partial<CourseBlock>) => void }) {
  return (
    <div className="space-y-2 p-3">
      <MediaUploadField kind="video" value={block.content || ""} accent="var(--colors-error-600)"
        onChange={(v) => onUpdate({ content: v })} />
      {block.content && <VideoEmbed src={block.content} className="mt-1" />}
    </div>
  );
}

function CalloutBlockEditor({ block, onUpdate }: { block: CourseBlock; onUpdate: (p: Partial<CourseBlock>) => void }) {
  const variant = block.calloutVariant ?? "info";
  const style = CALLOUT_STYLES[variant];
  const VIcon = style.icon;
  return (
    <div className="p-3 space-y-2">
      <div className="flex gap-1">
        {(Object.keys(CALLOUT_STYLES) as CalloutVariant[]).map((v) => {
          const S = CALLOUT_STYLES[v];
          return (
            <button key={v} onClick={(e) => { e.stopPropagation(); onUpdate({ calloutVariant: v }); }}
              className={cn("rounded-md px-2 py-0.5 text-[9px] font-medium border transition",
                variant === v ? `${S.bg} ${S.border} ${S.text}` : "border-border text-muted-foreground hover:bg-muted")}>
              {S.label}
            </button>
          );
        })}
      </div>
      <div className={cn("rounded-xl border p-3", style.bg, style.border)}>
        <div className="flex items-start gap-2">
          <VIcon className={cn("h-4 w-4 mt-0.5 shrink-0", style.text)} />
          <textarea value={block.content || ""} onChange={(e) => onUpdate({ content: e.target.value })}
            placeholder="Nội dung callout..." rows={2} onClick={(e) => e.stopPropagation()}
            className={cn("w-full resize-none bg-transparent text-sm outline-none", style.text)} />
        </div>
      </div>
    </div>
  );
}

function DividerBlock() {
  return <div className="flex items-center px-4 py-3"><hr className="w-full border-border/50" /></div>;
}

function EmbedBlockEditor({ block, onUpdate }: { block: CourseBlock; onUpdate: (p: Partial<CourseBlock>) => void }) {
  const [picking, setPicking] = useState(false);
  const hasMaterial = Boolean(block.embedMaterialId || block.embedTitle);

  const attach = (mat: ContentItem) => {
    onUpdate({ embedMaterialId: mat.id, embedTitle: mat.title, embedType: mat.materialSubtype ?? "document" });
    setPicking(false);
  };
  const detach = () => { onUpdate({ embedMaterialId: "", embedTitle: "", embedType: "" }); setPicking(false); };

  const typeLabel = block.embedType
    ? (MATERIAL_TYPE_LABELS[block.embedType as MaterialType] ?? block.embedType)
    : "";

  return (
    <div className="space-y-2 p-3" onClick={(e) => e.stopPropagation()}>
      {hasMaterial ? (
        <div className="flex items-center gap-2.5 rounded-lg border bg-callout-tip/30 p-2.5">
          <span className="text-xl">📎</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{block.embedTitle || "Học liệu đính kèm"}</p>
            <p className="text-[10px] text-muted-foreground">{typeLabel}</p>
          </div>
          <button onClick={() => setPicking((v) => !v)}
            className="shrink-0 rounded-md border px-2 py-1 text-[10px] font-medium text-success transition hover:bg-callout-tip">
            Đổi
          </button>
          <button onClick={detach}
            className="shrink-0 rounded-md border px-2 py-1 text-[10px] font-medium text-muted-foreground transition hover:border-destructive/40 hover:text-destructive">
            Gỡ
          </button>
        </div>
      ) : (
        <button onClick={() => setPicking((v) => !v)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-success/40 py-3 text-xs font-medium text-success transition hover:bg-callout-tip">
          <Link2 className="h-3.5 w-3.5" /> Chọn học liệu từ kho
        </button>
      )}
      {picking && <EmbedMaterialPicker onPick={attach} />}
      <div className="border-t border-border/30 pt-2 space-y-1.5">
        <label className="text-[10px] font-medium text-muted-foreground">URL PDF / trang web (tùy chọn)</label>
        <input
          type="url"
          value={block.embedUrl ?? ""}
          onChange={(e) => onUpdate({ embedUrl: e.target.value })}
          placeholder="https://example.com/file.pdf"
          className="w-full rounded-md border bg-muted/30 px-2.5 py-1.5 text-xs outline-none focus:border-primary"
        />
        <select
          value={block.embedAspect ?? "16:9"}
          onChange={(e) => onUpdate({ embedAspect: e.target.value as "16:9" | "4:3" | "auto" })}
          className="rounded bg-muted px-2 py-1 text-[10px] outline-none"
        >
          <option value="16:9">16:9</option>
          <option value="4:3">4:3</option>
          <option value="auto">Tự động (600px)</option>
        </select>
      </div>
    </div>
  );
}

function EmbedMaterialPicker({ onPick }: { onPick: (m: ContentItem) => void }) {
  const items = useContent((s) => s.items);
  const roleId = useSession((s) => s.roleId);
  const [q, setQ] = useState("");

  const library = items.filter(
    (i) => i.category === "learning_material" && (i.ownerId === roleId || i.status === "published"),
  );
  const query = q.trim().toLowerCase();
  const filtered = query
    ? library.filter(
        (i) => i.title.toLowerCase().includes(query) || i.subject.toLowerCase().includes(query),
      )
    : library;

  return (
    <div className="rounded-lg border bg-card p-2 shadow-sm">
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Tìm học liệu…"
        className="mb-1.5 w-full rounded-md bg-muted/40 px-2.5 py-1.5 text-xs outline-none"
      />
      <div className="max-h-44 space-y-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-1 py-4 text-center text-[11px] text-muted-foreground">Không có học liệu phù hợp</p>
        ) : (
          filtered.map((m) => (
            <button
              key={m.id}
              onClick={() => onPick(m)}
              className="flex w-full items-center gap-2 rounded-md border border-transparent p-1.5 text-left transition hover:border-success/40 hover:bg-callout-tip"
            >
              <span className="text-base">📄</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-medium text-foreground">{m.title}</span>
                <span className="block truncate text-[10px] text-muted-foreground">
                  {MATERIAL_TYPE_LABELS[(m.materialSubtype ?? "document") as MaterialType]} • {m.subject}
                </span>
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function CodeBlockEditor({ block, onUpdate }: { block: CourseBlock; onUpdate: (p: Partial<CourseBlock>) => void }) {
  return (
    <div className="p-3 space-y-1.5">
      <select value={block.codeLanguage || "javascript"} onClick={(e) => e.stopPropagation()}
        onChange={(e) => onUpdate({ codeLanguage: e.target.value })}
        className="rounded bg-muted px-2 py-1 text-[10px] outline-none">
        {["javascript", "typescript", "python", "html", "css", "json"].map((l) => <option key={l} value={l}>{l}</option>)}
      </select>
      <textarea value={block.content || ""} onChange={(e) => onUpdate({ content: e.target.value })}
        placeholder="// Code..." rows={4} onClick={(e) => e.stopPropagation()}
        className="w-full resize-none rounded-lg bg-code-surface p-3 font-mono text-xs text-code-ink outline-none" />
      {block.content && <CodeHighlight code={block.content} language={block.codeLanguage} />}
    </div>
  );
}

function MathBlockEditor({ block, onUpdate }: { block: CourseBlock; onUpdate: (p: Partial<CourseBlock>) => void }) {
  return (
    <div className="p-3 space-y-2">
      <textarea value={block.content || ""} onChange={(e) => onUpdate({ content: e.target.value })}
        placeholder="Nhập công thức LaTeX, ví dụ: E = mc^2" rows={2} onClick={(e) => e.stopPropagation()}
        className="w-full resize-none rounded-lg border bg-muted/30 px-3 py-2 font-mono text-sm outline-none focus:border-cyan-600" />
      {block.content && <MathPreview content={block.content} />}
    </div>
  );
}

/* ─── Quiz Block Editor (multiple choice + instant feedback) ───── */

function QuizBlockEditor({ block, onUpdate }: { block: CourseBlock; onUpdate: (p: Partial<CourseBlock>) => void }) {
  const options = block.quizOptions ?? [];
  const correct = block.quizCorrect ?? 0;

  const setOption = (i: number, val: string) =>
    onUpdate({ quizOptions: options.map((o, j) => (j === i ? val : o)) });
  const addOption = () =>
    onUpdate({ quizOptions: [...options, `Lựa chọn ${String.fromCharCode(65 + options.length)}`] });
  const removeOption = (i: number) => {
    const next = options.filter((_, j) => j !== i);
    let c = correct;
    if (i === correct) c = 0;
    else if (i < correct) c = correct - 1;
    onUpdate({ quizOptions: next, quizCorrect: Math.min(c, Math.max(0, next.length - 1)) });
  };

  return (
    <div className="space-y-2 p-3" onClick={(e) => e.stopPropagation()}>
      <textarea value={block.content || ""} onChange={(e) => onUpdate({ content: e.target.value })}
        placeholder="Nhập câu hỏi…" rows={2}
        className="w-full resize-none rounded-lg border bg-muted/30 px-3 py-2 text-sm font-medium outline-none focus:border-warning" />
      <div className="space-y-1.5">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <button type="button" onClick={() => onUpdate({ quizCorrect: i })} title="Đánh dấu đáp án đúng"
              className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition",
                i === correct ? "border-callout-tip-line bg-success text-white" : "border-border text-transparent hover:border-callout-tip-line")}>
              <Check className="h-3 w-3" />
            </button>
            <input value={opt} onChange={(e) => setOption(i, e.target.value)} placeholder={`Lựa chọn ${i + 1}`}
              className={cn("w-full rounded-md border bg-muted/30 px-2.5 py-1.5 text-xs outline-none focus:border-warning",
                i === correct && "border-callout-tip-line/50")} />
            <button type="button" onClick={() => removeOption(i)} disabled={options.length <= 2}
              className="shrink-0 rounded p-1 text-muted-foreground transition hover:text-destructive disabled:opacity-30">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addOption}
        className="flex items-center gap-1 rounded-md border border-dashed px-2 py-1 text-[11px] text-muted-foreground transition hover:border-warning hover:text-warning">
        <Plus className="h-3 w-3" /> Thêm lựa chọn
      </button>
      <textarea value={block.quizExplanation || ""} onChange={(e) => onUpdate({ quizExplanation: e.target.value })}
        placeholder="Giải thích đáp án (hiện sau khi trả lời)…" rows={2}
        className="w-full resize-none rounded-lg border bg-muted/30 px-3 py-2 text-[11px] outline-none focus:border-warning" />
      <p className="text-[10px] text-muted-foreground">✓ Bấm nút tròn để chọn đáp án đúng. Bấm <strong>Preview</strong> để thử tương tác.</p>
    </div>
  );
}

/* ─── HTML Block Editor (advanced interactive embed) ───────────── */

function HtmlBlockEditor({ block, onUpdate }: { block: CourseBlock; onUpdate: (p: Partial<CourseBlock>) => void }) {
  const [showTemplates, setShowTemplates] = useState(false);
  return (
    <div className="space-y-2 p-3" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between gap-2">
        <label className="text-[10px] font-medium text-muted-foreground">Mã HTML (mô phỏng, bảng tuần hoàn 3D, nhúng tương tác…)</label>
        <div className="relative">
          <button type="button" onClick={() => setShowTemplates((v) => !v)}
            className="rounded-md border border-pink-600/40 px-2 py-1 text-[10px] font-medium text-pink-600 transition hover:bg-pink-50">
            Chèn mẫu
          </button>
          {showTemplates && (
            <div className="absolute right-0 top-full z-50 mt-1 w-[230px] rounded-xl border bg-card p-1.5 shadow-xl">
              {WIDGET_TEMPLATES.map((t) => (
                <button key={t.id} type="button"
                  onClick={() => { onUpdate({ content: t.html, layout: "full" }); setShowTemplates(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition hover:bg-muted">
                  <Boxes className="h-3.5 w-3.5 shrink-0 text-pink-600" />
                  <span className="font-medium text-foreground">{t.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <textarea value={block.content || ""} onChange={(e) => onUpdate({ content: e.target.value })}
        placeholder="<div>Dán HTML tương tác…</div>" rows={5} spellCheck={false}
        className="w-full resize-y rounded-lg bg-code-surface p-3 font-mono text-[11px] leading-relaxed text-code-ink outline-none" />
      <div>
        <p className="mb-1 text-[10px] font-medium text-muted-foreground">Xem trước trực tiếp</p>
        <HtmlEmbed html={block.content || ""} minHeight={160} />
      </div>
    </div>
  );
}

/* ─── Section Block Editor (gated part marker) ─────────────────── */

function SectionBlockEditor({ block, onUpdate }: { block: CourseBlock; onUpdate: (p: Partial<CourseBlock>) => void }) {
  return (
    <div className="p-3" onClick={(e) => e.stopPropagation()}>
      <div
        className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2.5"
        style={{
          borderColor: "color-mix(in srgb, var(--course-accent) 40%, transparent)",
          background: "color-mix(in srgb, var(--course-accent) 6%, transparent)",
        }}
      >
        <SplitSquareVertical className="h-4 w-4 shrink-0" style={{ color: "var(--course-accent)" }} />
        <input value={block.content || ""} onChange={(e) => onUpdate({ content: e.target.value })}
          placeholder="Tên phần (vd: Chặng 1 · Cảm nhận thời gian)"
          className="w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground" />
      </div>
      <p className="mt-1.5 text-[10px] text-muted-foreground">
        Mốc bắt đầu một phần mới. Khi <strong>Preview</strong>, người học phải trả lời đúng hết câu hỏi của phần trước mới sang được phần này.
      </p>
    </div>
  );
}

/* ─── Columns Block Editor (HTML5 native drag-and-drop) ────────── */

function ColumnsBlockEditor({ block, onUpdate }: { block: CourseBlock; onUpdate: (p: Partial<CourseBlock>) => void }) {
  const count = block.columnCount ?? 2;
  const cols = block.columnChildren ?? Array.from({ length: count }, () => [] as CourseBlock[]);
  const dragRef = useRef<{ col: number; idx: number } | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{ col: number; pos: number } | null>(null);

  const setCount = (n: number) => {
    const c = Math.max(2, Math.min(4, n));
    const next = Array.from({ length: c }, (_, i) => cols[i] ?? []);
    // When shrinking, fold orphaned children into the last kept column instead
    // of silently dropping them.
    if (c < cols.length) {
      const orphans = cols.slice(c).flat();
      if (orphans.length) next[c - 1] = [...next[c - 1], ...orphans];
    }
    onUpdate({ columnCount: c, columnChildren: next });
  };

  const addChild = (ci: number) => {
    onUpdate({
      columnChildren: cols.map((col, i) => i !== ci ? col : [...col, {
        id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: "text" as const, content: "", layout: "centered" as const, animation: "fade-up" as const,
      }]),
    });
  };

  const updateChild = (ci: number, bi: number, patch: Partial<CourseBlock>) => {
    onUpdate({ columnChildren: cols.map((c, i) => i !== ci ? c : c.map((b, j) => j === bi ? { ...b, ...patch } : b)) });
  };

  const deleteChild = (ci: number, bi: number) => {
    onUpdate({ columnChildren: cols.map((c, i) => i !== ci ? c : c.filter((_, j) => j !== bi)) });
  };

  const doMove = () => {
    if (!dragRef.current || !dropIndicator) return;
    const { col: fc, idx: fi } = dragRef.current;
    const { col: tc, pos: tp } = dropIndicator;
    const nc = cols.map((c) => [...c]);
    const [moved] = nc[fc].splice(fi, 1);
    const adj = fc === tc && fi < tp ? tp - 1 : tp;
    nc[tc].splice(adj, 0, moved);
    onUpdate({ columnChildren: nc });
  };

  return (
    <div className="p-3 space-y-2.5" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium text-muted-foreground">Số cột:</span>
        <div className="flex gap-1">
          {[2, 3, 4].map((n) => (
            <button key={n} onClick={(e) => { e.stopPropagation(); setCount(n); }}
              title={`${n} cột`} aria-pressed={count === n}
              className={cn("flex h-7 items-center gap-[2px] rounded-md border px-1.5 transition",
                count === n ? "border-primary bg-primary/10" : "border-border hover:border-primary/40")}>
              {Array.from({ length: n }).map((_, i) => (
                <span key={i} className={cn("h-4 w-1.5 rounded-[1px]", count === n ? "bg-primary" : "bg-muted-foreground/30")} />
              ))}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}>
        {Array.from({ length: count }).map((_, ci) => {
          const items = cols[ci] ?? [];
          const isOverCol = dropIndicator?.col === ci;
          return (
            <div key={ci}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (!dragRef.current) return;
                // Children call stopPropagation, so this only fires over the
                // column's non-child regions (header, padding, "Thêm block"):
                // default the insertion point to the end of THIS column so the
                // indicator never goes stale on another column.
                setDropIndicator({ col: ci, pos: items.length });
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDropIndicator((cur) => (cur && cur.col === ci ? null : cur));
                }
              }}
              onDrop={(e) => { e.preventDefault(); doMove(); dragRef.current = null; setDropIndicator(null); }}
              className={cn("min-h-[60px] rounded-lg border border-dashed p-1.5 transition-all",
                isOverCol && dragRef.current ? "border-primary bg-primary/5" : "border-primary/30 bg-primary/[0.02]")}>
              <div className="mb-1 text-center text-[8px] font-semibold text-primary/40">Cột {ci + 1}</div>
              {items.map((child, bi) => {
                const M = BLOCK_META[child.type];
                const CI = M.icon;
                const isDragged = dragRef.current?.col === ci && dragRef.current?.idx === bi;
                const showBefore = isOverCol && dropIndicator?.pos === bi;
                const showAfter = isOverCol && dropIndicator?.pos === bi + 1 && bi === items.length - 1;
                return (
                  <div key={child.id}>
                    {showBefore && <InsertLine />}
                    <div draggable
                      onDragStart={(e) => {
                        dragRef.current = { col: ci, idx: bi };
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", "col-child");
                        requestAnimationFrame(() => {
                          (e.target as HTMLElement).style.opacity = "0.3";
                        });
                      }}
                      onDragEnd={(e) => {
                        (e.target as HTMLElement).style.opacity = "1";
                        dragRef.current = null;
                        setDropIndicator(null);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = "move";
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        const pos = e.clientY < rect.top + rect.height / 2 ? bi : bi + 1;
                        setDropIndicator({ col: ci, pos });
                      }}
                      className={cn("group/child mb-1 flex gap-1 rounded-lg border bg-card p-1.5 transition cursor-grab active:cursor-grabbing",
                        isDragged && "opacity-30", !isDragged && "hover:shadow-sm")}>
                      <div className="flex shrink-0 items-center text-muted-foreground/30 hover:text-muted-foreground">
                        <MoveVertical className="h-3 w-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                          <CI className="h-2.5 w-2.5" style={{ color: M.color }} />
                          <span className="flex-1 truncate font-medium">{M.label}</span>
                          <button onClick={(e) => { e.stopPropagation(); deleteChild(ci, bi); }}
                            className="hidden text-muted-foreground hover:text-destructive group-hover/child:block">
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                        {child.type === "text" && (
                          <textarea value={child.content} onChange={(e) => updateChild(ci, bi, { content: e.target.value })}
                            placeholder="Nội dung..." rows={2} onClick={(e) => e.stopPropagation()}
                            draggable={false}
                            className="mt-1 w-full resize-none rounded bg-muted/30 px-1.5 py-1 text-[10px] outline-none" />
                        )}
                        {child.type !== "text" && child.content && (
                          <p className="mt-0.5 truncate text-[9px] text-muted-foreground">{child.content}</p>
                        )}
                      </div>
                    </div>
                    {showAfter && <InsertLine />}
                  </div>
                );
              })}
              {items.length === 0 && isOverCol && dragRef.current && <InsertLine />}
              {items.length === 0 && !dragRef.current && (
                <div className="py-4 text-center">
                  <MoveVertical className="mx-auto h-3.5 w-3.5 text-primary/25" />
                  <p className="text-[9px] mt-0.5 text-primary/35">Kéo block vào</p>
                </div>
              )}
              <button onClick={() => addChild(ci)}
                className="mt-1 flex w-full items-center justify-center gap-1 rounded border border-dashed border-primary/20 py-1 text-[9px] text-primary/50 transition hover:border-primary/40 hover:text-primary">
                <Plus className="h-2.5 w-2.5" /> Thêm block
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InsertLine() {
  return (
    <div className="flex items-center gap-1 py-0.5">
      <div className="h-[2px] flex-1 rounded-full bg-primary" />
      <div className="h-2 w-2 rounded-full bg-primary" />
      <div className="h-[2px] flex-1 rounded-full bg-primary" />
    </div>
  );
}

/* ─── Accordion Block Editor ───────────────────────────────────── */

function AccordionBlockEditor({ block, onUpdate }: { block: CourseBlock; onUpdate: (p: Partial<CourseBlock>) => void }) {
  const items = block.accordionItems ?? [];
  const makeItemId = () => `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const setItem = (idx: number, patch: Partial<{ title: string; body: string }>) =>
    onUpdate({ accordionItems: items.map((it, i) => i === idx ? { ...it, ...patch } : it) });
  const addItem = () =>
    onUpdate({ accordionItems: [...items, { id: makeItemId(), title: `Mục ${items.length + 1}`, body: "" }] });
  const removeItem = (idx: number) =>
    onUpdate({ accordionItems: items.filter((_, i) => i !== idx) });

  return (
    <div className="space-y-2 p-3" onClick={(e) => e.stopPropagation()}>
      {items.map((it, idx) => (
        <div key={it.id} className="rounded-lg border border-border bg-muted/20 p-2 space-y-1.5">
          <div className="flex items-center gap-2">
            <input
              value={it.title}
              onChange={(e) => setItem(idx, { title: e.target.value })}
              placeholder="Tiêu đề mục..."
              className="flex-1 rounded-md border bg-card px-2.5 py-1.5 text-xs font-medium outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => removeItem(idx)}
              disabled={items.length <= 1}
              className="shrink-0 rounded p-1 text-muted-foreground transition hover:text-destructive disabled:opacity-30"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
          <textarea
            value={it.body}
            onChange={(e) => setItem(idx, { body: e.target.value })}
            placeholder="Nội dung mở rộng..."
            rows={2}
            className="w-full resize-none rounded-md border bg-card px-2.5 py-1.5 text-[11px] outline-none focus:border-primary"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-1 rounded-md border border-dashed px-2 py-1 text-[11px] text-muted-foreground transition hover:border-primary hover:text-primary"
      >
        <Plus className="h-3 w-3" /> Thêm mục
      </button>
    </div>
  );
}

/* ─── Process Block Editor ─────────────────────────────────────── */

function ProcessBlockEditor({ block, onUpdate }: { block: CourseBlock; onUpdate: (p: Partial<CourseBlock>) => void }) {
  const steps = block.processSteps ?? [];
  const makeStepId = () => `step_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const setStep = (idx: number, patch: Partial<{ title: string; body: string }>) =>
    onUpdate({ processSteps: steps.map((s, i) => i === idx ? { ...s, ...patch } : s) });
  const addStep = () =>
    onUpdate({ processSteps: [...steps, { id: makeStepId(), title: `Bước ${steps.length + 1}`, body: "" }] });
  const removeStep = (idx: number) =>
    onUpdate({ processSteps: steps.filter((_, i) => i !== idx) });

  return (
    <div className="space-y-2 p-3" onClick={(e) => e.stopPropagation()}>
      {steps.map((step, idx) => (
        <div key={step.id} className="flex gap-2">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {idx + 1}
            </div>
            {idx < steps.length - 1 && <div className="w-px flex-1 bg-border" />}
          </div>
          <div className="flex-1 space-y-1.5 pb-2">
            <div className="flex items-center gap-2">
              <input
                value={step.title}
                onChange={(e) => setStep(idx, { title: e.target.value })}
                placeholder="Tên bước..."
                className="flex-1 rounded-md border bg-card px-2.5 py-1.5 text-xs font-medium outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => removeStep(idx)}
                disabled={steps.length <= 1}
                className="shrink-0 rounded p-1 text-muted-foreground transition hover:text-destructive disabled:opacity-30"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
            <textarea
              value={step.body}
              onChange={(e) => setStep(idx, { body: e.target.value })}
              placeholder="Mô tả bước..."
              rows={2}
              className="w-full resize-none rounded-md border bg-card px-2.5 py-1.5 text-[11px] outline-none focus:border-primary"
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addStep}
        className="flex items-center gap-1 rounded-md border border-dashed px-2 py-1 text-[11px] text-muted-foreground transition hover:border-primary hover:text-primary"
      >
        <Plus className="h-3 w-3" /> Thêm bước
      </button>
    </div>
  );
}

/* ─── Flashcards Block Editor ──────────────────────────────────── */

function FlashcardsBlockEditor({ block, onUpdate }: { block: CourseBlock; onUpdate: (p: Partial<CourseBlock>) => void }) {
  const cards = block.flashcards ?? [];
  const makeCardId = () => `card_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const setCard = (idx: number, patch: Partial<{ front: string; back: string }>) =>
    onUpdate({ flashcards: cards.map((c, i) => i === idx ? { ...c, ...patch } : c) });
  const addCard = () =>
    onUpdate({ flashcards: [...cards, { id: makeCardId(), front: "Mặt trước", back: "Mặt sau" }] });
  const removeCard = (idx: number) =>
    onUpdate({ flashcards: cards.filter((_, i) => i !== idx) });

  return (
    <div className="space-y-2 p-3" onClick={(e) => e.stopPropagation()}>
      {cards.map((card, idx) => (
        <div key={card.id} className="rounded-lg border border-border bg-muted/20 p-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground">Thẻ {idx + 1}</span>
            <button
              type="button"
              onClick={() => removeCard(idx)}
              disabled={cards.length <= 1}
              className="rounded p-1 text-muted-foreground transition hover:text-destructive disabled:opacity-30"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
          <input
            value={card.front}
            onChange={(e) => setCard(idx, { front: e.target.value })}
            placeholder="Mặt trước (câu hỏi)..."
            className="w-full rounded-md border bg-primary/5 px-2.5 py-1.5 text-xs font-medium outline-none focus:border-primary"
          />
          <input
            value={card.back}
            onChange={(e) => setCard(idx, { back: e.target.value })}
            placeholder="Mặt sau (đáp án)..."
            className="w-full rounded-md border bg-card px-2.5 py-1.5 text-xs outline-none focus:border-primary"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addCard}
        className="flex items-center gap-1 rounded-md border border-dashed px-2 py-1 text-[11px] text-muted-foreground transition hover:border-primary hover:text-primary"
      >
        <Plus className="h-3 w-3" /> Thêm thẻ
      </button>
    </div>
  );
}
