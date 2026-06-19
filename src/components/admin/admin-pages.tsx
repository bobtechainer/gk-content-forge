import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
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
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  Download,
  FileCheck2,
  Landmark,
  Layers,
  Lock,
  MapPin,
  ShieldAlert,
  Unlock,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ACCOUNTS, CONTENT_REPORTS, VERIFICATION_REQUESTS } from "@/lib/mock-data";
import { QUALITY_LABELS } from "@/lib/quality-label";
import type { Account, ContentTier, QualityLabel } from "@/lib/types";
import { usePageLoading } from "@/lib/use-page-loading";
import { useContent } from "@/stores/content";
import { ContentDonutChart } from "../shared/content-donut-chart";
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

  const byTier = (t: ContentTier) => items.filter((i) => i.tier === t).length;
  const tierRows: { tier: ContentTier; label: string; count: number }[] = [
    { tier: "root", label: "Gốc (Bộ)", count: byTier("root") },
    { tier: "partner", label: "Đối tác", count: byTier("partner") },
    { tier: "community", label: "Cộng đồng", count: byTier("community") },
  ];
  const tieredTotal = tierRows.reduce((sum, r) => sum + r.count, 0);

  const regionUsage = [
    { region: "Miền Bắc", percent: 78 },
    { region: "Miền Trung", percent: 61 },
    { region: "Miền Nam", percent: 84 },
  ];

  const needsRevision = items.filter((i) => i.qualityLabel === "needs_revision").length;
  const openReports = CONTENT_REPORTS.filter((r) => r.status === "open").length;
  const riskTotal = openReports + needsRevision;

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

      <Card>
        <CardHeader>
          <CardTitle>Tổng quan Quốc gia</CardTitle>
          <CardDescription>
            Bức tranh học liệu, mức khai thác theo vùng và cảnh báo rủi ro toàn nền tảng.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-border p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
              <Layers className="h-4 w-4 text-primary" /> Học liệu theo tầng
            </div>
            <ul className="space-y-2 text-sm">
              {tierRows.map((row) => (
                <li key={row.tier} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-semibold text-foreground">{row.count}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 border-t border-border pt-2 text-xs text-muted-foreground">
              Tổng đã gắn mã: <span className="font-medium text-foreground">{tieredTotal}</span> học
              liệu
            </div>
          </div>

          <div className="rounded-lg border border-border p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
              <MapPin className="h-4 w-4 text-primary" /> Tỷ lệ khai thác theo vùng
            </div>
            <ul className="space-y-2.5 text-sm">
              {regionUsage.map((row) => (
                <li key={row.region} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{row.region}</span>
                    <span className="font-medium text-foreground">{row.percent}%</span>
                  </div>
                  <Progress value={row.percent} />
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-border p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
              <ShieldAlert className="h-4 w-4 text-destructive" /> Cảnh báo rủi ro
            </div>
            <div className="text-3xl font-bold text-foreground">{riskTotal}</div>
            <p className="mt-1 text-xs text-muted-foreground">vấn đề cần theo dõi</p>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Báo cáo đang mở</span>
                <span className="font-medium text-foreground">{openReports}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Cần chỉnh sửa</span>
                <span className="font-medium text-foreground">{needsRevision}</span>
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-border p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
              <FileCheck2 className="h-4 w-4 text-primary" /> Hiệu quả theo loại
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Tổng học liệu</span>
                <span className="font-semibold text-foreground">{items.length}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Đã xuất bản</span>
                <span className="font-semibold text-foreground">
                  {items.filter((i) => i.status === "published").length}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Tổng lượt xem</span>
                <span className="font-semibold text-foreground">
                  {items.reduce((sum, i) => sum + i.views, 0).toLocaleString()}
                </span>
              </li>
            </ul>
            <div className="mt-3 border-t border-border pt-2 text-xs text-muted-foreground">
              Xem phân bổ chi tiết bên dưới.
            </div>
          </div>
        </CardContent>
      </Card>

      <ContentDonutChart items={items} />

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

      <PolicyPlanningBlock />
    </PageFrame>
  );
}

const REGION_ACCESS = [
  { region: "Miền Bắc", value: 78 },
  { region: "Miền Trung", value: 61 },
  { region: "Tây Nguyên", value: 52 },
  { region: "Miền Nam", value: 84 },
  { region: "ĐBSCL", value: 58 },
];

/** Số liệu hoạch định chính sách: khoảng cách tiếp cận số theo vùng và chất lượng học liệu. */
function PolicyPlanningBlock() {
  const items = useContent((s) => s.items);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const qualityData = useMemo(() => {
    const counts = new Map<QualityLabel, number>();
    for (const item of items) {
      if (!item.qualityLabel) continue;
      counts.set(item.qualityLabel, (counts.get(item.qualityLabel) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([label, value]) => ({ name: QUALITY_LABELS[label].label, value }))
      .sort((a, b) => b.value - a.value);
  }, [items]);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Hoạch định chính sách</CardTitle>
          <CardDescription>
            Số liệu phục vụ ra quyết định về tiếp cận số và chất lượng học liệu.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.success("Đã xuất báo cáo chính sách (demo)")}
        >
          <Download className="mr-1.5 h-4 w-4" /> Xuất báo cáo
        </Button>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-2 text-sm font-medium text-foreground">Khoảng cách tiếp cận số</div>
          <p className="mb-3 text-xs text-muted-foreground">
            Tỷ lệ trường khai thác học liệu số theo vùng (%).
          </p>
          <div className="h-64 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={REGION_ACCESS} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="region"
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
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="value"
                    name="Tỷ lệ khai thác"
                    radius={[6, 6, 0, 0]}
                    fill="var(--chart-1)"
                    animationDuration={600}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-full w-full rounded-lg" />
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 text-sm font-medium text-foreground">Hiệu quả & chất lượng</div>
          <p className="mb-3 text-xs text-muted-foreground">
            Số học liệu theo nhãn chất lượng thẩm định.
          </p>
          <div className="h-64 w-full">
            {mounted ? (
              qualityData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Chưa có học liệu gắn nhãn chất lượng.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={qualityData}
                    layout="vertical"
                    margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={96}
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
                    />
                    <Bar
                      dataKey="value"
                      name="Số học liệu"
                      radius={[0, 6, 6, 0]}
                      fill="var(--chart-2)"
                      animationDuration={600}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )
            ) : (
              <Skeleton className="h-full w-full rounded-lg" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type OrgApprovalKind = "Sở GD&ĐT" | "NXB" | "Doanh nghiệp" | "Hội đồng";

interface PendingOrgApproval {
  id: string;
  name: string;
  kind: OrgApprovalKind;
  region: string;
  submittedAt: string;
}

const PENDING_ORG_APPROVALS: PendingOrgApproval[] = [
  {
    id: "org-so-gd-hn",
    name: "Sở GD&ĐT Hà Nội",
    kind: "Sở GD&ĐT",
    region: "Miền Bắc",
    submittedAt: "16/06/2026",
  },
  {
    id: "org-nxb-gd",
    name: "NXB Giáo dục Việt Nam",
    kind: "NXB",
    region: "Toàn quốc",
    submittedAt: "15/06/2026",
  },
  {
    id: "org-edtech-vietedu",
    name: "Công ty CP EdTech VietEdu",
    kind: "Doanh nghiệp",
    region: "Miền Nam",
    submittedAt: "14/06/2026",
  },
  {
    id: "org-hoidong-ly",
    name: "Hội đồng thẩm định Vật lí THPT",
    kind: "Hội đồng",
    region: "Toàn quốc",
    submittedAt: "13/06/2026",
  },
];

const ORG_KIND_ICON: Record<OrgApprovalKind, typeof Landmark> = {
  "Sở GD&ĐT": Landmark,
  NXB: BadgeCheck,
  "Doanh nghiệp": Building2,
  "Hội đồng": Users,
};

export function AdminUsersPage() {
  const loading = usePageLoading();
  const [locked, setLocked] = useState<Record<string, boolean>>({});
  const [detail, setDetail] = useState<Account | null>(null);
  const [resolvedApprovals, setResolvedApprovals] = useState<Record<string, "approved" | "rejected">>(
    {},
  );

  if (loading) return <PageSkeleton />;

  const resolveApproval = (approval: PendingOrgApproval, decision: "approved" | "rejected") => {
    setResolvedApprovals((cur) => ({ ...cur, [approval.id]: decision }));
    toast.success(
      decision === "approved"
        ? `Đã duyệt ${approval.name}`
        : `Đã từ chối ${approval.name}`,
    );
  };

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
        <CardHeader>
          <CardTitle>Chờ phê duyệt tổ chức</CardTitle>
          <CardDescription>
            Đơn đăng ký từ Sở GD&ĐT, nhà xuất bản, doanh nghiệp và hội đồng thẩm định.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {PENDING_ORG_APPROVALS.map((approval) => {
            const Icon = ORG_KIND_ICON[approval.kind];
            const decision = resolvedApprovals[approval.id];
            return (
              <div
                key={approval.id}
                className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-foreground">{approval.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {approval.kind} • {approval.region} • gửi {approval.submittedAt}
                  </div>
                </div>
                {decision ? (
                  <Badge
                    variant="secondary"
                    className={
                      decision === "approved"
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    }
                  >
                    {decision === "approved" ? "Đã duyệt" : "Đã từ chối"}
                  </Badge>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => resolveApproval(approval, "rejected")}
                    >
                      <X className="mr-1.5 h-4 w-4" /> Từ chối
                    </Button>
                    <Button size="sm" onClick={() => resolveApproval(approval, "approved")}>
                      <Check className="mr-1.5 h-4 w-4" /> Duyệt
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

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
