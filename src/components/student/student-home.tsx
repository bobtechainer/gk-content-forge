import { useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, CalendarClock, Lightbulb, PlayCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CURRICULUM } from "@/lib/curriculum";
import { resolveDemoAccount } from "@/lib/mock-data";
import { usePageLoading } from "@/lib/use-page-loading";
import { useClassroom } from "@/stores/classroom";
import { useContent } from "@/stores/content";
import { useSession } from "@/stores/session";
import { AccessBadge } from "@/components/student/access-badge";
import { PageFrame } from "../shared/page-frame";
import { PageSkeleton } from "../shared/page-skeleton";
import { QualityBadge } from "../shared/quality-badge";

/**
 * Tài khoản học sinh demo được ánh xạ tới một học sinh cụ thể trong lớp mock
 * để các khối "tiếp tục học" và "bài tập cần làm" có dữ liệu thật.
 */
const DEMO_STUDENT_ID = "hs-03";

const STATUS_LABEL: Record<string, string> = {
  not_started: "Chưa bắt đầu",
  in_progress: "Đang làm dở",
  submitted: "Đã nộp, chờ chấm",
  graded: "Đã chấm",
};

export function StudentHomePage() {
  const loading = usePageLoading();
  const schoolRole = useSession((s) => s.schoolRole);
  const account = resolveDemoAccount("student", schoolRole);

  const seed = useClassroom((s) => s.seed);
  const classes = useClassroom((s) => s.classes);
  const assignments = useClassroom((s) => s.assignments);
  const submissions = useClassroom((s) => s.submissions);
  const items = useContent((s) => s.items);

  useEffect(() => seed(), [seed]);

  // Lớp của học sinh demo.
  const myClass = useMemo(
    () => classes.find((c) => c.studentIds.includes(DEMO_STUDENT_ID)),
    [classes],
  );

  // Bài tập còn phải làm (mọi trạng thái chưa được chấm).
  const todo = useMemo(() => {
    const mine = submissions.filter(
      (sub) => sub.studentId === DEMO_STUDENT_ID && sub.status !== "graded",
    );
    return mine
      .map((sub) => {
        const assignment = assignments.find((a) => a.id === sub.assignmentId);
        return assignment ? { sub, assignment } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [assignments, submissions]);

  // Bài học đang dở (lấy bài đầu tiên trong khung CT để minh hoạ "tiếp tục học").
  const focusLesson = useMemo(() => {
    const firstSubject = CURRICULUM[0]?.subjects[0];
    const firstChapter = firstSubject?.strands[0]?.chapters[0];
    return firstChapter?.lessons[0] ?? null;
  }, []);

  // Gợi ý bổ trợ: vài học liệu Tầng Gốc / đối tác để luyện thêm theo điểm yếu.
  const suggestions = useMemo(
    () =>
      items
        .filter((i) => i.status === "published" && (i.tier === "root" || i.tier === "partner"))
        .slice(0, 3),
    [items],
  );

  if (loading) return <PageSkeleton />;

  return (
    <PageFrame
      title={`Xin chào, ${account.name}`}
      description="Tiếp tục lộ trình học cá nhân hoá của bạn — bạn đang đi đúng hướng."
    >
      {/* Khối 1 — trọng tâm: tiếp tục học */}
      <Card className="overflow-hidden border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <PlayCircle className="h-7 w-7 text-primary" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Tiếp tục học
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {focusLesson?.title ?? "Mệnh đề"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {myClass ? `${myClass.subject} · ${myClass.grade}` : "Toán · Lớp 10"} — bạn đã hoàn
              thành 45% bài này. Học tiếp khoảng 10 phút để mở khoá phần kế.
            </p>
            <div className="max-w-md pt-1">
              <Progress value={45} />
            </div>
          </div>
          <Button size="lg" className="shrink-0" asChild>
            <Link to="/student/learn/$id" params={{ id: "seed-quiz-1" }}>
              Tiếp tục <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        {/* Khối 3 — bài tập cần làm */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="h-4.5 w-4.5 text-warning-700" /> Bài tập cần làm
              </CardTitle>
              <CardDescription>Giáo viên giao cho lớp {myClass?.name ?? ""} của bạn.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {todo.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Bạn đã hoàn thành mọi bài tập. Làm tốt lắm!
              </p>
            ) : (
              todo.map(({ sub, assignment }) => (
                <div
                  key={assignment.id}
                  className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">
                      {assignment.title}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <span>Hạn nộp {formatDate(assignment.dueDate)}</span>
                      <span aria-hidden>·</span>
                      <span>{STATUS_LABEL[sub.status]}</span>
                    </div>
                    {sub.status === "in_progress" && (
                      <div className="mt-2 max-w-[220px]">
                        <Progress value={sub.progress} />
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0" asChild>
                    <Link to="/student/learn/$id" params={{ id: assignment.contentId }}>
                      {sub.status === "in_progress" ? "Làm tiếp" : "Làm bài"}
                    </Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Khối 2 — gợi ý bổ trợ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4.5 w-4.5 text-primary" /> Gợi ý bổ trợ cho bạn
            </CardTitle>
            <CardDescription>Dựa trên những phần bạn còn chưa vững.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {suggestions.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2.5 rounded-lg border border-border p-3"
              >
                <div className="flex items-start gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
                    <BookOpen className="h-4.5 w-4.5 text-accent-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-sm font-medium text-foreground">
                      {item.title}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {item.subject} · {item.grade}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {item.qualityLabel && <QualityBadge label={item.qualityLabel} />}
                  <AccessBadge tier={item.tier} accessTerms={item.license?.accessTerms} />
                </div>
                <Button variant="outline" size="sm" className="mt-auto w-full" asChild>
                  <Link to="/student/learn/$id" params={{ id: item.id }}>
                    Học ngay
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageFrame>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}
