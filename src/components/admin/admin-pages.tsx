import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Cell,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight, BadgeCheck, FileCheck2, Lock, ShieldAlert, Unlock, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ACCOUNTS, CONTENT_REPORTS, VERIFICATION_REQUESTS } from "@/lib/mock-data";
import type { Account } from "@/lib/types";
import { usePageLoading } from "@/lib/use-page-loading";
import { useContent } from "@/stores/content";
import { PageFrame } from "../shared/page-frame";
import { PageSkeleton } from "../shared/page-skeleton";
import { StatCard } from "../shared/stat-card";
import { StatusBadge } from "../shared/status-badge";
import { VerifiedBadge } from "../shared/verified-badge";

const GROWTH = [
  { m: "T1", users: 120, content: 80 },
  { m: "T2", users: 180, content: 140 },
  { m: "T3", users: 260, content: 210 },
  { m: "T4", users: 340, content: 300 },
  { m: "T5", users: 460, content: 420 },
  { m: "T6", users: 590, content: 560 },
];

export function AdminDashboardPage() {
  const loading = usePageLoading();
  const items = useContent((s) => s.items);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (loading) return <PageSkeleton />;

  const pending = items.filter((i) => i.status === "pending").length;
  const verifs = VERIFICATION_REQUESTS.filter((r) => r.status === "pending").length;
  const reports = CONTENT_REPORTS.filter((r) => r.status === "open").length;

  const accounts = Object.values(ACCOUNTS);
  const dist = [
    {
      name: "Cá nhân",
      value: accounts.filter((a) => a.accountType === "Cá nhân").length,
      color: "var(--primary)",
    },
    {
      name: "Doanh nghiệp",
      value: accounts.filter((a) => a.accountType === "Doanh nghiệp").length,
      color: "var(--colors-brand-900)",
    },
    {
      name: "Đã xác minh",
      value: accounts.filter((a) => a.verified === "L2" || a.verified === "verified").length,
      color: "var(--success)",
    },
  ];

  const queue = items.filter((i) => i.status === "pending").slice(0, 4);

  return (
    <PageFrame title="Tổng quan hệ thống" description="Thống kê toàn nền tảng và hàng đợi xử lý.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tổng người dùng" value={accounts.length} icon={Users} accent="var(--primary)" />
        <StatCard label="Nội dung chờ duyệt" value={pending} icon={FileCheck2} accent="var(--warning)" />
        <StatCard label="Đơn xác minh" value={verifs} icon={BadgeCheck} accent="var(--success)" />
        <StatCard label="Báo cáo vi phạm" value={reports} icon={ShieldAlert} accent="var(--destructive)" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Tăng trưởng hệ thống</CardTitle>
            <CardDescription>Người dùng & nội dung mới theo tháng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={GROWTH} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="var(--primary)"
                      strokeWidth={2.5}
                      dot={false}
                      name="Người dùng"
                    />
                    <Line
                      type="monotone"
                      dataKey="content"
                      stroke="var(--success)"
                      strokeWidth={2.5}
                      dot={false}
                      name="Nội dung"
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
            <CardTitle>Phân bổ tài khoản</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-40 w-40 shrink-0">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dist}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={42}
                        outerRadius={70}
                        paddingAngle={2}
                      >
                        {dist.map((d) => (
                          <Cell key={d.name} fill={d.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Skeleton className="h-full w-full rounded-full" />
                )}
              </div>
              <ul className="space-y-1.5 text-sm">
                {dist.map((d) => (
                  <li key={d.name} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="flex-1 text-muted-foreground">{d.name}</span>
                    <span className="font-medium text-foreground">{d.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Hàng đợi xử lý</CardTitle>
            <CardDescription>Nội dung chờ duyệt mới nhất</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/content-review">
              Duyệt ngay <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {queue.length === 0 ? (
            <p className="text-sm text-muted-foreground">Không có nội dung chờ duyệt.</p>
          ) : (
            queue.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">{item.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.ownerName ?? item.ownerId} • {item.subject}
                  </div>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </PageFrame>
  );
}

export function AdminUsersPage() {
  const loading = usePageLoading();
  const [locked, setLocked] = useState<Record<string, boolean>>({});
  const [detail, setDetail] = useState<Account | null>(null);

  if (loading) return <PageSkeleton />;

  const toggleLock = (id: string, name: string) => {
    setLocked((cur) => {
      const next = { ...cur, [id]: !cur[id] };
      toast.success(next[id] ? `Đã khóa ${name}` : `Đã mở khóa ${name}`);
      return next;
    });
  };

  return (
    <PageFrame title="Quản lý người dùng" description="Danh sách tài khoản và trạng thái xác minh.">
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Người dùng</th>
                  <th className="px-4 py-3 font-medium">Loại</th>
                  <th className="px-4 py-3 font-medium">Xác minh</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 text-right font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(ACCOUNTS).map((a) => {
                  const isLocked = locked[a.id];
                  return (
                    <tr key={a.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: a.avatarColor }}
                          >
                            {a.shortName}
                          </span>
                          <div>
                            <div className="flex items-center gap-1 font-medium text-foreground">
                              {a.name} <VerifiedBadge verified={a.verified} />
                            </div>
                            <div className="text-xs text-muted-foreground">{a.email ?? "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{a.accountType}</td>
                      <td className="px-4 py-3 text-muted-foreground">{a.verified}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            isLocked
                              ? "bg-destructive/10 text-destructive"
                              : "bg-emerald-500/10 text-emerald-600"
                          }`}
                        >
                          {isLocked ? "Đã khóa" : "Hoạt động"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setDetail(a)}>
                            Chi tiết
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={isLocked ? "" : "text-destructive"}
                            onClick={() => toggleLock(a.id, a.name)}
                          >
                            {isLocked ? (
                              <Unlock className="h-4 w-4" />
                            ) : (
                              <Lock className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent>
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {detail.name} <VerifiedBadge verified={detail.verified} />
                </DialogTitle>
                <DialogDescription>{detail.accountType}</DialogDescription>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                <Row label="Email" value={detail.email ?? "—"} />
                <Row label="Website" value={detail.website ?? "—"} />
                <Row label="Người theo dõi" value={detail.followers.toLocaleString()} />
                <Row label="Xác minh" value={detail.verified} />
                <Row label="Giới thiệu" value={detail.bio} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageFrame>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
