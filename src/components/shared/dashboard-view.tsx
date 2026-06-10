import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  Heart,
  Sparkles,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ACCOUNTS } from "@/lib/mock-data";
import type { ContentItem } from "@/lib/types";
import { useScopedContent, type StudioScope } from "@/lib/use-scoped-content";
import { usePageLoading } from "@/lib/use-page-loading";
import { useSession } from "@/stores/session";
import { ActivityTimeline, type ActivityEntry } from "./activity-timeline";
import { AiAssistantCard } from "./ai-assistant-card";
import { AnalyticsLineChart } from "./analytics-line-chart";
import { ContentDonutChart } from "./content-donut-chart";
import { DashboardSkeleton } from "./page-skeleton";
import { PageFrame } from "./page-frame";
import { StatCard } from "./stat-card";

function useCountUp(target: number, ms = 700) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / ms, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}

function buildTips(scope: StudioScope, items: ContentItem[]): string[] {
  const drafts = items.filter((i) => i.status === "draft").length;
  const top = [...items].sort((a, b) => b.views - a.views)[0];
  const tips: string[] = [];
  if (drafts > 0)
    tips.push(`Bạn có ${drafts} bản nháp chưa hoàn thành — hoàn thiện và xuất bản ngay nhé!`);
  if (top && top.views > 0)
    tips.push(`Học liệu "${top.title}" đang dẫn đầu với ${top.views.toLocaleString()} lượt xem.`);
  tips.push(
    scope === "org"
      ? "Phân công thành viên tạo thêm học liệu môn đang thiếu để tăng độ phủ."
      : "Chủ đề bạn dạy đang được quan tâm — tạo thêm học liệu tương tự để tăng tương tác.",
  );
  tips.push("Một số bộ đề có tỉ lệ hoàn thành thấp, cân nhắc điều chỉnh độ khó câu hỏi.");
  return tips;
}

export function DashboardView({ scope }: { scope: StudioScope }) {
  const loading = usePageLoading();
  const items = useScopedContent(scope);
  const roleId = useSession((s) => s.roleId);
  const account = roleId ? ACCOUNTS[roleId] : null;

  const totals = useMemo(
    () => ({
      views: items.reduce((s, i) => s + i.views, 0),
      likes: items.reduce((s, i) => s + i.likes, 0),
      published: items.filter((i) => i.status === "published").length,
      followers: account?.followers ?? 0,
    }),
    [items, account],
  );

  const views = useCountUp(totals.views);
  const likes = useCountUp(totals.likes);
  const published = useCountUp(totals.published);
  const followers = useCountUp(totals.followers);

  const topContent = useMemo(
    () =>
      [...items]
        .filter((i) => i.status === "published")
        .sort((a, b) => b.views - a.views)
        .slice(0, 5),
    [items],
  );

  const activity: ActivityEntry[] = useMemo(() => {
    return [...items]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        icon: item.status === "published" ? Upload : Sparkles,
        color: item.status === "published" ? "#10B981" : "#2563EB",
        text:
          item.status === "published" ? `Đã xuất bản "${item.title}"` : `Đang soạn "${item.title}"`,
        time: new Date(item.createdAt).toLocaleDateString("vi-VN"),
      }));
  }, [items]);

  if (loading) return <DashboardSkeleton />;

  return (
    <PageFrame
      title={scope === "org" ? "Trang chủ tổ chức" : "Trang chủ"}
      description="Theo dõi hiệu suất sáng tạo, xuất bản và tăng trưởng kênh nội dung."
    >
      <AiAssistantCard tips={buildTips(scope, items)} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng lượt xem"
          value={views}
          icon={Eye}
          accent="#2563EB"
          trend="+12% so với kỳ trước"
          trendUp
        />
        <StatCard
          label="Tổng lượt thích"
          value={likes}
          icon={Heart}
          accent="#EC4899"
          trend="+8%"
          trendUp
        />
        <StatCard label="Đã xuất bản" value={published} icon={Upload} accent="#10B981" />
        <StatCard
          label="Người theo dõi"
          value={followers}
          icon={Users}
          accent="#F59E0B"
          trend="+34 tuần này"
          trendUp
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <AnalyticsLineChart />
        <ContentDonutChart items={items} />
      </div>

      {scope === "org" && <OrgMemberStats items={items} />}

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <TopContent items={topContent} scope={scope} />
        <ActivityTimeline entries={activity} />
      </div>
    </PageFrame>
  );
}

function TopContent({ items, scope }: { items: ContentItem[]; scope: StudioScope }) {
  const base = scope === "org" ? "/org" : "/creator";

  const builderTo = (item: ContentItem) => {
    if (item.category === "book") return `${base}/builder/book/$id`;
    if (item.category === "course") return `${base}/builder/course/$id`;
    if (item.materialSubtype === "quiz") return `${base}/builder/quiz/$id`;
    return `${base}/builder/material/$id`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top nội dung nổi bật</CardTitle>
        <CardDescription>Xếp hạng theo lượt xem</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có nội dung đã xuất bản.</p>
        ) : (
          <ol className="space-y-2">
            {items.map((item, index) => {
              const up = index % 3 !== 2;
              return (
                <li key={item.id}>
                  <Link
                    to={builderTo(item)}
                    params={{ id: item.id }}
                    className="flex items-center gap-3 rounded-lg border border-border p-3 transition hover:bg-muted/40 hover:border-muted-foreground/30"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">{item.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.subject} • {item.grade}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-foreground">
                        {item.views.toLocaleString()}
                      </div>
                      <div
                        className={`flex items-center justify-end gap-0.5 text-xs ${
                          up ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {up ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {up ? "+" : "-"}
                        {((index + 2) * 3) % 19}%
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function OrgMemberStats({ items }: { items: ContentItem[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const members = ACCOUNTS.publisher.managers ?? [];
  const data = members.map((m) => ({
    name: m.name.split(" ").slice(-1)[0],
    fullName: m.name,
    role: m.role,
    count: items.filter((i) => i.ownerName === m.name).length,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Đóng góp theo thành viên</CardTitle>
          <CardDescription>Số học liệu tạo bởi mỗi thành viên</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-56 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#717680" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#717680" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12 }}
                  />
                  <Bar
                    dataKey="count"
                    radius={[6, 6, 0, 0]}
                    fill="#2563EB"
                    animationDuration={600}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-full w-full rounded-lg" />
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Thành viên hoạt động</CardTitle>
          <CardDescription>Đóng góp tuần này</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.map((m) => (
            <div
              key={m.fullName}
              className="flex items-center gap-3 rounded-lg border border-border p-2.5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {m.fullName
                  .split(" ")
                  .map((p) => p[0])
                  .slice(-2)
                  .join("")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">{m.fullName}</div>
                <div className="text-xs capitalize text-muted-foreground">{m.role}</div>
              </div>
              <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                {m.count}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
