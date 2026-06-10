import { useState } from "react";
import { Sparkles, Send, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AiPanel({ quizId: _quizId }: { quizId?: string }) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);

  const handleSend = () => {
    if (!prompt.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text: prompt }]);
    setIsLoading(true);
    setPrompt("");

    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Tôi đã tạo 3 câu hỏi trắc nghiệm dựa trên nội dung bạn cung cấp. Bạn có thể chỉnh sửa và thêm vào bộ đề.",
        },
      ]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-3 py-3">
        <Sparkles className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-foreground">Tạo câu hỏi bằng AI</h3>
      </div>

      {/* Quick actions */}
      <div className="space-y-2 border-b p-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-xs font-medium text-blue-700 hover:bg-blue-50"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Tạo câu hỏi trắc nghiệm với nội dung sau:
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Mô tả nội dung để AI tạo câu hỏi tự động
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                msg.role === "user"
                  ? "max-w-[90%] rounded-lg bg-blue-900 px-3 py-2 text-xs text-white"
                  : "max-w-[90%] rounded-lg border bg-muted/50 px-3 py-2 text-xs text-foreground"
              }
            >
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
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-muted-foreground hover:bg-muted"
          >
            <Plus className="h-4 w-4" />
          </button>
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Mô tả nội dung câu hỏi"
            className="h-8 text-xs"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!prompt.trim() || isLoading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
