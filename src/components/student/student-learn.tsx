import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { usePageLoading } from "@/lib/use-page-loading";
import { cn } from "@/lib/utils";
import { useContent } from "@/stores/content";
import { partitionSections } from "@/stores/course";
import type { LessonSection } from "@/stores/course";
import type { PublishedLesson } from "@/lib/publish/snapshot";
import { BlockRenderer } from "@/components/blocks/block-renderer";
import { PageFrame } from "../shared/page-frame";
import { PageSkeleton } from "../shared/page-skeleton";

interface SavedProgress {
  /** id của section đã hoàn thành (dạng `lessonId:sectionIdx`) */
  completed: string[];
  /** chỉ số section đang học trong lesson hiện tại */
  currentSectionIdx: number;
  /** index lesson đang học */
  currentLessonIdx: number;
}

const STORAGE_PREFIX = "gk-learn-progress:";

function loadProgress(contentId: string): SavedProgress {
  if (typeof window === "undefined") return { completed: [], currentSectionIdx: 0, currentLessonIdx: 0 };
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + contentId);
    if (!raw) return { completed: [], currentSectionIdx: 0, currentLessonIdx: 0 };
    const parsed = JSON.parse(raw) as SavedProgress;
    return {
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      currentSectionIdx: typeof parsed.currentSectionIdx === "number" ? parsed.currentSectionIdx : 0,
      currentLessonIdx: typeof parsed.currentLessonIdx === "number" ? parsed.currentLessonIdx : 0,
    };
  } catch {
    return { completed: [], currentSectionIdx: 0, currentLessonIdx: 0 };
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

function sectionKey(lessonId: string, sectionIdx: number): string {
  return `${lessonId}:${sectionIdx}`;
}

interface LessonWithSections {
  lesson: PublishedLesson;
  sections: LessonSection[];
}

export function StudentLearnPage({ contentId }: { contentId: string }) {
  const loading = usePageLoading();
  const item = useContent((s) => s.items.find((i) => i.id === contentId));

  const [completed, setCompleted] = useState<string[]>([]);
  const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  /** blockId -> đã trả lời đúng chưa */
  const [quizResults, setQuizResults] = useState<Record<string, boolean>>({});

  const snapshot = item?.publishedSnapshot;

  // Tính lesson + sections
  const lessonsWithSections = useMemo<LessonWithSections[]>(() => {
    if (!snapshot) return [];
    return snapshot.lessons.map((lesson) => ({
      lesson,
      sections: partitionSections(lesson.blocks),
    }));
  }, [snapshot]);

  // Tổng số sections toàn khoá
  const totalSections = useMemo(
    () => lessonsWithSections.reduce((acc, l) => acc + l.sections.length, 0),
    [lessonsWithSections],
  );

  // Khôi phục tiến độ
  useEffect(() => {
    const saved = loadProgress(contentId);
    setCompleted(saved.completed);
    const clampedLessonIdx = Math.min(
      saved.currentLessonIdx,
      Math.max(0, lessonsWithSections.length - 1),
    );
    setCurrentLessonIdx(clampedLessonIdx);
    // Clamp currentSectionIdx theo số sections của lesson được khôi phục
    const lesson = lessonsWithSections[clampedLessonIdx];
    const maxSectionIdx = lesson ? lesson.sections.length - 1 : 0;
    const clampedSectionIdx = Math.min(Math.max(0, saved.currentSectionIdx), maxSectionIdx);
    setCurrentSectionIdx(clampedSectionIdx);
  }, [contentId, lessonsWithSections.length, lessonsWithSections]);

  // Lưu tiến độ
  useEffect(() => {
    saveProgress(contentId, { completed, currentSectionIdx, currentLessonIdx });
  }, [contentId, completed, currentSectionIdx, currentLessonIdx]);

  const overallPct = totalSections > 0 ? Math.round((completed.length / totalSections) * 100) : 0;

  const currentLessonData = lessonsWithSections[currentLessonIdx];
  const currentSection = currentLessonData?.sections[currentSectionIdx];
  const currentSectionKey = currentLessonData
    ? sectionKey(currentLessonData.lesson.id, currentSectionIdx)
    : null;

  // Quiz results cho section đang xem
  const handleQuizResult = useCallback((blockId: string, correct: boolean) => {
    setQuizResults((prev) => ({ ...prev, [blockId]: correct }));
  }, []);

  // Kiểm tra section hiện tại đã "pass" chưa:
  // - Nếu không có quiz block nào -> pass ngay
  // - Nếu có quiz block -> cần TẤT CẢ đúng
  const sectionPassed = useMemo(() => {
    if (!currentSection) return false;
    const quizBlocks = currentSection.blocks.filter((b) => b.type === "quiz");
    if (quizBlocks.length === 0) return true;
    return quizBlocks.every((b) => quizResults[b.id] === true);
  }, [currentSection, quizResults]);

  const isUnlocked = useCallback(
    (lessonIdx: number, sectionIdx: number): boolean => {
      if (lessonIdx === 0 && sectionIdx === 0) return true;
      const lessonData = lessonsWithSections[lessonIdx];
      if (!lessonData) return false;
      if (sectionIdx === 0) {
        // Bài học đầu tiên của lesson: cần lesson trước hoàn thành
        const prevLesson = lessonsWithSections[lessonIdx - 1];
        if (!prevLesson) return false;
        const lastSectionIdx = prevLesson.sections.length - 1;
        return completed.includes(sectionKey(prevLesson.lesson.id, lastSectionIdx));
      }
      return completed.includes(sectionKey(lessonData.lesson.id, sectionIdx - 1));
    },
    [completed, lessonsWithSections],
  );

  const markSectionDone = () => {
    if (!currentSectionKey || !currentLessonData) return;
    const newCompleted = completed.includes(currentSectionKey)
      ? completed
      : [...completed, currentSectionKey];
    setCompleted(newCompleted);

    const nextSectionIdx = currentSectionIdx + 1;
    if (nextSectionIdx < currentLessonData.sections.length) {
      setCurrentSectionIdx(nextSectionIdx);
      setQuizResults({});
      toast.success("Đã mở khoá phần tiếp theo.");
    } else {
      // Hết section của lesson này — sang lesson tiếp
      const nextLessonIdx = currentLessonIdx + 1;
      if (nextLessonIdx < lessonsWithSections.length) {
        setCurrentLessonIdx(nextLessonIdx);
        setCurrentSectionIdx(0);
        setQuizResults({});
        toast.success("Đã hoàn thành bài học, chuyển sang bài tiếp theo.");
      } else {
        toast.success("Bạn đã hoàn thành toàn bộ khoá học!");
      }
    }
  };

  if (loading) return <PageSkeleton />;

  // Không có snapshot -> nội dung chưa xuất bản
  if (!snapshot) {
    return (
      <PageFrame
        title={item?.title ?? "Nội dung"}
        description={`${item?.subject ?? ""} · ${item?.grade ?? ""}`}
        actions={
          <Button variant="outline" asChild>
            <Link to="/student/home">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Quay lại
            </Link>
          </Button>
        }
      >
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <Lock className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Nội dung chưa được xuất bản</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Giáo viên chưa xuất bản nội dung này. Vui lòng quay lại sau.
          </p>
          <Button variant="outline" asChild>
            <Link to="/student/home">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Về trang chủ
            </Link>
          </Button>
        </div>
      </PageFrame>
    );
  }

  const lessonTitle = item?.title ?? "Bài học";
  const lessonSubject = item?.subject ?? "";
  const lessonGrade = item?.grade ?? "";

  const isLastSection =
    currentLessonIdx === lessonsWithSections.length - 1 &&
    currentSectionIdx === (currentLessonData?.sections.length ?? 1) - 1;

  return (
    <PageFrame
      title={lessonTitle}
      description={`${lessonSubject}${lessonGrade ? ` · ${lessonGrade}` : ""} — học theo từng phần, mỗi phần mở khoá phần kế.`}
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
            Tiến độ: {completed.length}/{totalSections} phần
          </div>
          <div className="flex-1">
            <Progress value={overallPct} />
          </div>
          <div className="text-sm font-semibold text-primary">{overallPct}%</div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Danh sách lesson + section (gating) */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Nội dung khoá học</CardTitle>
            <CardDescription>Hoàn thành lần lượt để mở khoá.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {lessonsWithSections.map((lws, lessonIdx) => (
              <div key={lws.lesson.id} className="space-y-1">
                <div className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {lws.lesson.title}
                </div>
                {lws.sections.map((sec, secIdx) => {
                  const key = sectionKey(lws.lesson.id, secIdx);
                  const unlocked = isUnlocked(lessonIdx, secIdx);
                  const done = completed.includes(key);
                  const active = lessonIdx === currentLessonIdx && secIdx === currentSectionIdx;
                  const label = sec.title ?? `Phần ${secIdx + 1}`;
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={!unlocked}
                      onClick={() => {
                        if (!unlocked) return;
                        setCurrentLessonIdx(lessonIdx);
                        setCurrentSectionIdx(secIdx);
                        setQuizResults({});
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
                          secIdx + 1
                        ) : (
                          <Lock className="h-3.5 w-3.5" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Nội dung phần đang học */}
        {currentSection && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-4.5 w-4.5 text-primary" />
                  {currentSection.title ?? `Phần ${currentSectionIdx + 1}`}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentSection.blocks.map((block) => (
                  <BlockRenderer
                    key={block.id}
                    block={block}
                    mode="learn"
                    onQuizResult={(correct) => handleQuizResult(block.id, correct)}
                  />
                ))}
              </CardContent>
            </Card>

            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">
                {sectionPassed
                  ? "Bạn đã hoàn thành phần này — sẵn sàng sang phần kế tiếp."
                  : "Trả lời đúng mọi câu hỏi để mở khoá phần tiếp theo."}
              </p>
              <Button disabled={!sectionPassed} onClick={markSectionDone}>
                {isLastSection ? "Hoàn thành bài học" : "Đánh dấu hoàn thành phần"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageFrame>
  );
}
