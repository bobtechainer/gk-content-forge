import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileText, Globe, Clock, Eye, Search } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { ContentTable } from "@/components/content-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useContent } from "@/stores/content";
import { useSession } from "@/stores/session";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — GK Studio" }] }),
  component: Dashboard,
});

function Dashboard() {
  const items = useContent((s) => s.items);
  const roleId = useSession((s) => s.roleId);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const mine = useMemo(
    () => (roleId === "admin" ? items : items.filter((i) => i.ownerId === roleId)),
    [items, roleId],
  );

  const filtered = useMemo(() => {
    return mine.filter((i) => {
      if (tab !== "all" && i.status !== tab) return false;
      if (typeFilter !== "all" && i.type !== typeFilter) return false;
      if (search && !i.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [mine, tab, typeFilter, search]);

  const total = mine.length;
  const published = mine.filter((i) => i.status === "published").length;
  const pending = mine.filter((i) => i.status === "pending").length;
  const views = mine.reduce((a, b) => a + b.views, 0);

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Tổng quan hoạt động và nội dung của bạn trong tháng này.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tổng nội dung" value={total} icon={FileText} accent="#20447E" />
        <StatCard label="Đã xuất bản" value={published} icon={Globe} accent="#10B981" trend="+12% tuần này" />
        <StatCard label="Chờ duyệt" value={pending} icon={Clock} accent="#F59E0B" />
        <StatCard label="Lượt xem tháng" value={views.toLocaleString()} icon={Eye} accent="#2563EB" trend="+8.4%" />
      </div>

      <div className="space-y-4 rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground">Quản lý nội dung</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm…"
                className="h-9 w-56 pl-8"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="quiz">Bộ đề</SelectItem>
                <SelectItem value="material">Học liệu</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="draft">Nháp</TabsTrigger>
            <TabsTrigger value="published">Đã xuất bản</TabsTrigger>
            <TabsTrigger value="pending">Chờ duyệt</TabsTrigger>
            <TabsTrigger value="rejected">Bị từ chối</TabsTrigger>
          </TabsList>
        </Tabs>

        <ContentTable items={filtered} />
      </div>
    </div>
  );
}