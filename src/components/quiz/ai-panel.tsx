import { useState } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useQuiz } from "@/stores/quiz";

const CHIPS = ["Toán lớp 8", "Vật lý 11", "Lịch sử 10", "Hóa 12"];

export function AiPanel({ quizId }: { quizId: string }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const add = useQuiz((s) => s.addQuestion);

  const generate = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    add(quizId, "multiple_choice");
    setLoading(false);
    setText("");
  };

  return (
    <div className="flex h-full w-[280px] shrink-0 flex-col border-l border-border bg-sidebar">
      <div className="border-b border-border p-4">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-[#2563EB]" /> Tạo câu hỏi bằng AI
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Mô tả nội dung — AI sẽ tạo câu hỏi tự động
        </p>
      </div>
      <div className="space-y-3 p-4">
        <Textarea
          rows={4}
          placeholder="Ví dụ: Tạo câu hỏi trắc nghiệm về phương trình bậc hai…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="resize-none text-sm"
        />
        <Button
          onClick={generate}
          disabled={loading}
          className="w-full gap-1.5 bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tạo…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Tạo câu hỏi
            </>
          )}
        </Button>
        <div>
          <div className="mb-2 text-xs font-semibold text-muted-foreground">Gợi ý nhanh</div>
          <div className="flex flex-wrap gap-1.5">
            {CHIPS.map((c) => (
              <button
                key={c}
                onClick={() => setText(`Tạo câu hỏi về ${c}`)}
                className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-foreground hover:border-[#2563EB] hover:text-[#2563EB]"
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="space-y-2 rounded-md border border-border bg-card p-3">
            <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        )}
      </div>
    </div>
  );
}