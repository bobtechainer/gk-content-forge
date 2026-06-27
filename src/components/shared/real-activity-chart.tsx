import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { opensPerDay } from "@/lib/analytics/events";
import { useAnalyticsEvents } from "@/stores/analytics-events";

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: "1px solid var(--border)",
  fontSize: 12,
} as const;

/**
 * Biểu đồ hoạt động học thật — dữ liệu được thu thập cục bộ từ trình duyệt của bạn.
 * Hiển thị số lượt mở bài học theo ngày trong 14 ngày gần nhất.
 */
export function RealActivityChart() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const events = useAnalyticsEvents((s) => s.events);
  const summary = useAnalyticsEvents((s) => s.summary)();
  const data = opensPerDay(events, Date.now(), 14);

  // Format ngày thành dạng ngắn "dd/MM" cho trục X
  const chartData = data.map((d) => ({
    ...d,
    label: d.date.slice(8, 10) + "/" + d.date.slice(5, 7),
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Hoạt động học thật (cục bộ)</CardTitle>
            <CardDescription>
              Lượt mở bài học 14 ngày gần nhất — thu thập từ trình duyệt của bạn.
            </CardDescription>
          </div>
          <span className="self-start rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            Dữ liệu thật
          </span>
        </div>

        {/* Tóm tắt số liệu */}
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>
            Tổng lượt mở:{" "}
            <strong className="text-foreground">{summary.opens}</strong>
          </span>
          <span>
            Câu hỏi đã làm:{" "}
            <strong className="text-foreground">{summary.answers}</strong>
          </span>
          <span>
            Trả lời đúng:{" "}
            <strong className="text-foreground">{summary.correct}</strong>
          </span>
          <span>
            Hoàn thành khoá:{" "}
            <strong className="text-foreground">{summary.completes}</strong>
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-56 w-full">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  interval={1}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
                  formatter={(value) => [value, "Lượt mở"]}
                  labelFormatter={(label) => `Ngày ${String(label)}`}
                />
                <Bar
                  dataKey="opens"
                  fill="var(--chart-1)"
                  radius={[4, 4, 0, 0]}
                  name="Lượt mở"
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Skeleton className="h-full w-full rounded-lg" />
          )}
        </div>

        {events.length === 0 && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Chưa có hoạt động nào. Mở bài học để bắt đầu thu thập dữ liệu.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
