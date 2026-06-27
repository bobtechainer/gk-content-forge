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

export function BubbleToolbar({ editor }: BubbleToolbarProps) {
  const [aiLoading, setAiLoading] = useState(false);

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

  async function handleCompanion(action: CompanionRequest["action"]) {
    if (aiLoading || !editor) return;
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, " ");
    if (!text) return;
    setAiLoading(true);
    try {
      const result = await aiClient.companionEdit({ text, action });
      editor.chain().focus().insertContentAt({ from, to }, result.text).run();
    } finally {
      setAiLoading(false);
    }
  }

  const aiButtons: {
    label: string;
    icon: React.ReactNode;
    action: CompanionRequest["action"];
  }[] = [
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
      className="flex items-center gap-0.5 rounded-lg border bg-card px-1 py-0.5 shadow-md"
      shouldShow={({ state }) => !state.selection.empty}
    >
      {formatButtons.map((btn) => (
        <ToolbarButton
          key={btn.label}
          isActive={btn.isActive}
          onClick={btn.onClick}
          label={btn.label}
          icon={btn.icon}
        />
      ))}
      <div className="mx-0.5 h-3 w-px bg-border" />
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
      {aiLoading && (
        <span className="ml-1 flex h-5 w-5 items-center justify-center text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        </span>
      )}
    </BubbleMenu>
  );
}
