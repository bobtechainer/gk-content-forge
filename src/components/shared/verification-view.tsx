import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Award,
  BadgeCheck,
  CheckCircle2,
  ExternalLink,
  Shield,
  Sparkles,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ACCOUNTS } from "@/lib/mock-data";
import { useScopedContent, type StudioScope } from "@/lib/use-scoped-content";
import { usePageLoading } from "@/lib/use-page-loading";
import { cn } from "@/lib/utils";
import { useSession } from "@/stores/session";
import { PageFrame } from "./page-frame";
import { PageSkeleton } from "./page-skeleton";

interface Criterion {
  key: string;
  label: string;
  met: boolean;
  current: string;
  threshold: string;
  cta?: { label: string; to?: string; onClick?: () => void };
  aiHint?: string;
}

export function VerificationView({ scope }: { scope: StudioScope }) {
  const loading = usePageLoading();
  const roleId = useSession((s) => s.roleId);
  const account = roleId ? ACCOUNTS[roleId] : null;
  const items = useScopedContent(scope);

  if (loading) return <PageSkeleton />;
  if (!account) return null;

  const alreadyVerified =
    account.verified === "L2" || account.verified === "L1" || account.verified === "admin";
  const isOrg = scope === "org";

  if (alreadyVerified) {
    return (
      <VerifiedSuccessView
        scope={scope}
        level={account.verified as "L1" | "L2" | "admin"}
        accountType={account.accountType}
        isOrg={isOrg}
      />
    );
  }

  return (
    <UnverifiedChecklistView
      scope={scope}
      isOrg={isOrg}
      items={items}
      profileComplete={Boolean(account.bio && account.email)}
      email={account.email}
      accountType={account.accountType}
    />
  );
}

/* ─── Verified Success View ────────────────────────────────────────── */

const VERIFICATION_BENEFITS = [
  {
    icon: Zap,
    title: "Tự động xuất bản",
    description: "Nội dung được xuất bản ngay không cần chờ admin duyệt.",
  },
  {
    icon: Award,
    title: "Ưu tiên hiển thị",
    description: "Kênh và nội dung được ưu tiên trên trang khám phá.",
  },
  {
    icon: BadgeCheck,
    title: "Huy hiệu tích xanh",
    description: "Hiển thị badge xác minh trên kênh và tất cả nội dung.",
  },
  {
    icon: Shield,
    title: "Bảo vệ nâng cao",
    description: "Bảo vệ chống lại mạo danh và sao chép nội dung.",
  },
];

function VerifiedSuccessView({
  scope,
  level,
  accountType,
  isOrg,
}: {
  scope: StudioScope;
  level: "L1" | "L2" | "admin";
  accountType: string;
  isOrg: boolean;
}) {
  const levelLabel = level === "admin" ? "Admin" : level === "L2" ? "Cấp 2 (L2)" : "Cấp 1 (L1)";
  const channelTo = isOrg ? "/org/channel" : "/creator/channel";

  return (
    <PageFrame
      title={isOrg ? "Xác minh tổ chức" : "Xác minh tài khoản"}
      description="Tài khoản của bạn đã được xác minh thành công."
    >
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        {/* Success card */}
        <Card className="overflow-hidden">
          <div className="relative bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] px-6 py-8 text-white">
            <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/30">
                <BadgeCheck className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Đã xác minh</h2>
                <p className="text-sm text-blue-100">
                  {accountType} • Xác minh {levelLabel}
                </p>
              </div>
            </div>
          </div>
          <CardContent className="space-y-4 p-6">
            <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Tài khoản đạt đầy đủ tiêu chí xác minh
              </div>
              <p className="mt-1 text-xs">
                Được phê duyệt ngày 15/05/2026 bởi đội ngũ kiểm duyệt GK.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to={channelTo}>Xem kênh của tôi</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-[#2563EB]"
                onClick={() =>
                  toast.info("Mở trang chính sách duy trì xác minh (demo)")
                }
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Chính sách duy trì xác minh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Benefits card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#2563EB]" />
              Quyền lợi đang hưởng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {VERIFICATION_BENEFITS.map((b) => {
                const Icon = b.icon;
                return (
                  <li key={b.title} className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2563EB]/10 text-[#2563EB]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{b.title}</div>
                      <div className="text-xs text-muted-foreground">{b.description}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>
    </PageFrame>
  );
}

/* ─── Unverified Checklist View (existing logic preserved) ────────── */

function UnverifiedChecklistView({
  scope,
  isOrg,
  items,
  profileComplete,
  email,
  accountType,
}: {
  scope: StudioScope;
  isOrg: boolean;
  items: ReturnType<typeof useScopedContent>;
  profileComplete: boolean;
  email?: string;
  accountType: string;
}) {
  const [docsUploaded, setDocsUploaded] = useState(false);

  const published = items.filter((i) => i.status === "published").length;
  const views = items.reduce((s, i) => s + i.views, 0);

  const uploadDocs = () => {
    setDocsUploaded(true);
    toast.success(isOrg ? "Đã tải giấy phép hoạt động" : "Đã tải chứng chỉ nghề nghiệp");
  };

  const studioTo = isOrg ? "/org/library" : "/creator/library";
  const settingsTo = isOrg ? "/org/settings" : "/creator/settings";

  const criteria: Criterion[] = isOrg
    ? [
        {
          key: "license",
          label: "Giấy phép hoạt động",
          met: docsUploaded,
          current: docsUploaded ? "Đã tải" : "Chưa tải",
          threshold: "≥ 1 file",
          cta: docsUploaded ? undefined : { label: "Tải lên giấy tờ", onClick: uploadDocs },
        },
        {
          key: "email",
          label: "Email tên miền tổ chức",
          met: Boolean(email),
          current: email ?? "Chưa có",
          threshold: "Trùng WHOIS",
          cta: email ? undefined : { label: "Cập nhật email", to: settingsTo },
        },
        {
          key: "materials",
          label: "Số học liệu xuất bản",
          met: published >= 10,
          current: `${published}`,
          threshold: "≥ 10",
          cta: published >= 10 ? undefined : { label: "Tạo học liệu mới", to: studioTo },
        },
        {
          key: "views",
          label: "Lượt xem thực tế",
          met: views >= 2000,
          current: views.toLocaleString(),
          threshold: "≥ 2.000",
          aiHint:
            views >= 2000
              ? undefined
              : "Đẩy mạnh phân phối qua các Sở GD & nhóm chuyên môn để tăng lượt xem.",
        },
      ]
    : [
        {
          key: "credentials",
          label: "Chứng chỉ nghề nghiệp",
          met: docsUploaded,
          current: docsUploaded ? "Đã tải" : "Chưa tải",
          threshold: "≥ 1 file",
          cta: docsUploaded ? undefined : { label: "Tải lên giấy tờ", onClick: uploadDocs },
        },
        {
          key: "materials",
          label: "Số học liệu xuất bản",
          met: published >= 5,
          current: `${published}`,
          threshold: "≥ 5",
          cta: published >= 5 ? undefined : { label: "Tạo học liệu mới", to: studioTo },
        },
        {
          key: "views",
          label: "Lượt xem thực tế",
          met: views >= 500,
          current: views.toLocaleString(),
          threshold: "≥ 500",
          aiHint:
            views >= 500
              ? undefined
              : "Chia sẻ bài giảng lên nhóm chuyên môn để nhanh đạt mốc lượt xem.",
        },
        {
          key: "profile",
          label: "Hoàn thiện hồ sơ",
          met: profileComplete,
          current: profileComplete ? "Đầy đủ" : "Còn thiếu",
          threshold: "Avatar + Bio + Email",
          cta: profileComplete ? undefined : { label: "Cập nhật hồ sơ", to: settingsTo },
          aiHint: profileComplete ? undefined : "Hồ sơ của bạn nên bổ sung email tổ chức giáo dục.",
        },
      ];

  const metCount = criteria.filter((c) => c.met).length;
  const allMet = metCount === criteria.length;

  return (
    <PageFrame
      title={isOrg ? "Xác minh tổ chức" : "Xác minh tài khoản"}
      description="Đạt đủ tiêu chí để nhận tích xanh và tăng độ tin cậy cho kênh."
    >
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Tiến độ xác minh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">
                  {metCount}/{criteria.length} tiêu chí đạt
                </span>
                <span className="text-muted-foreground">
                  {Math.round((metCount / criteria.length) * 100)}%
                </span>
              </div>
              <Progress value={(metCount / criteria.length) * 100} />
            </div>

            <ul className="space-y-3">
              {criteria.map((c) => (
                <li
                  key={c.key}
                  className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center"
                >
                  {c.met ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="h-5 w-5 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground">{c.label}</div>
                    <div className="text-xs text-muted-foreground">
                      Hiện tại: <span className="font-medium text-foreground">{c.current}</span> •
                      Yêu cầu: {c.threshold}
                    </div>
                    {c.aiHint && (
                      <div className="mt-1 flex items-start gap-1 text-xs text-[#2563EB]">
                        <Sparkles className="mt-0.5 h-3 w-3 shrink-0" /> {c.aiHint}
                      </div>
                    )}
                  </div>
                  {c.cta &&
                    (c.cta.to ? (
                      <Button size="sm" variant="outline" asChild>
                        <Link to={c.cta.to}>{c.cta.label}</Link>
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={c.cta.onClick}>
                        {c.cta.label}
                      </Button>
                    ))}
                </li>
              ))}
            </ul>

            <Button
              className={cn("w-full gap-2", allMet && "bg-[#2563EB] text-white hover:bg-[#1d4ed8]")}
              disabled={!allMet}
              onClick={() => toast.success("Đã gửi đơn xin xác minh — chờ admin duyệt")}
            >
              <BadgeCheck className="h-4 w-4" />
              Gửi đơn xin xác minh
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trạng thái hiện tại</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-4 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
              <BadgeCheck className="h-8 w-8" />
              <div>
                <div className="text-lg font-bold">Chưa xác minh</div>
                <div className="text-xs">{accountType}</div>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Tài khoản được tích xanh sẽ được ưu tiên hiển thị và tự động xuất bản không cần chờ
              duyệt.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageFrame>
  );
}
