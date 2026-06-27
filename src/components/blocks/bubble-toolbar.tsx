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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolbarButtonProps {
  isActive: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}

function ToolbarButton({ isActive, onClick, label, icon }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded transition-colors",
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
  if (!editor) return null;

  const buttons: {
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

  return (
    <BubbleMenu
      editor={editor}
      className="flex items-center gap-0.5 rounded-lg border bg-card px-1 py-0.5 shadow-md"
    >
      {buttons.map((btn, idx) => (
        <ToolbarButton
          key={idx}
          isActive={btn.isActive}
          onClick={btn.onClick}
          label={btn.label}
          icon={btn.icon}
        />
      ))}
    </BubbleMenu>
  );
}
