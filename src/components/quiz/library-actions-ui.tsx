import { useState } from "react";
import { BookMarked, LibraryBig } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Question } from "@/lib/types";
import { useQuestionLibrary } from "@/stores/question-library";
import { useQuiz } from "@/stores/quiz";
import { insertLibraryQuestion } from "./library-actions";

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

/* ─── Save current question to library ────────────────────────── */

interface SaveToLibraryButtonProps {
  question: Question;
}

export function SaveToLibraryButton({ question }: SaveToLibraryButtonProps) {
  const add = useQuestionLibrary((s) => s.add);

  const handleSave = () => {
    add(question);
    toast.success("Đã lưu câu hỏi vào thư viện");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSave}
      className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
      aria-label="Lưu câu hỏi vào thư viện"
    >
      <BookMarked className="h-3.5 w-3.5" />
      Lưu vào thư viện
    </Button>
  );
}

/* ─── Insert from library picker ──────────────────────────────── */

interface InsertFromLibraryButtonProps {
  quizId: string;
}

export function InsertFromLibraryButton({ quizId }: InsertFromLibraryButtonProps) {
  const [open, setOpen] = useState(false);
  const libraryQuestions = useQuestionLibrary((s) => s.questions);
  const addQuestion = useQuiz((s) => s.addQuestion);
  const updateQuestion = useQuiz((s) => s.updateQuestion);
  const getQuestions = (qid: string) => useQuiz.getState().questionsByQuiz[qid] ?? [];

  const handlePick = (picked: Question) => {
    insertLibraryQuestion(quizId, picked, {
      addQuestion,
      updateQuestion,
      getQuestions,
    });
    setOpen(false);
    toast.success(`Đã chèn câu hỏi "${picked.prompt || "(chưa có nội dung)"}" từ thư viện`);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
        aria-label="Chèn câu hỏi từ thư viện"
      >
        <LibraryBig className="h-3.5 w-3.5" />
        Chèn từ thư viện
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Chèn từ thư viện câu hỏi</DialogTitle>
            <DialogDescription>
              Chọn câu hỏi để thêm vào bộ đề. Bản sao độc lập sẽ được tạo — thư viện không bị ảnh
              hưởng.
            </DialogDescription>
          </DialogHeader>

          {libraryQuestions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground">
              <LibraryBig className="h-8 w-8 opacity-40" />
              <p>Thư viện câu hỏi còn trống.</p>
              <p className="text-xs">
                Lưu câu hỏi từ bộ đề vào thư viện để dùng lại ở đây.
              </p>
            </div>
          ) : (
            <ul className="max-h-[420px] divide-y divide-border overflow-y-auto rounded-md border border-border">
              {libraryQuestions.map((q) => (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => handlePick(q)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                  >
                    <span className="mt-0.5 shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {TYPE_LABEL[q.type]}
                    </span>
                    <span className="min-w-0 flex-1 text-sm text-foreground">
                      {q.prompt || <span className="italic text-muted-foreground">(chưa có nội dung)</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
