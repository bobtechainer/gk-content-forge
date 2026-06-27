import { useState } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { aiClient } from "@/lib/ai";
import { useQuiz } from "@/stores/quiz";
import { toast } from "sonner";

const DEFAULT_COUNT = 3;

export function AiPanel({ quizId }: { quizId?: string }) {
  const [sourceText, setSourceText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastCount, setLastCount] = useState(0);

  const addQuestion = useQuiz((s) => s.addQuestion);
  const updateQuestion = useQuiz((s) => s.updateQuestion);
  const questionsByQuiz = useQuiz((s) => s.questionsByQuiz);

  const handleGenerate = async () => {
    if (!sourceText.trim() || !quizId) return;

    setIsLoading(true);
    try {
      const items = await aiClient.quizFromContent({
        sourceText: sourceText.trim(),
        count: DEFAULT_COUNT,
      });

      const existingIds = new Set((questionsByQuiz[quizId] ?? []).map((q) => q.id));

      for (const item of items) {
        // Insert a new multiple_choice question
        addQuestion(quizId, "multiple_choice");

        // Find the question just added (it's the last one not in existingIds)
        const updated = useQuiz.getState().questionsByQuiz[quizId] ?? [];
        const newQ = [...updated].reverse().find((q) => !existingIds.has(q.id));
        if (!newQ) continue;
        existingIds.add(newQ.id);

        // Map CourseBlock quiz shape → Question shape
        const options = (item.quizOptions ?? []).map((text, idx) => ({
          id: String.fromCharCode(97 + idx), // 'a', 'b', 'c', ...
          text,
        }));
        const correctOption = options[item.quizCorrect ?? 0];

        updateQuestion(quizId, newQ.id, {
          prompt: item.content,
          options,
          correctOptionId: correctOption?.id ?? options[0]?.id,
        });
      }

      setLastCount(items.length);
      toast.success(`Đã thêm ${items.length} câu hỏi từ AI`);
    } catch {
      toast.error("Không thể tạo câu hỏi — thử lại sau");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-3 py-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Tạo câu hỏi bằng AI</h3>
      </div>

      {/* Empty state */}
      {lastCount === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Nhập nội dung bài học để AI tự động tạo {DEFAULT_COUNT} câu hỏi trắc nghiệm.
          </p>
        </div>
      )}

      {/* Success state */}
      {lastCount > 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center px-4 py-6 text-center">
          <p className="text-sm font-medium text-foreground">
            Đã thêm {lastCount} câu hỏi vào bộ đề.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Bạn có thể chỉnh sửa hoặc tạo thêm câu hỏi mới.
          </p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-1 items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Đang tạo câu hỏi…
        </div>
      )}

      {/* Input */}
      <div className="mt-auto border-t border-border p-3 space-y-2">
        <Textarea
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          placeholder="Dán nội dung bài học vào đây để AI tạo câu hỏi…"
          className="min-h-20 resize-none text-xs"
          disabled={isLoading}
        />
        <Button
          size="sm"
          className="w-full gap-1.5 bg-primary text-primary-foreground hover:bg-primary-hover"
          onClick={handleGenerate}
          disabled={!sourceText.trim() || isLoading || !quizId}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tạo…
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" /> Tạo {DEFAULT_COUNT} câu hỏi
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
