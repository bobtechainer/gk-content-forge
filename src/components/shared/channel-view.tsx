import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Globe, ImagePlus, Pin, Upload, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ACCOUNTS } from "@/lib/mock-data";
import { MATERIAL_TYPE_LABELS } from "@/lib/taxonomy";
import type { Account, ContentItem, MaterialType } from "@/lib/types";
import { useScopedContent, type StudioScope } from "@/lib/use-scoped-content";
import { usePageLoading } from "@/lib/use-page-loading";
import { cn } from "@/lib/utils";
import { useSession } from "@/stores/session";
import { ContentGrid } from "./content-card";
import { PageFrame } from "./page-frame";
import { PageSkeleton } from "./page-skeleton";
import { VerifiedBadge } from "./verified-badge";

type ChannelTab = "content" | "about";

/** All content type filter chips for the channel */
const CONTENT_TYPE_FILTERS: { value: MaterialType | null; label: string }[] = [
  { value: null, label: "Tất cả" },
  { value: "book", label: "Sách" },
  { value: "course", label: "Khóa học" },
  { value: "quiz", label: "Bộ đề" },
  { value: "lesson", label: "Bài giảng" },
  { value: "video", label: "Video" },
  { value: "document", label: "Tài liệu" },
  { value: "image", label: "Hình ảnh" },
  { value: "audio", label: "Âm thanh" },
  { value: "advanced", label: "Học liệu nâng cao" },
  { value: "scorm", label: "SCORM" },
  { value: "3d_vr", label: "3D/VR" },
];

function resolveType(item: ContentItem): MaterialType {
  if (item.category === "book") return "book";
  if (item.category === "course") return "course";
  return item.materialSubtype ?? "document";
}

export function ChannelView({ scope }: { scope: StudioScope }) {
  const loading = usePageLoading();
  const roleId = useSession((s) => s.roleId);
  const account = roleId ? ACCOUNTS[roleId] : null;
  const items = useScopedContent(scope);
  const published = items.filter((i) => i.status === "published");

  const [tab, setTab] = useState<ChannelTab>("content");
  const [typeFilter, setTypeFilter] = useState<MaterialType | null>(null);
  const [following, setFollowing] = useState(false);

  if (loading) return <PageSkeleton />;
  if (!account) return null;

  const filteredContent = typeFilter
    ? published.filter((i) => resolveType(i) === typeFilter)
    : published;

  // Only show filter chips that have at least one matching item
  const availableFilters = CONTENT_TYPE_FILTERS.filter(
    (f) => f.value === null || published.some((i) => resolveType(i) === f.value),
  );

  const editTo = scope === "org" ? "/org/channel/edit" : "/creator/channel/edit";

  return (
    <div className="mx-auto max-w-[1440px] pb-8">
      {/* Banner — responsive */}
      <div
        className="h-32 w-full sm:h-40 md:h-56"
        style={{
          background: `linear-gradient(120deg, ${account.avatarColor}, #2563EB)`,
        }}
      />
      <div className="px-4 sm:px-6 md:px-8">
        {/* Profile header — responsive stack */}
        <div className="-mt-10 flex flex-col gap-3 sm:-mt-12 sm:gap-4 md:-mt-14 md:flex-row md:items-end md:justify-between">
          <div className="flex items-end gap-3 sm:gap-4">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-card text-xl font-bold text-white shadow-md sm:h-24 sm:w-24 sm:text-2xl md:h-28 md:w-28"
              style={{ backgroundColor: account.avatarColor }}
            >
              {account.shortName}
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-foreground sm:text-xl md:text-2xl">
                  {account.name}
                </h1>
                <VerifiedBadge verified={account.verified} className="h-5 w-5" />
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                  {account.accountType}
                </span>
                <span>{account.followers.toLocaleString()} người theo dõi</span>
                <span>•</span>
                <span>{published.length} nội dung</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 pb-1">
            <Button
              variant={following ? "outline" : "default"}
              className={following ? "" : "bg-[#2563EB] text-white hover:bg-[#1d4ed8]"}
              onClick={() => setFollowing((v) => !v)}
            >
              {following ? "Đang theo dõi" : "Theo dõi"}
            </Button>
            <Button variant="outline" asChild>
              <Link to={editTo}>Chỉnh sửa kênh</Link>
            </Button>
          </div>
        </div>

        {/* Bio & website */}
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:mt-4">{account.bio}</p>
        {account.website && (
          <a
            href={account.website}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-sm text-[#2563EB] hover:underline"
          >
            <Globe className="h-3.5 w-3.5" /> {account.website.replace(/^https?:\/\//, "")}
          </a>
        )}

        {/* Tab bar — 2 tabs */}
        <div className="mt-5 flex gap-6 border-b border-border sm:mt-6">
          <ChannelTabButton active={tab === "content"} onClick={() => setTab("content")}>
            Nội dung ({published.length})
          </ChannelTabButton>
          <ChannelTabButton active={tab === "about"} onClick={() => setTab("about")}>
            Giới thiệu
          </ChannelTabButton>
        </div>

        <div className="mt-4 sm:mt-5">
          {tab === "content" && (
            <div className="space-y-4">
              {/* Filter chips */}
              {availableFilters.length > 2 && (
                <div className="relative">
                  <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {availableFilters.map((f) => (
                      <button
                        key={f.value ?? "all"}
                        type="button"
                        onClick={() => setTypeFilter(f.value)}
                        className={cn(
                          "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
                          typeFilter === f.value
                            ? "border-[#2563EB] bg-[#2563EB] text-white"
                            : "border-border bg-card text-muted-foreground hover:border-muted-foreground/40",
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent md:hidden" />
                </div>
              )}
              <ContentGrid items={filteredContent} scope={scope} />
            </div>
          )}
          {tab === "about" && <AboutSection account={account} published={published.length} />}
        </div>
      </div>
    </div>
  );
}

function AboutSection({ account, published }: { account: Account; published: number }) {
  return (
    <Card>
      <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
        <Info label="Giới thiệu" value={account.bio} />
        <Info label="Loại tài khoản" value={account.accountType} />
        <Info label="Website" value={account.website ?? "Chưa cập nhật"} />
        <Info label="Email" value={account.email ?? "Chưa cập nhật"} />
        <Info label="Số nội dung đã xuất bản" value={published.toString()} />
        <Info label="Người theo dõi" value={account.followers.toLocaleString()} />
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-sm text-foreground">{value}</div>
    </div>
  );
}

function ChannelTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "-mb-px border-b-2 pb-2.5 text-sm font-medium transition",
        active
          ? "border-[#2563EB] text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function ChannelEditView({ scope }: { scope: StudioScope }) {
  const loading = usePageLoading();
  const roleId = useSession((s) => s.roleId);
  const account = roleId ? ACCOUNTS[roleId] : null;
  const items = useScopedContent(scope).filter((i) => i.status === "published");

  const [name, setName] = useState(account?.name ?? "");
  const [bio, setBio] = useState(account?.bio ?? "");
  const [website, setWebsite] = useState(account?.website ?? "");
  const [pinned, setPinned] = useState<string[]>([]);

  if (loading) return <PageSkeleton />;

  const togglePin = (id: string) =>
    setPinned((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const viewTo = scope === "org" ? "/org/channel" : "/creator/channel";

  return (
    <PageFrame
      title="Chỉnh sửa kênh"
      description="Cập nhật banner, avatar, thông tin và nội dung ghim đầu trang."
    >
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Hình ảnh & thông tin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Ảnh bìa (banner)</Label>
              <button
                type="button"
                onClick={() => toast.info("Mở hộp thoại tải & cắt ảnh bìa (demo)")}
                className="flex h-28 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground hover:border-[#2563EB]"
              >
                <ImagePlus className="h-5 w-5" /> Tải ảnh bìa
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ backgroundColor: account?.avatarColor ?? "#2563EB" }}
              >
                {account?.shortName}
              </div>
              <Button
                variant="outline"
                onClick={() => toast.info("Mở hộp thoại tải & cắt avatar (demo)")}
              >
                <Upload className="mr-1.5 h-4 w-4" /> Đổi avatar
              </Button>
            </div>
            <div>
              <Label htmlFor="ch-name" className="mb-1.5 block">
                Tên hiển thị
              </Label>
              <Input id="ch-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ch-bio" className="mb-1.5 block">
                Giới thiệu
              </Label>
              <Textarea id="ch-bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ch-web" className="mb-1.5 block">
                Website
              </Label>
              <Input id="ch-web" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>

            {scope === "org" && (
              <div className="rounded-lg border border-border bg-accent/50 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Users className="h-4 w-4 text-primary" /> Quản lý thành viên
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Mời, phân quyền Owner / Manager / Editor cho kênh tổ chức.
                </p>
                <Button variant="link" className="h-auto p-0 text-[#2563EB]" asChild>
                  <Link to="/org/members">Mở trang quản lý thành viên →</Link>
                </Button>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
              <Button variant="outline" asChild>
                <Link to={viewTo}>Hủy</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to={viewTo}>Xem trước ↗</Link>
              </Button>
              <Button
                className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
                onClick={() => toast.success("Đã lưu thay đổi kênh")}
              >
                Lưu thay đổi
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nội dung ghim</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Chọn học liệu nổi bật hiển thị ở đầu trang kênh.
            </p>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có học liệu đã xuất bản.</p>
            ) : (
              items.map((item) => (
                <PinRow
                  key={item.id}
                  item={item}
                  pinned={pinned.includes(item.id)}
                  onToggle={() => togglePin(item.id)}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </PageFrame>
  );
}

function PinRow({
  item,
  pinned,
  onToggle,
}: {
  item: ContentItem;
  pinned: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition",
        pinned ? "border-[#2563EB] bg-accent" : "border-border hover:bg-muted/40",
      )}
    >
      <Pin className={cn("h-4 w-4", pinned ? "text-[#2563EB]" : "text-muted-foreground")} />
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
        {item.title}
      </span>
      <span className="text-xs text-muted-foreground">{item.views.toLocaleString()} xem</span>
    </button>
  );
}
