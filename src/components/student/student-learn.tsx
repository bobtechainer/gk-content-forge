import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Lock,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { usePageLoading } from "@/lib/use-page-loading";
import { cn } from "@/lib/utils";
import { useContent } from "@/stores/content";
import { PageFrame } from "../shared/page-frame";
import { PageSkeleton } from "../shared/page-skeleton";

interface LearnQuestion {
  id: string;
  prompt: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
}

interface LearnSection {
  id: string;
  title: string;
  /** Đoạn đọc ngắn giới thiệu phần (mô phỏng nội dung bài giảng). */
  reading: string;
  questions: LearnQuestion[];
}

/**
 * Nội dung học mô phỏng (mock) cho prototype: 4 phần, mỗi phần có đoạn đọc và
 * câu hỏi trắc nghiệm để minh hoạ luồng gating + chấm điểm + giải thích tức thì.
 */
const SECTIONS: LearnSection[] = [
  {
    id: "s1",
    title: "Khởi động: Mệnh đề là gì?",
    reading:
      "Mệnh đề là một câu khẳng định có tính đúng hoặc sai, nhưng không thể vừa đúng vừa sai. Ví dụ: \"Số 6 chia hết cho 2\" là một mệnh đề đúng.",
    questions: [
      {
        id: "s1q1",
        prompt: "Câu nào sau đây là một mệnh đề?",
        options: [
          { id: "a", text: "Hôm nay trời đẹp quá!" },
          { id: "b", text: "Số 7 là số nguyên tố." },
          { id: "c", text: "Bạn có khoẻ không?" },
          { id: "d", text: "Hãy làm bài tập đi." },
        ],
        correctOptionId: "b",
        explanation:
          "Mệnh đề phải là câu khẳng định xác định được đúng/sai. \"Số 7 là số nguyên tố\" đúng, nên đó là mệnh đề.",
      },
    ],
  },
  {
    id: "s2",
    title: "Xác định tính đúng/sai",
    reading:
      "Để xác định một mệnh đề đúng hay sai, ta đối chiếu với kiến thức đã biết. Một mệnh đề chỉ nhận đúng một trong hai giá trị: đúng (Đ) hoặc sai (S).",
    questions: [
      {
        id: "s2q1",
        prompt: "Mệnh đề \"Mọi số tự nhiên đều là số chẵn\" là:",
        options: [
          { id: "a", text: "Đúng" },
          { id: "b", text: "Sai" },
        ],
        correctOptionId: "b",
        explanation: "Số 1, 3, 5… là số tự nhiên nhưng lẻ, nên mệnh đề này sai.",
      },
      {
        id: "s2q2",
        prompt: "Mệnh đề \"Số 12 chia hết cho 3\" là:",
        options: [
          { id: "a", text: "Đúng" },
          { id: "b", text: "Sai" },
        ],
        correctOptionId: "a",
        explanation: "12 = 3 × 4, nên 12 chia hết cho 3. Mệnh đề đúng.",
      },
    ],
  },
  {
    id: "s3",
    title: "Mệnh đề phủ định",
    reading:
      "Phủ định của mệnh đề P, kí hiệu là \"không P\", có giá trị ngược lại với P. Nếu P đúng thì phủ định của P sai và ngược lại.",
    questions: [
      {
        id: "s3q1",
        prompt: "Phủ định của mệnh đề \"5 là số chẵn\" là:",
        options: [
          { id: "a", text: "5 là số lẻ" },
          { id: "b", text: "5 không phải là số chẵn" },
          { id: "c", text: "5 lớn hơn 2" },
          { id: "d", text: "5 là số nguyên tố" },
        ],
        correctOptionId: "b",
        explanation:
          "Phủ định chỉ đảo giá trị đúng/sai của mệnh đề gốc: \"5 không phải là số chẵn\".",
      },
    ],
  },
  {
    id: "s4",
    title: "Vận dụng tổng hợp",
    reading:
      "Bạn đã nắm được khái niệm mệnh đề, cách xác định đúng/sai và phủ định. Hãy hoàn thành phần này để kết thúc bài học.",
    questions: [
      {
        id: "s4q1",
        prompt: "Mệnh đề nào sau đây sai?",
        options: [
          { id: "a", text: "Số 0 là số tự nhiên." },
          { id: "b", text: "Mọi hình vuông đều là hình chữ nhật." },
          { id: "c", text: "Số 9 là số nguyên tố." },
          { id: "d", text: "Tổng hai số chẵn là một số chẵn." },
        ],
        correctOptionId: "c",
        explanation: "9 = 3 × 3 nên 9 là hợp số, không phải số nguyên tố. Mệnh đề này sai.",
      },
    ],
  },
];

interface SavedProgress {
  completed: string[]; // id các phần đã hoàn thành
  current: number; // chỉ số phần đang học
}

const STORAGE_PREFIX = "gk-learn-progress:";

function loadProgress(contentId: string): SavedProgress {
  if (typeof window === "undefined") return { completed: [], current: 0 };
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + contentId);
    if (!raw) return { completed: [], current: 0 };
    const parsed = JSON.parse(raw) as SavedProgress;
    return {
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      current: typeof parsed.current === "number" ? parsed.current : 0,
    };
  } catch {
    return { completed: [], current: 0 };
  }
}

function saveProgress(contentId: string, progress: SavedProgress): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + contentId, JSON.stringify(progress));
  } catch {
    // bỏ qua lỗi storage trong prototype
  }
}

export function StudentLearnPage({ contentId }: { contentId: string }) {
  const loading = usePageLoading();
  const item = useContent((s) => s.items.find((i) => i.id === contentId));

  const [completed, setCompleted] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  // Lựa chọn + trạng thái nộp của từng câu trong phần đang học.
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});

  // Khôi phục tiến độ đã lưu khi mở bài.
  useEffect(() => {
    const saved = loadProgress(contentId);
    setCompleted(saved.completed);
    setCurrent(Math.min(saved.current, SECTIONS.length - 1));
  }, [contentId]);

  // Lưu tiến độ mỗi khi thay đổi.
  useEffect(() => {
    saveProgress(contentId, { completed, current });
  }, [contentId, completed, current]);

  const overallPct = Math.round((completed.length / SECTIONS.length) * 100);
  const section = SECTIONS[current];

  // Một phần coi là làm xong khi mọi câu đều đã nộp và đúng.
  const sectionAnsweredCorrectly = useMemo(() => {
    if (!section) return false;
    return section.questions.every(
      (q) => submitted[q.id] && answers[q.id] === q.correctOptionId,
    );
  }, [section, submitted, answers]);

  if (loading) return <PageSkeleton />;

  // Học liệu thật từ kho; nếu là bài giao seed (không phải item trong kho),
  // dùng tiêu đề/môn mặc định để luồng học mô phỏng vẫn chạy được.
  const lessonTitle = item?.title ?? "Luyện tập Mệnh đề";
  const lessonSubject = item?.subject ?? "Toán";
  const lessonGrade = item?.grade ?? "Lớp 10";

  const isUnlocked = (index: number): boolean =>
    index === 0 || completed.includes(SECTIONS[index - 1].id);

  const submitQuestion = (q: LearnQuestion) => {
    if (!answers[q.id]) {
      toast.error("Hãy chọn một đáp án trước khi kiểm tra.");
      return;
    }
    setSubmitted((s) => ({ ...s, [q.id]: true }));
  };

  const redoQuestion = (q: LearnQuestion) => {
    setSubmitted((s) => ({ ...s, [q.id]: false }));
    setAnswers((a) => {
      const next = { ...a };
      delete next[q.id];
      return next;
    });
  };

  const markSectionDone = () => {
    if (!section) return;
    setCompleted((c) => (c.includes(section.id) ? c : [...c, section.id]));
    const next = current + 1;
    if (next < SECTIONS.length) {
      setCurrent(next);
      setAnswers({});
      setSubmitted({});
      toast.success("Đã mở khoá phần tiếp theo.");
    } else {
      toast.success("Bạn đã hoàn thành toàn bộ bài học!");
    }
  };

  return (
    <PageFrame
      title={lessonTitle}
      description={`${lessonSubject} · ${lessonGrade} — học theo từng phần, mỗi phần mở khoá phần kế.`}
      actions={
        <Button variant="outline" asChild>
          <Link to="/student/home">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Quay lại
          </Link>
        </Button>
      }
    >
      {/* Thanh tiến trình tổng */}
      <Card>
        <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4">
          <div className="text-sm font-medium text-foreground">
            Tiến độ: {completed.length}/{SECTIONS.length} phần
          </div>
          <div className="flex-1">
            <Progress value={overallPct} />
          </div>
          <div className="text-sm font-semibold text-primary">{overallPct}%</div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Danh sách phần (gating) */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Các phần</CardTitle>
            <CardDescription>Hoàn thành lần lượt để mở khoá.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {SECTIONS.map((s, idx) => {
              const unlocked = isUnlocked(idx);
              const done = completed.includes(s.id);
              const active = idx === current;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => {
                    if (!unlocked) return;
                    setCurrent(idx);
                    setAnswers({});
                    setSubmitted({});
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg border p-2.5 text-left text-sm transition",
                    active ? "border-primary bg-primary/5" : "border-border",
                    unlocked ? "hover:bg-muted" : "cursor-not-allowed opacity-60",
                  )}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : unlocked ? (
                      idx + 1
                    ) : (
                      <Lock className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                    {s.title}
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Nội dung phần đang học */}
        {section && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-4.5 w-4.5 text-primary" /> {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{section.reading}</p>
              </CardContent>
            </Card>

            {section.questions.map((q, qi) => {
              const isSubmitted = submitted[q.id];
              const chosen = answers[q.id];
              const isCorrect = chosen === q.correctOptionId;
              return (
                <Card key={q.id}>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">
                      Câu {qi + 1}. {q.prompt}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <RadioGroup
                      value={chosen ?? ""}
                      onValueChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
                      disabled={isSubmitted}
                    >
                      {q.options.map((opt) => {
                        const showCorrect = isSubmitted && opt.id === q.correctOptionId;
                        const showWrong =
                          isSubmitted && opt.id === chosen && opt.id !== q.correctOptionId;
                        return (
                          <label
                            key={opt.id}
                            className={cn(
                              "flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition",
                              showCorrect && "border-success bg-success/10",
                              showWrong && "border-destructive bg-destructive/10",
                              !isSubmitted && "border-border hover:bg-muted",
                              isSubmitted && !showCorrect && !showWrong && "border-border",
                            )}
                          >
                            <RadioGroupItem value={opt.id} />
                            <span className="flex-1 text-foreground">{opt.text}</span>
                            {showCorrect && <CheckCircle2 className="h-4 w-4 text-success" />}
                            {showWrong && <XCircle className="h-4 w-4 text-destructive" />}
                          </label>
                        );
                      })}
                    </RadioGroup>

                    {isSubmitted && (
                      <div
                        className={cn(
                          "rounded-lg border p-3 text-sm",
                          isCorrect
                            ? "border-success/40 bg-success/10 text-foreground"
                            : "border-warning-100 bg-warning-100 text-warning-700",
                        )}
                      >
                        <div className="mb-1 font-semibold">
                          {isCorrect ? "Chính xác!" : "Chưa đúng — xem lại nhé"}
                        </div>
                        <p className={isCorrect ? "text-muted-foreground" : ""}>{q.explanation}</p>
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      {!isSubmitted ? (
                        <Button size="sm" onClick={() => submitQuestion(q)}>
                          Kiểm tra
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => redoQuestion(q)}>
                          <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Làm lại
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">
                {sectionAnsweredCorrectly
                  ? "Bạn đã trả lời đúng tất cả — sẵn sàng sang phần kế tiếp."
                  : "Trả lời đúng mọi câu để mở khoá phần tiếp theo."}
              </p>
              <Button disabled={!sectionAnsweredCorrectly} onClick={markSectionDone}>
                {current === SECTIONS.length - 1
                  ? "Hoàn thành bài học"
                  : "Đánh dấu hoàn thành phần"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageFrame>
  );
}
