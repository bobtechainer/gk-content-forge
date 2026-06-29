import { useState } from "react";
import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Minimize2,
  Maximize2,
  Smile,
  BookOpen,
  CheckCheck,
  Wand2,
  Sparkles,
  Send,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { aiClient } from "@/lib/ai";
import type { CompanionRequest } from "@/lib/ai/types";

interface ToolbarButtonProps {
  isActive: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

function ToolbarButton({ isActive, onClick, label, icon, disabled }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted",
      )}
    >
      {icon}
    </button>
  );
}

interface BubbleToolbarProps {
  editor: Editor | null;
}

const FONT_SIZES: { label: string; value: string }[] = [
  { label: "Nhỏ", value: "14px" },
  { label: "Vừa", value: "16px" },
  { label: "Lớn", value: "20px" },
  { label: "Rất lớn", value: "28px" },
];

export function BubbleToolbar({ editor }: BubbleToolbarProps) {
  const [aiLoading, setAiLoading] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [ask, setAsk] = useState("");

  if (!editor) return null;

  const formatButtons: {
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
  }[] = [
    {
      label: "Đậm",
      icon: <Bold className="h-3.5 w-3.5" />,
      isActive: editor.isActive("bold"),
      onClick: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: "Nghiêng",
      icon: <Italic className="h-3.5 w-3.5" />,
      isActive: editor.isActive("italic"),
      onClick: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: "Gạch chân",
      icon: <Underline className="h-3.5 w-3.5" />,
      isActive: editor.isActive("underline"),
      onClick: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      label: "Tiêu đề 2",
      icon: <Heading2 className="h-3.5 w-3.5" />,
      isActive: editor.isActive("heading", { level: 2 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "Tiêu đề 3",
      icon: <Heading3 className="h-3.5 w-3.5" />,
      isActive: editor.isActive("heading", { level: 3 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      label: "Danh sách",
      icon: <List className="h-3.5 w-3.5" />,
      isActive: editor.isActive("bulletList"),
      onClick: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Danh sách số",
      icon: <ListOrdered className="h-3.5 w-3.5" />,
      isActive: editor.isActive("orderedList"),
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Mã",
      icon: <Code className="h-3.5 w-3.5" />,
      isActive: editor.isActive("code"),
      onClick: () => editor.chain().focus().toggleCode().run(),
    },
  ];

  function applyFontSize(value: string) {
    if (!editor || value === "") return;
    if (value === "reset") editor.chain().focus().unsetMark("fontSize").run();
    else editor.chain().focus().setMark("fontSize", { size: value }).run();
  }

  async function handleCompanion(action: CompanionRequest["action"], customPrompt?: string) {
    if (aiLoading || !editor) return;
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, " ");
    if (!text) return;
    setAiLoading(true);
    try {
      const result = await aiClient.companionEdit({ text, action, customPrompt });
      editor.chain().focus().insertContentAt({ from, to }, result.text).run();
    } finally {
      setAiLoading(false);
    }
  }

  async function submitAsk() {
    const q = ask.trim();
    if (!q) return;
    await handleCompanion("custom", q);
    setAsk("");
    setAskOpen(false);
  }

  const aiButtons: {
    label: string;
    icon: React.ReactNode;
    action: CompanionRequest["action"];
  }[] = [
    { label: "Soạn lại", icon: <Wand2 className="h-3.5 w-3.5" />, action: "rewrite" },
    { label: "Rút gọn", icon: <Minimize2 className="h-3.5 w-3.5" />, action: "shorten" },
    { label: "Mở rộng", icon: <Maximize2 className="h-3.5 w-3.5" />, action: "lengthen" },
    { label: "Thân thiện", icon: <Smile className="h-3.5 w-3.5" />, action: "tone-friendly" },
    { label: "Trang trọng", icon: <BookOpen className="h-3.5 w-3.5" />, action: "tone-formal" },
    { label: "Sửa lỗi", icon: <CheckCheck className="h-3.5 w-3.5" />, action: "fix" },
  ];

  const noSelection = editor.state?.selection?.empty ?? true;

  return (
    <BubbleMenu
      editor={editor}
      className="flex flex-col gap-1 rounded-lg border bg-card p-1 shadow-md"
      shouldShow={({ state }) => !state.selection.empty}
    >
      {/* Hàng 1: định dạng + cỡ chữ */}
      <div className="flex items-center gap-0.5">
        {formatButtons.map((btn) => (
          <ToolbarButton key={btn.label} isActive={btn.isActive} onClick={btn.onClick} label={btn.label} icon={btn.icon} />
        ))}
        <div className="mx-0.5 h-3 w-px bg-border" />
        <select
          aria-label="Cỡ chữ"
          title="Cỡ chữ"
          value=""
          onChange={(e) => applyFontSize(e.target.value)}
          className="h-7 rounded border border-border bg-card px-1 text-[11px] text-muted-foreground outline-none hover:text-foreground"
        >
          <option value="">Cỡ chữ</option>
          {FONT_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          <option value="reset">Mặc định</option>
        </select>
      </div>

      {/* Hàng 2: AI inline */}
      <div className="flex items-center gap-0.5">
        {aiButtons.map((btn) => (
          <ToolbarButton
            key={btn.label}
            isActive={false}
            onClick={() => { void handleCompanion(btn.action); }}
            label={btn.label}
            icon={btn.icon}
            disabled={noSelection || aiLoading}
          />
        ))}
        <div className="mx-0.5 h-3 w-px bg-border" />
        <button
          type="button"
          aria-label="Hỏi AI"
          title="Hỏi AI"
          onClick={() => setAskOpen((v) => !v)}
          disabled={noSelection || aiLoading}
          className={cn(
            "flex h-7 items-center gap-1 rounded px-1.5 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
            askOpen ? "bg-primary text-primary-foreground" : "text-primary hover:bg-muted",
          )}
        >
          <Sparkles className="h-3.5 w-3.5" /> Hỏi AI
        </button>
        {aiLoading && (
          <span className="ml-1 flex h-5 w-5 items-center justify-center text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          </span>
        )}
      </div>

      {/* Hàng 3: ô "Hỏi AI…" tự do */}
      {askOpen && (
        <div className="flex items-center gap-1 rounded-md border border-border bg-background px-1.5 py-1">
          <input
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void submitAsk(); } }}
            placeholder="Vd: viết lại trang trọng hơn…"
            autoFocus
            className="h-6 w-48 bg-transparent text-[11px] outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            aria-label="Gửi yêu cầu cho AI"
            onClick={() => void submitAsk()}
            disabled={!ask.trim() || aiLoading}
            className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground transition disabled:opacity-40"
          >
            <Send className="h-3 w-3" />
          </button>
        </div>
      )}
    </BubbleMenu>
  );
}
