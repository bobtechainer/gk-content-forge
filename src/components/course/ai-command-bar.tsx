import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Plus,
  Settings,
  Send,
  Paperclip,
  FileText,
  BookOpen,
  Link2,
  X,
} from "lucide-react";
import { AI_ACTIONS, type AiAction, type ChatAttachment } from "@/lib/ai/streaming-utils";
import { cn } from "@/lib/utils";

/* ─── Props ─────────────────────────────────────────────────────── */

interface AiCommandBarProps {
  onSubmit: (action: AiAction, prompt: string, attachments: ChatAttachment[]) => void;
  disabled?: boolean;
}

/* ─── Attachment menu items ─────────────────────────────────────── */

const ATTACHMENT_OPTIONS: { type: ChatAttachment["type"]; label: string; icon: typeof Paperclip; iconEmoji: string }[] = [
  { type: "file", label: "Thêm tài liệu", icon: Paperclip, iconEmoji: "📎" },
  { type: "text", label: "Dán văn bản", icon: FileText, iconEmoji: "📄" },
  { type: "textbook", label: "Thêm sách giáo khoa", icon: BookOpen, iconEmoji: "📚" },
  { type: "url", label: "Thêm URL", icon: Link2, iconEmoji: "🔗" },
];

/* ─── Component ─────────────────────────────────────────────────── */

export function AiCommandBar({ onSubmit, disabled }: AiCommandBarProps) {
  const [selectedAction, setSelectedAction] = useState<AiAction>(AI_ACTIONS[0]);
  const [prompt, setPrompt] = useState("");
  const [showActions, setShowActions] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const attachRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) setShowActions(false);
      if (attachRef.current && !attachRef.current.contains(e.target as Node)) setShowAttachMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!prompt.trim() || disabled) return;
    onSubmit(selectedAction, prompt.trim(), attachments);
    setPrompt("");
    setAttachments([]);
  }, [prompt, selectedAction, attachments, disabled, onSubmit]);

  const addAttachment = (type: ChatAttachment["type"], label: string) => {
    const icons: Record<string, string> = { file: "📎", text: "📄", textbook: "📚", url: "🔗" };
    setAttachments((prev) => [...prev, { type, label, icon: icons[type] }]);
    setShowAttachMenu(false);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t bg-[var(--ai-bar-bg)] px-4 py-2.5">
      {/* Attachments row */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-2 flex flex-wrap gap-1.5 overflow-hidden"
          >
            {attachments.map((att, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground"
              >
                <span>{att.icon}</span>
                <span className="max-w-[120px] truncate">{att.label}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2">
        {/* Action selector dropdown */}
        <div className="relative shrink-0" ref={actionsRef}>
          <button
            type="button"
            onClick={() => setShowActions(!showActions)}
            className={cn(
              "flex items-center gap-1.5 rounded-[var(--builder-radius-sm)] border px-3 py-2 text-xs font-medium transition",
              "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent",
            )}
          >
            <span>{selectedAction.icon}</span>
            <span className="hidden sm:inline max-w-[140px] truncate">{selectedAction.label.replace("...", "")}</span>
            <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition", showActions && "rotate-180")} />
          </button>

          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-0 z-50 mb-2 w-[260px] rounded-[var(--builder-radius)] border bg-card p-1.5 shadow-xl"
              >
                <div className="max-h-[320px] overflow-y-auto">
                  {AI_ACTIONS.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => { setSelectedAction(action); setShowActions(false); inputRef.current?.focus(); }}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-[var(--builder-radius-sm)] px-3 py-2 text-left text-xs transition",
                        "hover:bg-accent",
                        selectedAction.id === action.id && "bg-accent font-medium",
                      )}
                    >
                      <span className="text-base">{action.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-foreground">{action.label}</div>
                        <div className="text-[10px] text-muted-foreground">{action.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input */}
        <div className="relative min-w-0 flex-1">
          <input
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder="Nhập chủ đề hoặc yêu cầu..."
            disabled={disabled}
            className={cn(
              "w-full rounded-[var(--builder-radius)] border bg-card px-4 py-2.5 text-sm outline-none transition",
              "border-border placeholder:text-muted-foreground/60",
              "focus:border-primary/50 focus:ring-2 focus:ring-primary/10",
              disabled && "opacity-50 cursor-not-allowed",
            )}
          />
        </div>

        {/* Attachment button */}
        <div className="relative shrink-0" ref={attachRef}>
          <button
            type="button"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-[var(--builder-radius-sm)] border border-border text-muted-foreground transition",
              "hover:border-primary/40 hover:bg-accent hover:text-foreground",
            )}
            title="Thêm tài liệu tham khảo"
          >
            <Plus className="h-4 w-4" />
          </button>

          <AnimatePresence>
            {showAttachMenu && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ duration: 0.12 }}
                className="absolute bottom-full right-0 z-50 mb-2 w-[200px] rounded-[var(--builder-radius)] border bg-card p-1.5 shadow-xl"
              >
                {ATTACHMENT_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => {
                        // For demo, mock the attachment label
                        const labels: Record<string, string> = {
                          file: "bài-giảng.pdf",
                          text: "Văn bản đã dán",
                          textbook: "SGK Hóa học 10",
                          url: "https://example.com",
                        };
                        addAttachment(opt.type, labels[opt.type]);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-[var(--builder-radius-sm)] px-3 py-2.5 text-left text-xs text-foreground transition hover:bg-accent"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{opt.label}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Settings */}
        <button
          type="button"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-[var(--builder-radius-sm)] border border-border text-muted-foreground transition",
            "hover:border-primary/40 hover:bg-accent hover:text-foreground",
          )}
          title="Cài đặt AI"
        >
          <Settings className="h-4 w-4" />
        </button>

        {/* Send */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!prompt.trim() || disabled}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-[var(--builder-radius)] transition",
            prompt.trim() && !disabled
              ? "bg-primary text-white shadow-sm hover:bg-primary/90 active:scale-95"
              : "bg-muted text-muted-foreground cursor-not-allowed",
          )}
          title="Gửi yêu cầu"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-1.5 text-center text-[10px] text-muted-foreground/50">
        AI đang ở chế độ demo • Nội dung được tạo từ dữ liệu mẫu
      </p>
    </div>
  );
}
