import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Eye, Users, TrendingUp } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { ANALYTICS_30D, ANALYTICS_7D, ANALYTICS_90D } from "@/lib/mock-data";
import { useContent } from "@/stores/content";
import { useSession } from "@/stores/session";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({ meta: [{ title: "Phân tích — GK Studio" }] }),
  component: Page,
});

function Page() {
  const [range, setRange] = useState("30");
  const data = range === "7" ? ANALYTICS_7D : range === "90" ? ANALYTICS_90D : ANALYTICS_30D;
  const items = useContent((s) => s.items);
  const roleId = useSession((s) => s.roleId);
  const mine = roleId === "admin" ? items : items.filter((i) => i.ownerId === roleId);
  const top = [...mine].sort((a, b) => b.views - a.views).slice(0, 5);
  const totalViews = mine.reduce((a, b) => a + b.views, 0);
  const published = mine.filter((i) => i.status === "published").length;
  const successRate = mine.length ? Math.round((published / mine.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Phân tích</h1>
          <p className="text-sm text-muted-foreground">Hiệu suất nội dung của bạn theo thời gian.</p>
        </div>
        <Tabs value={range} onValueChange={setRange}>
          <TabsList>
            <TabsTrigger value="7">7 ngày</TabsTrigger>
            <TabsTrigger value="30">30 ngày</TabsTrigger>
            <TabsTrigger value="90">90 ngày</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Tổng lượt xem" value={totalViews.toLocaleString()} icon={Eye} accent="#2563EB" />
        <StatCard label="Followers" value="8.420" icon={Users} accent="#20447E" />
        <StatCard label="Tỷ lệ xuất bản" value={`${successRate}%`} icon={TrendingUp} accent="#10B981" />
      </div>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Lượt xem theo thời gian</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#717680" />
              <YAxis tick={{ fontSize: 11 }} stroke="#717680" />
              <Tooltip />
              <Line type="monotone" dataKey="views" stroke="#2563EB" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Top 5 nội dung xem nhiều nhất</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top.map((t) => ({ name: t.title.slice(0, 20), views: t.views }))}>
              <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#717680" />
              <YAxis tick={{ fontSize: 11 }} stroke="#717680" />
              <Tooltip />
              <Bar dataKey="views" fill="#20447E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-border p-5">
          <h2 className="text-sm font-semibold text-foreground">Chi tiết nội dung</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-2.5">Tiêu đề</th>
              <th className="px-5 py-2.5">Lượt xem</th>
              <th className="px-5 py-2.5">Likes</th>
              <th className="px-5 py-2.5">Shares</th>
            </tr>
          </thead>
          <tbody>
            {mine.map((i) => (
              <tr key={i.id} className="border-t border-border">
                <td className="px-5 py-2.5 font-medium">{i.title}</td>
                <td className="px-5 py-2.5">{i.views.toLocaleString()}</td>
                <td className="px-5 py-2.5">{i.likes}</td>
                <td className="px-5 py-2.5">{i.shares}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}