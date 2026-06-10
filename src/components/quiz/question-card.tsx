import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { Question } from "@/lib/types";
import { useQuiz } from "@/stores/quiz";

const TYPE_LABEL: Record<Question["type"], string> = {
  multiple_choice: "Trắc nghiệm",
  essay: "Tự luận",
  matching: "Ghép đôi",
  dropbox: "Hộp thả",
  drag_drop: "Kéo thả",
  ordering: "Sắp xếp",
  video: "Trả lời video",
  audio: "Trả lời ghi âm",
  recognition: "Nhận dạng",
  marker: "Điểm đánh dấu",
};

export function QuestionCard({
  question,
  index,
  quizId,
}: {
  question: Question;
  index: number;
  quizId: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  });
  const update = useQuiz((s) => s.updateQuestion);
  const del = useQuiz((s) => s.deleteQuestion);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border border-border bg-card shadow-sm ${isDragging ? "z-10 opacity-60" : ""}`}
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <button
          {...listeners}
          {...attributes}
          className="cursor-grab text-muted-foreground hover:text-foreground"
          aria-label="Kéo để sắp xếp"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {index + 1}
        </span>
        <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-xs font-medium text-[#2563EB]">
          {TYPE_LABEL[question.type]}
        </span>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          className="min-h-8 min-w-8 text-destructive"
          aria-label={`Xóa câu hỏi ${index + 1}`}
          onClick={() => del(quizId, question.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-3 p-4">
        <Input
          placeholder="Nội dung câu hỏi…"
          value={question.prompt}
          onChange={(e) => update(quizId, question.id, { prompt: e.target.value })}
          className="text-base font-medium"
        />
        <div className="flex h-20 items-center justify-center rounded-md border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
          <ImageIcon className="mr-1.5 h-4 w-4" />
          Kéo thả ảnh / video vào đây
        </div>

        {question.type === "multiple_choice" && question.options && (
          <div className="space-y-2">
            {question.options.map((opt, i) => {
              const isCorrect = question.correctOptionId === opt.id;
              return (
                <div
                  key={opt.id}
                  className={`flex items-center gap-2 rounded-md border p-2 transition ${isCorrect ? "border-[#10B981] bg-[#D1FAE5]/40" : "border-border bg-card"}`}
                >
                  <button
                    type="button"
                    onClick={() => update(quizId, question.id, { correctOptionId: opt.id })}
                    aria-label={`Đánh dấu đáp án ${String.fromCharCode(65 + i)} là đúng`}
                    aria-pressed={isCorrect}
                    className={`flex min-h-6 min-w-6 shrink-0 items-center justify-center rounded-full border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isCorrect ? "border-[#10B981] bg-[#10B981]" : "border-border"}`}
                  >
                    {isCorrect && <span className="h-2 w-2 rounded-full bg-white" />}
                  </button>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  <Input
                    value={opt.text}
                    onChange={(e) => {
                      const next = question.options!.map((o) =>
                        o.id === opt.id ? { ...o, text: e.target.value } : o,
                      );
                      update(quizId, question.id, { options: next });
                    }}
                    className="border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                  />
                </div>
              );
            })}
          </div>
        )}

        {question.type === "essay" && (
          <Textarea
            placeholder="Học sinh sẽ trả lời tại đây…"
            value={question.essayAnswer ?? ""}
            onChange={(e) => update(quizId, question.id, { essayAnswer: e.target.value })}
            rows={5}
            className="resize-none"
          />
        )}

        {question.type === "drag_drop" && question.pairs && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1.5 text-xs font-semibold text-muted-foreground">
                Các mục (kéo)
              </div>
              <div className="space-y-1.5">
                {question.pairs.map((p) => (
                  <Input
                    key={`l-${p.id}`}
                    value={p.left}
                    onChange={(e) => {
                      const next = question.pairs!.map((x) =>
                        x.id === p.id ? { ...x, left: e.target.value } : x,
                      );
                      update(quizId, question.id, { pairs: next });
                    }}
                    className="bg-[#EFF6FF]"
                  />
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-xs font-semibold text-muted-foreground">Vị trí (thả)</div>
              <div className="space-y-1.5">
                {question.pairs.map((p) => (
                  <Input
                    key={`r-${p.id}`}
                    value={p.right}
                    onChange={(e) => {
                      const next = question.pairs!.map((x) =>
                        x.id === p.id ? { ...x, right: e.target.value } : x,
                      );
                      update(quizId, question.id, { pairs: next });
                    }}
                    className="bg-muted/50"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs">Thời gian (s)</Label>
            <Input
              type="number"
              value={question.duration}
              onChange={(e) =>
                update(quizId, question.id, { duration: Number(e.target.value) || 0 })
              }
              className="h-7 w-20"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Label className="text-xs">Điểm</Label>
            <Input
              type="number"
              value={question.points}
              onChange={(e) => update(quizId, question.id, { points: Number(e.target.value) || 0 })}
              className="h-7 w-16"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Switch
              checked={question.required}
              onCheckedChange={(v) => update(quizId, question.id, { required: v })}
            />
            <Label className="text-xs">Bắt buộc</Label>
          </div>
        </div>
      </div>
    </div>
  );
}
