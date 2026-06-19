import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Building2,
  DollarSign,
  Eye,
  GraduationCap,
  MapPin,
  Star,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePageLoading } from "@/lib/use-page-loading";
import { cn } from "@/lib/utils";
import { useContent } from "@/stores/content";
import { PageFrame } from "../shared/page-frame";
import { PageSkeleton } from "../shared/page-skeleton";
import { StatCard } from "../shared/stat-card";

// ---- Dữ liệu mock cho dashboard đối tác (prototype) ----

const REACH_TREND = [
  { m: "T1", opens: 8400 },
  { m: "T2", opens: 11200 },
  { m: "T3", opens: 14800 },
  { m: "T4", opens: 18600 },
  { m: "T5", opens: 21900 },
  { m: "T6", opens: 27300 },
];

const TOP_MATERIALS = [
  { title: "Sách Toán 10 Cánh Diều", subject: "Toán", schools: 312, opens: 48200 },
  { title: "Giáo trình Ngữ văn 11 — Tập 1", subject: "Ngữ văn", schools: 268, opens: 39100 },
  { title: "Khóa học IELTS Writing Task 2", subject: "Tiếng Anh", schools: 184, opens: 31500 },
  { title: "Atlas Địa lý Việt Nam 3D/VR", subject: "Địa lý", schools: 151, opens: 22800 },
  { title: "Bảng tuần hoàn tương tác", subject: "Hóa học", schools: 137, opens: 19400 },
];

const LICENSE_BY_SCHOOL = [
  { school: "THPT Lê Lợi", province: "Thanh Hóa", grants: 24, value: 36_000_000 },
  { school: "THPT Chu Văn An", province: "Hà Nội", grants: 31, value: 47_500_000 },
  { school: "THPT Nguyễn Huệ", province: "Đà Nẵng", grants: 18, value: 27_200_000 },
  { school: "THPT Lê Quý Đôn", province: "TP.HCM", grants: 27, value: 41_800_000 },
  { school: "THPT Trần Phú", province: "Hải Phòng", grants: 15, value: 22_500_000 },
];

const STAR_DISTRIBUTION = [
  { stars: "5 sao", value: 612 },
  { stars: "4 sao", value: 348 },
  { stars: "3 sao", value: 96 },
  { stars: "2 sao", value: 31 },
  { stars: "1 sao", value: 14 },
];

const AVG_TEACHER_RATING = 4.6;
const STUDENT_COMPLETION_RATE = 78;
const PROVINCES_REACHED = 42;
const SCHOOLS_REACHED = 1284;
const TOTAL_OPENS = 612_400;

const VND = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: "1px solid var(--border)",
  fontSize: 12,
} as const;

function daysUntil(iso: string): number {
  const now = new Date("2026-06-19").getTime();
  return Math.round((new Date(iso).getTime() - now) / (1000 * 60 * 60 * 24));
}

export function PartnerAnalyticsPage() {
  const loading = usePageLoading();
  const items = useContent((s) => s.items);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Gói license của đối tác — đọc license.validUntil từ học liệu org.
  const licenses = useMemo(
    () =>
      items
        .filter((i) => i.ownerId === "publisher" && i.license)
        .map((i) => ({
          title: i.title,
          subject: i.subject,
          validUntil: i.license!.validUntil,
          remaining: daysUntil(i.license!.validUntil),
        }))
        .sort((a, b) => a.remaining - b.remaining),
    [items],
  );

  if (loading) return <PageSkeleton />;

  const totalRevenue = LICENSE_BY_SCHOOL.reduce((sum, r) => sum + r.value, 0);
  const totalGrants = LICENSE_BY_SCHOOL.reduce((sum, r) => sum + r.grants, 0);
  const expiringSoon = licenses.filter((l) => l.remaining <= 365).length;

  return (
    <PageFrame
      title="Phân tích hiệu quả"
      description="Theo dõi độ phủ, doanh thu cấp phép và phản hồi chất lượng của học liệu đối tác."
    >
      <Tabs defaultValue="reach">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 sm:w-auto">
          <TabsTrigger value="reach">Độ phủ & khai thác</TabsTrigger>
          <TabsTrigger value="revenue">Doanh thu & cấp phép</TabsTrigger>
          <TabsTrigger value="feedback">Phản hồi & chất lượng</TabsTrigger>
        </TabsList>

        {/* --- Tab 1: Độ phủ & khai thác --- */}
        <TabsContent value="reach" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label="Cơ sở giáo dục sử dụng"
              value={SCHOOLS_REACHED}
              icon={Building2}
              accent="var(--chart-1)"
            />
            <StatCard
              label="Tỉnh/thành phủ sóng"
              value={PROVINCES_REACHED}
              icon={MapPin}
              accent="var(--chart-2)"
            />
            <StatCard
              label="Tổng lượt mở học liệu"
              value={TOTAL_OPENS}
              icon={Eye}
              accent="var(--chart-3)"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lượt mở học liệu theo thời gian</CardTitle>
              <CardDescription>Biến động khai thác trên toàn hệ thống.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={REACH_TREND} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis
                        dataKey="m"
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Line
                        type="monotone"
                        dataKey="opens"
                        stroke="var(--chart-1)"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 4 }}
                        name="Lượt mở"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Skeleton className="h-full w-full rounded-lg" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Học liệu được khai thác nhiều nhất</CardTitle>
              <CardDescription>Xếp theo số cơ sở sử dụng.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Học liệu</th>
                      <th className="px-4 py-3 font-medium">Môn</th>
                      <th className="px-4 py-3 text-right font-medium">Cơ sở dùng</th>
                      <th className="px-4 py-3 text-right font-medium">Lượt mở</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TOP_MATERIALS.map((m) => (
                      <tr key={m.title} className="border-t border-border">
                        <td className="px-4 py-3 font-medium text-foreground">{m.title}</td>
                        <td className="px-4 py-3 text-muted-foreground">{m.subject}</td>
                        <td className="px-4 py-3 text-right text-foreground">
                          {m.schools.toLocaleString("vi-VN")}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground">
                          {m.opens.toLocaleString("vi-VN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Tab 2: Doanh thu & cấp phép --- */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label="Tổng doanh thu cấp phép"
              value={VND.format(totalRevenue)}
              icon={DollarSign}
              accent="var(--chart-2)"
            />
            <StatCard
              label="Lượt cấp quyền"
              value={totalGrants}
              icon={GraduationCap}
              accent="var(--chart-1)"
            />
            <StatCard
              label="License sắp hết hạn (≤ 1 năm)"
              value={expiringSoon}
              icon={TrendingUp}
              accent="var(--chart-3)"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lượt cấp quyền theo trường</CardTitle>
              <CardDescription>Số gói cấp phép và giá trị theo từng cơ sở.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Trường</th>
                      <th className="px-4 py-3 font-medium">Tỉnh/thành</th>
                      <th className="px-4 py-3 text-right font-medium">Lượt cấp quyền</th>
                      <th className="px-4 py-3 text-right font-medium">Giá trị</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LICENSE_BY_SCHOOL.map((r) => (
                      <tr key={r.school} className="border-t border-border">
                        <td className="px-4 py-3 font-medium text-foreground">{r.school}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.province}</td>
                        <td className="px-4 py-3 text-right text-foreground">{r.grants}</td>
                        <td className="px-4 py-3 text-right text-foreground">
                          {VND.format(r.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hiệu lực giấy phép</CardTitle>
              <CardDescription>
                Theo dõi thời hạn còn lại của từng gói license đối tác.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {licenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có gói license nào.</p>
              ) : (
                licenses.map((l) => {
                  const expiringSoonRow = l.remaining <= 365;
                  return (
                    <div
                      key={l.title}
                      className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-foreground">
                          {l.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {l.subject} • hết hạn {l.validUntil}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 self-start rounded-full px-2.5 py-1 text-xs font-medium sm:self-auto",
                          expiringSoonRow
                            ? "bg-warning-100 text-warning-700"
                            : "bg-success/10 text-success",
                        )}
                      >
                        {l.remaining < 0
                          ? "Đã hết hạn"
                          : expiringSoonRow
                            ? `Sắp hết hạn • còn ${l.remaining} ngày`
                            : `Hiệu lực • còn ${l.remaining} ngày`}
                      </span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Tab 3: Phản hồi & chất lượng --- */}
        <TabsContent value="feedback" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard
              label="Điểm đánh giá GV trung bình"
              value={`${AVG_TEACHER_RATING.toFixed(1)} / 5`}
              icon={Star}
              accent="var(--chart-3)"
            />
            <StatCard
              label="Tỷ lệ HS hoàn thành"
              value={`${STUDENT_COMPLETION_RATE}%`}
              icon={GraduationCap}
              accent="var(--chart-2)"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Phân bố đánh giá theo sao</CardTitle>
              <CardDescription>Tổng hợp đánh giá của giáo viên và học sinh.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={STAR_DISTRIBUTION}
                      margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis
                        dataKey="stars"
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--muted)" }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Số đánh giá">
                        {STAR_DISTRIBUTION.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Skeleton className="h-full w-full rounded-lg" />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageFrame>
  );
}
