import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight, ClipboardCheck, GraduationCap, MousePointerClick, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageLoading } from "@/lib/use-page-loading";
import { PageFrame } from "../shared/page-frame";
import { PageSkeleton } from "../shared/page-skeleton";
import { StatCard } from "../shared/stat-card";

interface TeacherRank {
  id: string;
  name: string;
  shortName: string;
  subject: string;
  materials: number;
  points: number;
}

const TEACHER_RANKING: TeacherRank[] = [
  { id: "gv-01", name: "Hoàng Xuân Nhi", shortName: "HN", subject: "Toán", materials: 28, points: 1240 },
  { id: "gv-02", name: "Trần Minh Đức", shortName: "MĐ", subject: "Vật lý", materials: 21, points: 980 },
  { id: "gv-03", name: "Lê Thu Hằng", shortName: "TH", subject: "Ngữ văn", materials: 19, points: 910 },
  { id: "gv-04", name: "Phạm Quốc Bảo", shortName: "QB", subject: "Hóa học", materials: 14, points: 720 },
  { id: "gv-05", name: "Vũ Diệu Linh", shortName: "DL", subject: "Tiếng Anh", materials: 11, points: 605 },
];

// Tiến độ học tập trung bình theo khối (mock) — đơn vị: % hoàn thành lộ trình.
const PROGRESS_BY_GRADE = [
  { grade: "Khối 10", hoanThanh: 72, dangHoc: 21 },
  { grade: "Khối 11", hoanThanh: 64, dangHoc: 28 },
  { grade: "Khối 12", hoanThanh: 81, dangHoc: 14 },
];

// Tồn đọng duyệt nội bộ theo từng cấp (mock).
const REVIEW_BACKLOG = [
  { label: "Chờ tổ trưởng duyệt", count: 7 },
  { label: "Chờ trường chốt", count: 3 },
];

export function SchoolDashboardPage() {
  const loading = usePageLoading();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (loading) return <PageSkeleton />;

  const backlogTotal = REVIEW_BACKLOG.reduce((sum, r) => sum + r.count, 0);

  return (
    <PageFrame
      title="Tổng quan nhà trường"
      description="Mức độ tham gia, thi đua đóng góp và tiến độ học tập của toàn trường."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tỷ lệ giáo viên tham gia"
          value="92%"
          icon={GraduationCap}
          accent="var(--primary)"
          trend="+5% so với tháng trước"
          trendUp
        />
        <StatCard
          label="Tỷ lệ học sinh tham gia"
          value="86%"
          icon={Users}
          accent="var(--success)"
          trend="+3% so với tháng trước"
          trendUp
        />
        <StatCard
          label="Lượt tương tác toàn trường"
          value="48.7k"
          icon={MousePointerClick}
          accent="var(--colors-brand-900)"
        />
        <StatCard
          label="Tồn đọng duyệt nội bộ"
          value={backlogTotal}
          icon={ClipboardCheck}
          accent="var(--warning)"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-warning" /> Thi đua đóng góp
              </CardTitle>
              <CardDescription>Xếp hạng giáo viên theo số học liệu và điểm đóng góp</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">Giáo viên</th>
                    <th className="px-4 py-3 font-medium">Môn</th>
                    <th className="px-4 py-3 text-right font-medium">Học liệu</th>
                    <th className="px-4 py-3 text-right font-medium">Điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {TEACHER_RANKING.map((t, i) => (
                    <tr key={t.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <span
                          className={
                            i < 3
                              ? "flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
                              : "flex h-6 w-6 items-center justify-center text-xs font-medium text-muted-foreground"
                          }
                        >
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                            {t.shortName}
                          </span>
                          <span className="font-medium text-foreground">{t.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{t.subject}</td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">{t.materials}</td>
                      <td className="px-4 py-3 text-right font-semibold text-primary">
                        {t.points.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Tồn đọng duyệt nội bộ</CardTitle>
              <CardDescription>Học liệu đang chờ xử lý qua hai cấp</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/school/review">
                Mở duyệt <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {REVIEW_BACKLOG.map((r) => (
              <div
                key={r.label}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning-100 text-warning-700">
                    <ClipboardCheck className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium text-foreground">{r.label}</span>
                </div>
                <span className="text-lg font-bold text-foreground">{r.count}</span>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Tổ trưởng duyệt cấp tổ trước, sau đó nhà trường chốt và chuyển lên Hội đồng thẩm định.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tổng hợp tiến độ học tập học sinh</CardTitle>
          <CardDescription>Tỷ lệ hoàn thành lộ trình theo từng khối lớp</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="h-64 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={PROGRESS_BY_GRADE} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="grade"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    unit="%"
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="hoanThanh" name="Hoàn thành" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="dangHoc" name="Đang học" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-full w-full rounded-lg" />
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {PROGRESS_BY_GRADE.map((g) => (
              <div key={g.grade} className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{g.grade}</span>
                  <span className="text-sm font-semibold text-primary">{g.hoanThanh}%</span>
                </div>
                <Progress value={g.hoanThanh} className="mt-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageFrame>
  );
}
