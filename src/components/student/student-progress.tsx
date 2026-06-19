import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowUpRight, ThumbsUp, TrendingUp, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { flattenLessons } from "@/lib/curriculum";
import { usePageLoading } from "@/lib/use-page-loading";
import { cn } from "@/lib/utils";
import { PageFrame } from "../shared/page-frame";
import { PageSkeleton } from "../shared/page-skeleton";

interface SubjectScore {
  subject: string;
  diem: number; // điểm trung bình 0..10
  hoanThanh: number; // % hoàn thành học liệu
}

// Điểm theo môn (mock) — minh hoạ điểm mạnh/yếu của học sinh.
const SUBJECT_SCORES: SubjectScore[] = [
  { subject: "Toán", diem: 8.6, hoanThanh: 82 },
  { subject: "Ngữ văn", diem: 7.2, hoanThanh: 65 },
  { subject: "Tiếng Anh", diem: 6.1, hoanThanh: 48 },
  { subject: "Vật lý", diem: 7.8, hoanThanh: 70 },
  { subject: "Hóa học", diem: 5.4, hoanThanh: 40 },
];

// % đạt cho từng chuẩn đầu ra (mock, gán theo mã chuẩn).
const OUTCOME_ACHIEVED: Record<string, number> = {
  "TOAN10.DS.1": 92,
  "TOAN10.DS.2": 78,
  "TOAN10.DS.3": 55,
  "TOAN10.HH.1": 64,
  "VAN10.D.1": 47,
};

interface RouteSuggestion {
  contentId: string;
  title: string;
  reason: string;
}

// Gợi ý lộ trình (mock) — dẫn tới trình học tương tác.
const SUGGESTIONS: RouteSuggestion[] = [
  {
    contentId: "c8",
    title: "Ôn tập Hóa học cơ bản",
    reason: "Hóa học là môn bạn còn yếu nhất (5.4) — củng cố nền tảng trước.",
  },
  {
    contentId: "c4",
    title: "Luyện nghe Tiếng Anh theo chủ đề",
    reason: "Kỹ năng nghe Tiếng Anh mới đạt 48% — luyện thêm để bắt kịp.",
  },
  {
    contentId: "seed-quiz-1",
    title: "Nâng cao: Tập hợp và phép toán",
    reason: "Bạn vững phần Mệnh đề — thử thách phần khó hơn để bứt phá.",
  },
];

export function StudentProgressPage() {
  const loading = usePageLoading();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (loading) return <PageSkeleton />;

  const sorted = [...SUBJECT_SCORES].sort((a, b) => b.diem - a.diem);
  const strengths = sorted.slice(0, 2);
  const weaknesses = sorted.slice(-2).reverse();

  const outcomes = flattenLessons().flatMap((l) => l.outcomes);

  return (
    <PageFrame
      title="Tiến độ học tập của bạn"
      description="Theo dõi kết quả theo môn và theo chuẩn năng lực, kèm gợi ý lộ trình tiếp theo."
    >
      <Tabs defaultValue="subject">
        <TabsList>
          <TabsTrigger value="subject">Theo môn</TabsTrigger>
          <TabsTrigger value="standard">Theo chuẩn năng lực</TabsTrigger>
        </TabsList>

        {/* THEO MÔN */}
        <TabsContent value="subject" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Điểm trung bình theo môn</CardTitle>
              <CardDescription>Thang điểm 10 — so sánh giữa các môn của bạn.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={SUBJECT_SCORES}
                      margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis
                        dataKey="subject"
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        domain={[0, 10]}
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                          fontSize: 12,
                        }}
                        labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
                      />
                      <Bar
                        dataKey="diem"
                        name="Điểm trung bình"
                        fill="var(--chart-1)"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full animate-pulse rounded-lg bg-muted" />
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ThumbsUp className="h-4.5 w-4.5 text-success" /> Điểm mạnh
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {strengths.map((s) => (
                  <ScoreRow key={s.subject} score={s} tone="success" />
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4.5 w-4.5 text-warning-700" /> Cần cải thiện
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {weaknesses.map((s) => (
                  <ScoreRow key={s.subject} score={s} tone="warning" />
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* THEO CHUẨN NĂNG LỰC */}
        <TabsContent value="standard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4.5 w-4.5 text-primary" /> Mức đạt theo chuẩn đầu ra
              </CardTitle>
              <CardDescription>
                Gắn với khung Chương trình GDPT 2018 — tỷ lệ bạn đã đạt từng chuẩn.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {outcomes.map((o) => {
                const pct = OUTCOME_ACHIEVED[o.code] ?? 50;
                return (
                  <div key={o.id} className="space-y-1.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="font-mono text-xs text-muted-foreground">{o.code}</span>
                        <p className="text-sm text-foreground">{o.text}</p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 text-sm font-semibold",
                          pct >= 75
                            ? "text-success"
                            : pct >= 50
                              ? "text-primary"
                              : "text-warning-700",
                        )}
                      >
                        {pct}%
                      </span>
                    </div>
                    <Progress value={pct} />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Gợi ý lộ trình tiếp theo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowUpRight className="h-4.5 w-4.5 text-primary" /> Gợi ý lộ trình tiếp theo
          </CardTitle>
          <CardDescription>Những bước tiếp theo phù hợp với kết quả của bạn.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {SUGGESTIONS.map((s) => (
            <div
              key={s.contentId}
              className="flex flex-col gap-2.5 rounded-lg border border-border p-4"
            >
              <div className="font-medium text-foreground">{s.title}</div>
              <p className="flex-1 text-xs text-muted-foreground">{s.reason}</p>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to="/student/learn/$id" params={{ id: s.contentId }}>
                  Bắt đầu học
                </Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageFrame>
  );
}

function ScoreRow({ score, tone }: { score: SubjectScore; tone: "success" | "warning" }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{score.subject}</span>
        <span
          className={cn(
            "font-semibold",
            tone === "success" ? "text-success" : "text-warning-700",
          )}
        >
          {score.diem.toFixed(1)}
        </span>
      </div>
      <Progress value={score.hoanThanh} />
      <p className="text-xs text-muted-foreground">Hoàn thành {score.hoanThanh}% học liệu</p>
    </div>
  );
}
