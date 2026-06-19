import { useMemo } from "react";
import {
  Award,
  BookOpenCheck,
  Building2,
  Download,
  GraduationCap,
  Medal,
  Radio,
  Share2,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { QualityLabel } from "@/lib/types";
import { usePageLoading } from "@/lib/use-page-loading";
import { useContent } from "@/stores/content";
import { PageFrame } from "../shared/page-frame";
import { PageSkeleton } from "../shared/page-skeleton";
import { StatCard } from "../shared/stat-card";
import { QualityBadge } from "../shared/quality-badge";

const TEACHER_ID = "teacher";

/** Mock professional recognition for the demo profile. */
const AWARDS: { id: string; title: string; org: string; year: string }[] = [
  { id: "a1", title: "Giáo viên sáng tạo cấp tỉnh", org: "Sở GD&ĐT", year: "2025" },
  { id: "a2", title: "Học liệu số tiêu biểu", org: "Trường học số", year: "2024" },
];

/** Mock continuing-professional-development credits. */
const CPD_TARGET = 40;
const CPD_EARNED = 28;
const CPD_ACTIVITIES: { id: string; title: string; credits: number; date: string }[] = [
  { id: "c1", title: "Tập huấn xây dựng học liệu số theo CT GDPT 2018", credits: 12, date: "03/2026" },
  { id: "c2", title: "Hội thảo kiểm tra đánh giá theo năng lực", credits: 8, date: "01/2026" },
  { id: "c3", title: "Khóa bồi dưỡng ứng dụng AI trong dạy học", credits: 8, date: "11/2025" },
];

/** Mock contribution-competition score and milestone goal. */
const CONTRIBUTION_SCORE = 1850;
const CONTRIBUTION_GOAL = 2500;

/** Mock độ lan tỏa: số trường/lớp đang khai thác học liệu của giáo viên. */
const SCHOOLS_USING = 36;
const CLASSES_USING = 214;

export function TeacherRegistryPage() {
  const loading = usePageLoading();
  const items = useContent((s) => s.items);

  const myContent = useMemo(() => items.filter((i) => i.ownerId === TEACHER_ID), [items]);

  const totalViews = useMemo(
    () => myContent.reduce((sum, i) => sum + i.views, 0),
    [myContent],
  );
  const totalShares = useMemo(
    () => myContent.reduce((sum, i) => sum + i.shares, 0),
    [myContent],
  );

  const topContent = useMemo(
    () =>
      [...myContent]
        .sort((a, b) => b.views + b.shares * 5 - (a.views + a.shares * 5))
        .slice(0, 5),
    [myContent],
  );

  const labelCounts = useMemo(() => {
    const counts = new Map<QualityLabel, number>();
    for (const item of myContent) {
      if (item.qualityLabel) {
        counts.set(item.qualityLabel, (counts.get(item.qualityLabel) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [myContent]);

  if (loading) return <PageSkeleton />;

  const cpdPercent = Math.round((CPD_EARNED / CPD_TARGET) * 100);
  const contributionPercent = Math.round((CONTRIBUTION_SCORE / CONTRIBUTION_GOAL) * 100);

  return (
    <PageFrame
      title="Hồ sơ chuyên môn số"
      description="Tổng hợp đóng góp, ghi nhận và quá trình phát triển chuyên môn của bạn."
    >
      {/* Block 1 — Usage */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Học liệu đã đăng"
          value={myContent.length}
          icon={BookOpenCheck}
          accent="var(--primary)"
        />
        <StatCard
          label="Tổng lượt xem"
          value={totalViews}
          icon={Download}
          accent="var(--success)"
        />
        <StatCard
          label="Tổng lượt chia sẻ"
          value={totalShares}
          icon={Share2}
          accent="var(--colors-brand-900)"
        />
        <StatCard
          label="Điểm thi đua"
          value={CONTRIBUTION_SCORE}
          icon={Trophy}
          accent="var(--warning)"
        />
      </div>

      {/* Block — Mức độ lan tỏa & ảnh hưởng */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" /> Mức độ lan tỏa & ảnh hưởng
          </CardTitle>
          <CardDescription>
            Phạm vi trường, lớp đang khai thác học liệu của bạn và những học liệu được dùng nhiều
            nhất.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <StatCard
              label="Trường đang sử dụng"
              value={SCHOOLS_USING}
              icon={Building2}
              accent="var(--primary)"
            />
            <StatCard
              label="Lớp đang sử dụng"
              value={CLASSES_USING}
              icon={Users}
              accent="var(--colors-brand-900)"
            />
          </div>

          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Top học liệu được dùng nhiều nhất
            </div>
            {topContent.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Bạn chưa có học liệu nào được khai thác.
              </p>
            ) : (
              <ol className="space-y-2">
                {topContent.map((item, index) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">
                        {item.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.subject} • {item.grade}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-4 text-right">
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {item.views.toLocaleString("vi-VN")}
                        </div>
                        <div className="text-[11px] text-muted-foreground">lượt xem</div>
                      </div>
                      <div>
                        <div className="flex items-center justify-end gap-1 text-sm font-semibold text-foreground">
                          <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {item.shares.toLocaleString("vi-VN")}
                        </div>
                        <div className="text-[11px] text-muted-foreground">chia sẻ</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Block 2 — Labels & awards */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" /> Nhãn & giải thưởng
            </CardTitle>
            <CardDescription>
              Nhãn chất lượng học liệu của bạn và những ghi nhận chuyên môn.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Nhãn chất lượng học liệu
              </div>
              {labelCounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Chưa có học liệu nào được gắn nhãn chất lượng.
                </p>
              ) : (
                <ul className="space-y-2">
                  {labelCounts.map(([label, count]) => (
                    <li key={label} className="flex items-center justify-between gap-3">
                      <QualityBadge label={label} />
                      <span className="text-sm text-muted-foreground">
                        {count} học liệu
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-border pt-4">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Giải thưởng
              </div>
              <ul className="space-y-2">
                {AWARDS.map((award) => (
                  <li
                    key={award.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning-100 text-warning-700">
                      <Medal className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">
                        {award.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {award.org} • {award.year}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Block 3 — Contribution competition score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" /> Điểm thi đua đóng góp
            </CardTitle>
            <CardDescription>
              Điểm tích lũy từ học liệu được sử dụng và đánh giá tốt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border border-border bg-muted/30 p-5 text-center">
              <div className="text-4xl font-bold text-foreground">
                {CONTRIBUTION_SCORE.toLocaleString("vi-VN")}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">điểm thi đua tích lũy</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Mục tiêu năm học</span>
                <span className="font-medium text-foreground">
                  {CONTRIBUTION_SCORE.toLocaleString("vi-VN")} /{" "}
                  {CONTRIBUTION_GOAL.toLocaleString("vi-VN")}
                </span>
              </div>
              <Progress value={contributionPercent} />
              <p className="text-xs text-muted-foreground">
                Bạn đã đạt {contributionPercent}% mục tiêu. Tiếp tục đóng góp học liệu chất lượng để
                xếp hạng cao hơn trong tổ chuyên môn.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" /> Xếp hạng tổ
                </div>
                <div className="mt-1 text-lg font-semibold text-foreground">Hạng 2</div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Trophy className="h-3.5 w-3.5" /> Xếp hạng trường
                </div>
                <div className="mt-1 text-lg font-semibold text-foreground">Hạng 7</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Block 4 — CPD credits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" /> Điểm phát triển chuyên môn (CPD)
          </CardTitle>
          <CardDescription>
            Tín chỉ bồi dưỡng thường xuyên tích lũy trong năm học.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-muted/30 p-5 text-center">
              <div className="text-4xl font-bold text-foreground">
                {CPD_EARNED}
                <span className="text-lg font-medium text-muted-foreground"> / {CPD_TARGET}</span>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">tín chỉ CPD</div>
            </div>
            <Progress value={cpdPercent} />
            <p className="text-center text-xs text-muted-foreground">
              Còn {CPD_TARGET - CPD_EARNED} tín chỉ để hoàn thành định mức năm học.
            </p>
          </div>

          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Hoạt động đã ghi nhận
            </div>
            <ul className="space-y-2">
              {CPD_ACTIVITIES.map((activity) => (
                <li
                  key={activity.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <BookOpenCheck className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">
                      {activity.title}
                    </div>
                    <div className="text-xs text-muted-foreground">{activity.date}</div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="shrink-0 border-0 bg-primary/10 text-primary"
                  >
                    +{activity.credits} tín chỉ
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </PageFrame>
  );
}
