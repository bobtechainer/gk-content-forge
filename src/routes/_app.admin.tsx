import { createFileRoute } from "@tanstack/react-router";
import { Check, X, BadgeCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/status-badge";
import { VerifiedBadge } from "@/components/verified-badge";
import { useContent } from "@/stores/content";
import { ACCOUNTS } from "@/lib/mock-data";
import { toast } from "sonner";
import type { RoleId } from "@/lib/types";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({ meta: [{ title: "Admin Panel — GK Studio" }] }),
  component: Page,
});

function Page() {
  const items = useContent((s) => s.items);
  const setStatus = useContent((s) => s.setStatus);
  const pending = items.filter((i) => i.status === "pending");

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">Quản trị nội dung và tài khoản trên hệ thống.</p>
      </div>
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Chờ duyệt ({pending.length})</TabsTrigger>
          <TabsTrigger value="accounts">Quản lý tài khoản</TabsTrigger>
          <TabsTrigger value="verification">Yêu cầu tích xanh</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-3">
          {pending.length === 0 && (
            <div className="rounded-md border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Không có nội dung nào đang chờ duyệt.
            </div>
          )}
          {pending.map((i) => {
            const owner = ACCOUNTS[i.ownerId];
            return (
              <Card key={i.id} className="flex flex-row items-center gap-4 p-4">
                <div className="h-14 w-20 rounded-md" style={{ backgroundColor: i.thumbnailColor }} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{i.title}</span>
                    <StatusBadge status={i.status} />
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {i.type === "quiz" ? "Bộ đề" : "Học liệu"} • {i.subject} • {i.grade} • bởi{" "}
                    <span className="inline-flex items-center gap-1 text-foreground">
                      {owner.name} <VerifiedBadge verified={owner.verified} />
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive text-destructive hover:bg-destructive/5"
                    onClick={() => {
                      setStatus(i.id, "rejected");
                      toast.error("Đã từ chối nội dung");
                    }}
                  >
                    <X className="mr-1 h-4 w-4" /> Từ chối
                  </Button>
                  <Button
                    size="sm"
                    className="bg-[#10B981] text-white hover:bg-[#059669]"
                    onClick={() => {
                      setStatus(i.id, "published");
                      toast.success("Đã duyệt và xuất bản nội dung");
                    }}
                  >
                    <Check className="mr-1 h-4 w-4" /> Duyệt
                  </Button>
                </div>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="accounts" className="mt-4 space-y-2">
          {(Object.keys(ACCOUNTS) as RoleId[])
            .filter((id) => id !== "admin")
            .map((id) => {
              const a = ACCOUNTS[id];
              return (
                <Card key={id} className="flex flex-row items-center gap-3 p-4">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: a.avatarColor }}
                  >
                    {a.shortName}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      {a.name} <VerifiedBadge verified={a.verified} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {a.accountType} • {a.followers.toLocaleString()} followers
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Xem chi tiết
                  </Button>
                </Card>
              );
            })}
        </TabsContent>

        <TabsContent value="verification" className="mt-4 space-y-2">
          <Card className="flex flex-row items-center gap-3 p-4">
            <BadgeCheck className="h-6 w-6 text-[#2563EB]" />
            <div className="flex-1">
              <div className="font-medium text-foreground">Nguyễn Văn A</div>
              <div className="text-xs text-muted-foreground">
                Yêu cầu nâng cấp Level 2 • Nộp ngày 05/06/2026
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-destructive text-destructive">
              <X className="mr-1 h-4 w-4" /> Từ chối
            </Button>
            <Button size="sm" className="bg-[#10B981] text-white hover:bg-[#059669]">
              <Check className="mr-1 h-4 w-4" /> Duyệt
            </Button>
          </Card>
          <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Không còn yêu cầu nào khác.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}