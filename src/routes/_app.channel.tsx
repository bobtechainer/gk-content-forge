import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { VerifiedBadge } from "@/components/verified-badge";
import { useSession } from "@/stores/session";
import { ACCOUNTS } from "@/lib/mock-data";
import { useContent } from "@/stores/content";

export const Route = createFileRoute("/_app/channel")({
  head: () => ({ meta: [{ title: "Kênh của tôi — GK Studio" }] }),
  component: Page,
});

function Page() {
  const roleId = useSession((s) => s.roleId);
  const account = roleId ? ACCOUNTS[roleId] : null;
  const [follow, setFollow] = useState(false);
  const items = useContent((s) => s.items).filter(
    (i) => i.ownerId === roleId && i.status === "published",
  );
  if (!account) return null;
  const isBusiness = account.accountType === "Doanh nghiệp";

  return (
    <div className="mx-auto max-w-[1440px]">
      <div
        className={`relative w-full ${isBusiness ? "h-56" : "h-36"} bg-gradient-to-br from-[#20447E] via-[#2563EB] to-[#1d4ed8]`}
      >
        {isBusiness && (
          <Button size="sm" variant="secondary" className="absolute right-4 top-4 gap-1.5">
            <Camera className="h-3.5 w-3.5" /> Đổi cover
          </Button>
        )}
      </div>
      <div className="px-6 md:px-8">
        <div className="-mt-12 flex flex-wrap items-end gap-5">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-card text-2xl font-bold text-white shadow-md"
            style={{ backgroundColor: account.avatarColor }}
          >
            {account.shortName}
          </div>
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">{account.name}</h1>
              <VerifiedBadge verified={account.verified} className="h-5 w-5" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{account.bio}</p>
            <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
              <span><strong className="text-foreground">{items.length}</strong> nội dung</span>
              <span><strong className="text-foreground">{account.followers.toLocaleString()}</strong> followers</span>
              <span><strong className="text-foreground">{items.reduce((a,b)=>a+b.views,0).toLocaleString()}</strong> lượt xem</span>
            </div>
          </div>
          <Button
            onClick={() => setFollow(!follow)}
            variant={follow ? "outline" : "default"}
            className={follow ? "" : "bg-[#2563EB] text-white hover:bg-[#1d4ed8]"}
          >
            <UserPlus className="mr-1.5 h-4 w-4" /> {follow ? "Đang theo dõi" : "Theo dõi"}
          </Button>
        </div>

        <Tabs defaultValue="materials" className="mt-8">
          <TabsList>
            <TabsTrigger value="materials">Học liệu</TabsTrigger>
            <TabsTrigger value="quizzes">Bộ đề</TabsTrigger>
            <TabsTrigger value="about">Giới thiệu</TabsTrigger>
            {isBusiness && <TabsTrigger value="members">Thành viên</TabsTrigger>}
          </TabsList>
          <TabsContent value="materials" className="mt-4">
            <Grid items={items.filter((i) => i.type === "material")} />
          </TabsContent>
          <TabsContent value="quizzes" className="mt-4">
            <Grid items={items.filter((i) => i.type === "quiz")} />
          </TabsContent>
          <TabsContent value="about" className="mt-4">
            <Card className="p-5 text-sm text-foreground">{account.bio}</Card>
          </TabsContent>
          {isBusiness && (
            <TabsContent value="members" className="mt-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {["Biên tập viên", "Tác giả", "Quản trị"].map((r, i) => (
                  <Card key={r} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#20447E] text-sm font-semibold text-white">
                        T{i + 1}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Thành viên {i + 1}</div>
                        <div className="text-xs text-muted-foreground">{r}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
        <div className="h-12" />
      </div>
    </div>
  );
}

function Grid({ items }: { items: ReturnType<typeof useContent.getState>["items"] }) {
  if (!items.length)
    return <div className="rounded-md border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Chưa có nội dung xuất bản.</div>;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => (
        <Card key={i.id} className="overflow-hidden">
          <div className="h-32" style={{ backgroundColor: i.thumbnailColor }} />
          <div className="p-4">
            <div className="font-medium text-foreground line-clamp-2">{i.title}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {i.subject} • {i.grade} • {i.views.toLocaleString()} lượt xem
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}