import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Subscript,
  Superscript,
  Sigma,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichEditorProps {
  content?: string;
  placeholder?: string;
  onChange?: (html: string) => void;
  className?: string;
}

export function RichEditor({
  content = "",
  placeholder = "Nhập nội dung...",
  onChange,
  className,
}: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
      }),
      Underline,
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor: e }) => onChange?.(e.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[160px] outline-none px-4 py-3 focus:outline-none",
      },
    },
  });

  if (!editor) return null;

  return (
    <div className={cn("rounded-lg border bg-white", className)}>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const items = [
    {
      icon: Bold,
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive("bold"),
      title: "In đậm",
    },
    {
      icon: Italic,
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive("italic"),
      title: "In nghiêng",
    },
    {
      icon: UnderlineIcon,
      action: () => editor.chain().focus().toggleUnderline().run(),
      active: editor.isActive("underline"),
      title: "Gạch chân",
    },
    {
      icon: Strikethrough,
      action: () => editor.chain().focus().toggleStrike().run(),
      active: editor.isActive("strike"),
      title: "Gạch ngang",
    },
  ];

  return (
    <div className="flex items-center gap-0.5 border-b px-2 py-1.5">
      {items.map((item, i) => (
        <button
          key={i}
          type="button"
          onClick={item.action}
          title={item.title}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            item.active && "bg-blue-50 text-blue-700",
          )}
        >
          <item.icon className="h-3.5 w-3.5" />
        </button>
      ))}
      <div className="mx-1 h-4 w-px bg-border" />
      <button
        type="button"
        title="Chèn công thức toán học"
        className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Sigma className="h-3.5 w-3.5" />
        <span>Thêm công thức toán học</span>
      </button>
    </div>
  );
}
