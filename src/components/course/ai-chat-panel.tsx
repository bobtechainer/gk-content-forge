import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  Trash2,
  Bot,
  User,
  Lightbulb,
} from "lucide-react";
import {
  type ChatMessage,
  type ChatAttachment,
  type AiAction,
  makeMsgId,
  streamText,
  thinkingDelay,
} from "@/lib/ai/streaming-utils";
import { cn } from "@/lib/utils";

/* ─── Mock AI response templates ─────────────────────────────────── */

const MOCK_RESPONSES: Record<string, string> = {
  page: "Tôi đã tạo một trang hoàn chỉnh về chủ đề này bao gồm:\n\n📝 **Phần giới thiệu** — Tổng quan kiến thức cần nắm\n🖼️ **Hình ảnh minh họa** — Sơ đồ tư duy trực quan\n💡 **Callout quan trọng** — Những điểm cần lưu ý\n❓ **Câu hỏi tự kiểm tra** — 3 câu hỏi trắc nghiệm\n🃏 **Thẻ ghi nhớ** — 5 thẻ ôn tập nhanh\n\nBạn có thể chỉnh sửa từng block trong danh sách activities.",
  text: "Đây là nội dung văn bản chi tiết tôi đã tạo. Nội dung được viết theo phong cách dễ hiểu, phù hợp với đối tượng học sinh. Mỗi đoạn đều có ví dụ minh họa cụ thể và liên hệ thực tế.",
  image: "Tôi đã tạo một block hình ảnh minh họa cho chủ đề này. Hình ảnh bao gồm sơ đồ, biểu đồ và hình vẽ liên quan giúp học sinh dễ hình dung nội dung bài học.",
  video: "Tôi đã tạo block video bài giảng. Video sẽ bao gồm:\n• Phần giới thiệu (30s)\n• Nội dung chính (5 phút)\n• Tổng kết và câu hỏi (1 phút)\n\nTổng thời lượng dự kiến: ~7 phút.",
  audio: "Tôi đã tạo block audio podcast về chủ đề này. Audio dạng giải thích tương tác, phù hợp để học sinh nghe ôn tập trên đường đi.",
  "3d": "Tôi đã tạo mô hình 3D tương tác. Học sinh có thể xoay, zoom và khám phá chi tiết mô hình. Đi kèm chú thích cho từng phần.",
  flashcards: "Tôi đã tạo bộ 8 thẻ ghi nhớ bao gồm:\n• 3 thẻ định nghĩa\n• 3 thẻ công thức\n• 2 thẻ ví dụ\n\nMỗi thẻ có mặt trước (câu hỏi) và mặt sau (câu trả lời).",
  quiz: "Tôi đã tạo 5 câu hỏi trắc nghiệm với các mức độ:\n• 2 câu Nhận biết\n• 2 câu Thông hiểu\n• 1 câu Vận dụng\n\nMỗi câu có giải thích đáp án chi tiết.",
  outline: "Dàn ý bài học đã được tạo:\n\n1️⃣ **Khởi động** — Câu hỏi kích hoạt tư duy\n2️⃣ **Kiến thức mới** — Trình bày lý thuyết core\n3️⃣ **Luyện tập** — Bài tập áp dụng\n4️⃣ **Vận dụng** — Liên hệ thực tế\n5️⃣ **Tổng kết** — Ghi nhớ key points",
  process: "Quy trình đã được tạo với 5 bước tuần tự, mỗi bước có mô tả chi tiết và hướng dẫn thực hiện.",
  accordion: "Đã tạo accordion với 4 mục có thể mở/đóng, mỗi mục chứa nội dung giải thích chi tiết.",
  callout: "Đã tạo callout nổi bật với nội dung cần lưu ý quan trọng cho bài học.",
  columns: "Đã tạo bố cục 2 cột so sánh song song, giúp học sinh dễ đối chiếu nội dung.",
  code: "Đã tạo code snippet minh họa với syntax highlighting và chú thích từng dòng.",
  scorm: "Đã tạo gói SCORM tương tác bao gồm nội dung bài học, câu hỏi tương tác và tracking tiến độ.",
};

const SUGGESTED_PROMPTS = [
  "Tạo bài giảng về phản ứng hóa học",
  "Viết nội dung giới thiệu tốc độ phản ứng",
  "Tạo câu hỏi ôn tập chương Cấu tạo nguyên tử",
  "Tạo thẻ nhớ về bảng tuần hoàn",
];

/* ─── Props ─────────────────────────────────────────────────────── */

interface AiChatPanelProps {
  className?: string;
}

/* ─── Component ─────────────────────────────────────────────────── */

export function AiChatPanel({ className }: AiChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSend = useCallback(async (text?: string) => {
    const content = text || input.trim();
    if (!content || isThinking) return;

    const userMsg: ChatMessage = {
      id: makeMsgId(),
      role: "user",
      content,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);

    // Simulate AI thinking
    await thinkingDelay();

    // Determine which mock response to use
    const actionKey = Object.keys(MOCK_RESPONSES).find((key) =>
      content.toLowerCase().includes(key)
    ) || "text";
    const fullResponse = MOCK_RESPONSES[actionKey] || MOCK_RESPONSES.text;

    // Create AI message placeholder
    const aiMsgId = makeMsgId();
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      role: "ai",
      content: "",
      streaming: true,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, aiMsg]);
    setIsThinking(false);

    // Stream the response
    await streamText(fullResponse, (accumulated) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId ? { ...m, content: accumulated } : m
        )
      );
    });

    // Mark as done streaming
    setMessages((prev) =>
      prev.map((m) =>
        m.id === aiMsgId ? { ...m, streaming: false } : m
      )
    );
  }, [input, isThinking]);

  const clearHistory = () => {
    setMessages([]);
  };

  /** Handle an external command bar submission. */
  const handleCommandBarAction = useCallback(async (action: AiAction, prompt: string, attachments: ChatAttachment[]) => {
    const content = `${action.icon} ${action.label.replace("...", "")} ${prompt}`;
    const userMsg: ChatMessage = {
      id: makeMsgId(),
      role: "user",
      content,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    await thinkingDelay();

    const fullResponse = MOCK_RESPONSES[action.id] || MOCK_RESPONSES.text;
    const aiMsgId = makeMsgId();
    setMessages((prev) => [...prev, { id: aiMsgId, role: "ai", content: "", streaming: true, timestamp: Date.now() }]);
    setIsThinking(false);

    await streamText(fullResponse, (accumulated) => {
      setMessages((prev) => prev.map((m) => m.id === aiMsgId ? { ...m, content: accumulated } : m));
    });

    setMessages((prev) => prev.map((m) => m.id === aiMsgId ? { ...m, streaming: false } : m));
  }, []);

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-[var(--builder-radius-sm)] bg-gradient-to-br from-violet-500 to-indigo-500">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">AI Trợ lý</h3>
            <p className="text-[10px] text-muted-foreground">Demo mode</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearHistory}
            className="flex h-7 w-7 items-center justify-center rounded-[var(--builder-radius-sm)] text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            title="Xóa lịch sử"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50">
              <Bot className="h-7 w-7 text-primary" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">AI Trợ lý soạn bài</p>
            <p className="mt-1 text-xs text-muted-foreground text-center max-w-[200px]">
              Hỏi bất kỳ điều gì hoặc dùng thanh lệnh phía dưới
            </p>

            {/* Suggested prompts */}
            <div className="mt-5 space-y-1.5 w-full">
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="flex w-full items-center gap-2 rounded-[var(--builder-radius-sm)] border border-border bg-card px-3 py-2.5 text-left text-xs text-foreground transition hover:border-primary/30 hover:bg-accent"
                >
                  <Lightbulb className="h-3.5 w-3.5 shrink-0 text-warning" />
                  <span>{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}

        {/* Thinking indicator */}
        <AnimatePresence>
          {isThinking && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex items-start gap-2"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-indigo-100">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="rounded-[var(--builder-radius)] bg-muted px-3 py-2.5">
                <ThinkingDots />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="border-t px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Nhắn tin cho AI..."
            disabled={isThinking}
            className={cn(
              "min-w-0 flex-1 rounded-[var(--builder-radius)] border bg-card px-3 py-2 text-xs outline-none transition",
              "border-border placeholder:text-muted-foreground/50",
              "focus:border-primary/50 focus:ring-2 focus:ring-primary/10",
              isThinking && "opacity-50",
            )}
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!input.trim() || isThinking}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-[var(--builder-radius-sm)] transition",
              input.trim() && !isThinking
                ? "bg-primary text-white hover:bg-primary/90 active:scale-95"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Message Bubble ─────────────────────────────────────────────── */

function MessageBubble({ message }: { message: ChatMessage }) {
  const isAi = message.role === "ai";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex items-start gap-2", !isAi && "flex-row-reverse")}
    >
      <div className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
        isAi
          ? "bg-gradient-to-br from-violet-100 to-indigo-100"
          : "bg-gradient-to-br from-blue-100 to-cyan-100",
      )}>
        {isAi ? <Bot className="h-3.5 w-3.5 text-primary" /> : <User className="h-3.5 w-3.5 text-blue-600" />}
      </div>

      <div className={cn(
        "min-w-0 max-w-[85%] rounded-[var(--builder-radius)] px-3 py-2.5",
        isAi ? "bg-muted" : "bg-primary/10",
      )}>
        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1">
            {message.attachments.map((att, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-full bg-card border border-border px-2 py-0.5 text-[10px]">
                {att.icon} {att.label}
              </span>
            ))}
          </div>
        )}

        <p className={cn(
          "text-xs leading-relaxed whitespace-pre-wrap",
          isAi ? "text-foreground" : "text-foreground",
        )}>
          {message.content}
          {message.streaming && (
            <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-primary" />
          )}
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Thinking Dots ──────────────────────────────────────────────── */

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

// Re-export the ref handle for parent component to call command bar actions
export type AiChatPanelHandle = {
  handleCommandBarAction: (action: AiAction, prompt: string, attachments: ChatAttachment[]) => Promise<void>;
};
