import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ANALYTICS_30D, ANALYTICS_7D, ANALYTICS_90D } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type Range = "7" | "30" | "90";

const RANGES: { value: Range; label: string }[] = [
  { value: "7", label: "7 ngày" },
  { value: "30", label: "30 ngày" },
  { value: "90", label: "90 ngày" },
];

const DATA: Record<Range, { date: string; views: number }[]> = {
  "7": ANALYTICS_7D,
  "30": ANALYTICS_30D,
  "90": ANALYTICS_90D,
};

export function AnalyticsLineChart() {
  const [range, setRange] = useState<Range>("30");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const data = DATA[range];

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Lượt xem theo thời gian</CardTitle>
          <CardDescription>Biến động lưu lượng học liệu của bạn.</CardDescription>
        </div>
        <div className="flex rounded-lg border border-border p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRange(r.value)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition",
                range === r.value
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
                />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                  animationDuration={600}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Skeleton className="h-full w-full rounded-lg" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
