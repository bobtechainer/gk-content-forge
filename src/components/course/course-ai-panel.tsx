import { useState } from "react";
import { Sparkles, Send, Plus, Loader2, BookOpen, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CourseAiPanel({ courseId: _courseId }: { courseId?: string }) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);

  const handleSend = () => {
    if (!prompt.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: prompt }]);
    setIsLoading(true);
    setPrompt("");
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Tôi đã tạo 3 block nội dung cho bài học này: 1 đoạn giới thiệu, 1 hình ảnh minh họa, và 1 callout tóm tắt. Bạn có thể chỉnh sửa trực tiếp trên canvas.",
        },
      ]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-3 py-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">AI Soạn bài</h3>
      </div>

      {/* Quick actions */}
      <div className="space-y-1.5 border-b p-3">
        <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs font-medium text-primary hover:bg-brand-50">
          <Wand2 className="h-3.5 w-3.5" />
          Tạo dàn ý bài học
        </Button>
        <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs font-medium text-callout-tip-fg hover:bg-callout-tip">
          <BookOpen className="h-3.5 w-3.5" />
          Soạn nội dung từ chủ đề
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Mô tả nội dung bài học để AI tạo blocks tự động
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={msg.role === "user"
              ? "max-w-[90%] rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground"
              : "max-w-[90%] rounded-lg border bg-muted/50 px-3 py-2 text-xs text-foreground"
            }>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Đang tạo...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-3">
        <div className="flex items-center gap-1.5">
          <button type="button" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-muted-foreground hover:bg-muted">
            <Plus className="h-4 w-4" />
          </button>
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Mô tả nội dung bài học..."
            className="h-8 text-xs"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!prompt.trim() || isLoading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
