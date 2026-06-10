import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Building2, Lock, Palette, Send, ShieldCheck, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { StudioScope } from "@/lib/use-scoped-content";
import { useActiveAccount } from "@/lib/use-active-account";
import { usePageLoading } from "@/lib/use-page-loading";
import { PageFrame } from "./page-frame";
import { PageSkeleton } from "./page-skeleton";

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Lock;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function ToggleRow({
  label,
  description,
  defaultChecked,
}: {
  label: string;
  description?: string;
  defaultChecked?: boolean;
}) {
  const [on, setOn] = useState(Boolean(defaultChecked));
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        {description && <div className="text-xs text-muted-foreground">{description}</div>}
      </div>
      <Switch checked={on} onCheckedChange={setOn} />
    </div>
  );
}

export function SettingsView({ scope }: { scope: StudioScope }) {
  const loading = usePageLoading();
  const account = useActiveAccount(scope);
  const isOrg = scope === "org";

  const [name, setName] = useState(account?.name ?? "");
  const [bio, setBio] = useState(account?.bio ?? "");
  const [website, setWebsite] = useState(account?.website ?? "");

  if (loading) return <PageSkeleton />;

  const verificationTo = isOrg ? "/org/verification" : "/creator/verification";

  return (
    <PageFrame
      title="Cài đặt"
      description="Quản lý hồ sơ, bảo mật, giao diện và thông báo theo loại tài khoản."
      actions={
        <Button
          className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
          onClick={() => toast.success("Đã lưu cài đặt")}
        >
          Lưu thay đổi
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Section
          icon={isOrg ? Building2 : UserCircle}
          title={isOrg ? "Hồ sơ tổ chức" : "Hồ sơ cá nhân"}
          description={isOrg ? "Tên, logo, mô tả, giấy phép" : "Tên, ảnh đại diện, bio, liên kết"}
        >
          <div>
            <Label className="mb-1.5 block">{isOrg ? "Tên tổ chức" : "Họ tên"}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">{isOrg ? "Mô tả" : "Giới thiệu"}</Label>
            <Textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">Website</Label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
          {isOrg && (
            <div>
              <Label className="mb-1.5 block">Giấy phép / quyết định thành lập</Label>
              <button
                type="button"
                onClick={() => toast.info("Tải lên giấy phép (demo)")}
                className="flex h-20 w-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:border-[#2563EB]"
              >
                Tải lên tệp PDF/ảnh
              </button>
            </div>
          )}
        </Section>

        <div className="space-y-4">
          <Section icon={Lock} title="Bảo mật" description="Mật khẩu và xác minh 2 lớp">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => toast.info("Đổi mật khẩu (demo)")}
            >
              Đổi mật khẩu
            </Button>
            <ToggleRow label="Xác minh 2 lớp (2FA)" description="Bảo vệ tài khoản bằng OTP" />
          </Section>

          <Section icon={Palette} title="Giao diện" description="Ngôn ngữ và chủ đề hiển thị">
            <div>
              <Label className="mb-1.5 block">Ngôn ngữ</Label>
              <Select defaultValue="vi">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vi">Tiếng Việt</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Chủ đề</Label>
              <Select defaultValue="light">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Sáng</SelectItem>
                  <SelectItem value="dark">Tối</SelectItem>
                  <SelectItem value="system">Theo hệ thống</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Section>

          <Section icon={Bell} title="Thông báo" description="Email và push notification">
            <ToggleRow
              label="Email thông báo"
              description="Cập nhật duyệt nội dung, tương tác"
              defaultChecked
            />
            <ToggleRow label="Push notification" defaultChecked />
          </Section>

          {isOrg ? (
            <Section
              icon={Send}
              title="Nền tảng phân phối"
              description="Nền tảng xuất bản mặc định"
            >
              <ToggleRow label="Trường học số quốc gia" defaultChecked />
              <ToggleRow label="GK Ebooks" defaultChecked />
            </Section>
          ) : (
            <Section icon={ShieldCheck} title="Quyền riêng tư">
              <ToggleRow label="Ẩn kênh khỏi tìm kiếm công khai" />
              <ToggleRow label="Cho phép trích dẫn học liệu" defaultChecked />
            </Section>
          )}

          <Section icon={ShieldCheck} title="Tiến độ xác minh">
            <Button variant="outline" className="w-full" asChild>
              <Link to={verificationTo}>Mở trang xác minh →</Link>
            </Button>
          </Section>
        </div>
      </div>
    </PageFrame>
  );
}
