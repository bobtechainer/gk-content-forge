import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Send, Trash2, Bot, User, Lightbulb,
  Plus, Paperclip, FileText, BookOpen, Link2, X,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  type ChatMessage, type ChatAttachment,
  AI_ACTIONS, type AiAction,
  makeMsgId, streamText, thinkingDelay,
} from "@/lib/ai/streaming-utils";
import { cn } from "@/lib/utils";

/* ─── Mock responses ──────────────────────────────────────────────── */

const MOCK_RESPONSES: Record<string, string> = {
  page: "Tôi đã tạo một trang hoàn chỉnh gồm:\n📝 Giới thiệu\n🖼️ Hình ảnh minh họa\n💡 Callout\n❓ 3 câu hỏi\n🃏 5 thẻ ghi nhớ",
  text: "Nội dung văn bản chi tiết đã được tạo, viết theo phong cách dễ hiểu với ví dụ minh họa cụ thể.",
  image: "Block hình ảnh minh họa đã được tạo với sơ đồ và biểu đồ liên quan.",
  video: "Block video bài giảng đã tạo:\n• Giới thiệu (30s)\n• Nội dung chính (5 phút)\n• Tổng kết (1 phút)",
  audio: "Block audio podcast đã tạo, dạng giải thích tương tác.",
  "3d": "Mô hình 3D tương tác đã tạo. Có thể xoay, zoom và khám phá chi tiết.",
  flashcards: "Bộ 8 thẻ ghi nhớ:\n• 3 thẻ định nghĩa\n• 3 thẻ công thức\n• 2 thẻ ví dụ",
  quiz: "5 câu hỏi trắc nghiệm:\n• 2 Nhận biết\n• 2 Thông hiểu\n• 1 Vận dụng",
  outline: "Dàn ý bài học:\n1️⃣ Khởi động\n2️⃣ Kiến thức mới\n3️⃣ Luyện tập\n4️⃣ Vận dụng\n5️⃣ Tổng kết",
  process: "Quy trình 5 bước tuần tự đã được tạo.", accordion: "Accordion 4 mục đã tạo.",
  callout: "Callout nổi bật đã tạo.", columns: "Bố cục 2 cột so sánh đã tạo.",
  code: "Code snippet minh họa đã tạo.", scorm: "Gói SCORM tương tác đã tạo.",
};

const SUGGESTED_PROMPTS = [
  "Tạo bài giảng về phản ứng hóa học",
  "Viết nội dung về tốc độ phản ứng",
  "Tạo câu hỏi ôn tập Cấu tạo nguyên tử",
  "Tạo thẻ nhớ về bảng tuần hoàn",
];

const ATTACH_OPTIONS = [
  { type: "file" as const, label: "Thêm tài liệu", icon: Paperclip, mock: "bài-giảng.pdf" },
  { type: "text" as const, label: "Dán văn bản", icon: FileText, mock: "Văn bản đã dán" },
  { type: "textbook" as const, label: "Thêm SGK", icon: BookOpen, mock: "SGK Hóa học 10" },
  { type: "url" as const, label: "Thêm URL", icon: Link2, mock: "https://example.com" },
];

/* ─── Component ─────────────────────────────────────────────────── */

export function AiChatPanel({ className }: { className?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [selectedAction, setSelectedAction] = useState<AiAction | null>(null);
  const [showAttach, setShowAttach] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const attachRef = useRef<HTMLDivElement>(null);
  const actionsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isThinking]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (attachRef.current && !attachRef.current.contains(e.target as Node)) setShowAttach(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const doSend = useCallback(async (text: string, action?: AiAction, atts?: ChatAttachment[]) => {
    if (!text.trim() || isThinking) return;
    const prefix = action ? `${action.icon} ${action.label.replace("...", "")} ` : "";
    const userMsg: ChatMessage = {
      id: makeMsgId(), role: "user", content: prefix + text.trim(),
      timestamp: Date.now(), attachments: atts?.length ? atts : undefined,
    };
    setMessages((p) => [...p, userMsg]);
    setInput(""); setAttachments([]); setIsThinking(true);

    await thinkingDelay();
    const key = action?.id || Object.keys(MOCK_RESPONSES).find((k) => text.toLowerCase().includes(k)) || "text";
    const resp = MOCK_RESPONSES[key] || MOCK_RESPONSES.text;
    const aiId = makeMsgId();
    setMessages((p) => [...p, { id: aiId, role: "ai", content: "", streaming: true, timestamp: Date.now() }]);
    setIsThinking(false);

    await streamText(resp, (acc) => {
      setMessages((p) => p.map((m) => m.id === aiId ? { ...m, content: acc } : m));
    });
    setMessages((p) => p.map((m) => m.id === aiId ? { ...m, streaming: false } : m));
  }, [isThinking]);

  const handleSubmit = useCallback(() => {
    doSend(input, selectedAction ?? undefined, attachments);
  }, [input, selectedAction, attachments, doSend]);

  const scrollActions = (dir: "left" | "right") => {
    actionsScrollRef.current?.scrollBy({ left: dir === "left" ? -120 : 120, behavior: "smooth" });
  };

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground leading-tight">AI Trợ lý</h3>
            <p className="text-[10px] text-muted-foreground leading-tight">Demo mode</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            title="Xóa lịch sử"><Trash2 className="h-3.5 w-3.5" /></button>
        )}
      </div>

      {/* ── Quick Action Pills ── */}
      <div className="relative border-b px-1 py-2">
        <div className="flex items-center gap-1">
          <button onClick={() => scrollActions("left")}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground/50 hover:text-muted-foreground">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <div ref={actionsScrollRef}
            className="flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {AI_ACTIONS.map((a) => (
              <button key={a.id} type="button"
                onClick={() => { setSelectedAction(selectedAction?.id === a.id ? null : a); inputRef.current?.focus(); }}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-medium transition whitespace-nowrap",
                  selectedAction?.id === a.id
                    ? "border-violet-300 bg-violet-50 text-violet-700"
                    : "border-transparent bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}>
                <span className="text-xs">{a.icon}</span>
                <span>{a.label.replace("...", "").replace("Tạo ", "").replace("Viết ", "")}</span>
              </button>
            ))}
          </div>
          <button onClick={() => scrollActions("right")}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground/50 hover:text-muted-foreground">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {selectedAction && (
          <div className="mt-1.5 flex items-center gap-1.5 px-2">
            <span className="text-[10px] text-violet-600 font-medium">
              {selectedAction.icon} {selectedAction.label}
            </span>
            <button onClick={() => setSelectedAction(null)}
              className="flex h-4 w-4 items-center justify-center rounded-full text-violet-400 hover:bg-violet-100 hover:text-violet-600">
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        )}
      </div>

      {/* ── Chat Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">Hỏi hoặc chọn action ở trên</p>
            <p className="mt-1 text-[11px] text-muted-foreground text-center max-w-[220px]">
              Chọn loại nội dung cần tạo, rồi nhập chủ đề vào ô bên dưới
            </p>
            <div className="mt-4 space-y-1.5 w-full">
              {SUGGESTED_PROMPTS.map((p, i) => (
                <button key={i} type="button" onClick={() => doSend(p)}
                  className="flex w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left text-[11px] text-foreground transition hover:border-primary/30 hover:bg-accent">
                  <Lightbulb className="h-3.5 w-3.5 shrink-0 text-warning" />
                  <span>{p}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => <MsgBubble key={msg.id} msg={msg} />)
        )}
        <AnimatePresence>
          {isThinking && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-start gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100">
                <Bot className="h-3 w-3 text-primary" />
              </div>
              <div className="rounded-lg bg-muted px-3 py-2">
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Attachments row ── */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t px-3 pt-2">
            <div className="flex flex-wrap gap-1">
              {attachments.map((att, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                  {att.icon} <span className="max-w-[80px] truncate">{att.label}</span>
                  <button onClick={() => setAttachments((p) => p.filter((_, j) => j !== i))}
                    className="ml-0.5 text-muted-foreground hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input Area ── */}
      <div className="border-t px-3 py-2.5">
        <div className="flex items-end gap-2 rounded-xl border bg-card px-3 py-2 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition">
          {/* Attach button */}
          <div className="relative shrink-0 pb-0.5" ref={attachRef}>
            <button type="button" onClick={() => setShowAttach(!showAttach)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
              title="Thêm tài liệu">
              <Plus className="h-4 w-4" />
            </button>
            <AnimatePresence>
              {showAttach && (
                <motion.div initial={{ opacity: 0, y: 4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }} transition={{ duration: 0.12 }}
                  className="absolute bottom-full left-0 z-50 mb-2 w-[180px] rounded-xl border bg-card p-1 shadow-xl">
                  {ATTACH_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button key={opt.type} type="button"
                        onClick={() => {
                          const icons: Record<string, string> = { file: "📎", text: "📄", textbook: "📚", url: "🔗" };
                          setAttachments((p) => [...p, { type: opt.type, label: opt.mock, icon: icons[opt.type] }]);
                          setShowAttach(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] text-foreground transition hover:bg-accent">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{opt.label}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Textarea */}
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder={selectedAction ? `${selectedAction.label.replace("...", "")} gì?` : "Nhắn tin cho AI..."}
            disabled={isThinking}
            rows={1}
            className={cn(
              "min-w-0 flex-1 resize-none bg-transparent text-sm outline-none",
              "placeholder:text-muted-foreground/50 leading-snug",
              "max-h-[120px]",
              isThinking && "opacity-50",
            )}
          />

          {/* Send */}
          <button type="button" onClick={handleSubmit}
            disabled={!input.trim() || isThinking}
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition mb-0.5",
              input.trim() && !isThinking
                ? "bg-primary text-white hover:bg-primary/90 active:scale-95"
                : "text-muted-foreground/30",
            )}>
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-1 text-center text-[9px] text-muted-foreground/40">
          AI demo • Nội dung mẫu
        </p>
      </div>
    </div>
  );
}

/* ─── Message Bubble ──────────────────────────────────────────────── */

function MsgBubble({ msg }: { msg: ChatMessage }) {
  const isAi = msg.role === "ai";
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className={cn("flex items-start gap-2", !isAi && "flex-row-reverse")}>
      <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
        isAi ? "bg-violet-100" : "bg-blue-100")}>
        {isAi ? <Bot className="h-3 w-3 text-primary" /> : <User className="h-3 w-3 text-blue-600" />}
      </div>
      <div className={cn("min-w-0 max-w-[85%] rounded-xl px-3 py-2", isAi ? "bg-muted" : "bg-primary/10")}>
        {msg.attachments && msg.attachments.length > 0 && (
          <div className="mb-1 flex flex-wrap gap-1">
            {msg.attachments.map((att, i) => (
              <span key={i} className="inline-flex items-center gap-0.5 rounded-full bg-card border border-border px-1.5 py-0.5 text-[9px]">
                {att.icon} {att.label}
              </span>
            ))}
          </div>
        )}
        <p className="text-[12px] leading-relaxed whitespace-pre-wrap text-foreground">
          {msg.content}
          {msg.streaming && <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-primary" />}
        </p>
      </div>
    </motion.div>
  );
}
