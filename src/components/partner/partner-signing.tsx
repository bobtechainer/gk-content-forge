import { useMemo, useState } from "react";
import { CheckCircle2, FileSignature, Sparkles } from "lucide-react";
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
import { generateRegistryId } from "@/lib/registry-id";
import type { AccessTerms, ContentLicense, LicenseScope, LicenseType } from "@/lib/types";
import { usePageLoading } from "@/lib/use-page-loading";
import { cn } from "@/lib/utils";
import { useContent } from "@/stores/content";
import { PageFrame } from "../shared/page-frame";
import { PageSkeleton } from "../shared/page-skeleton";
import { QualityBadge } from "../shared/quality-badge";
import { RegistryIdChip } from "../shared/registry-id-chip";

/** Số thứ tự khởi điểm khi sinh mã định danh demo — chỉ là số mock cho prototype. */
const REGISTRY_SEQ_BASE = 248;
const REGISTRY_YEAR = 2026;

const LICENSE_TYPE_OPTIONS: { value: LicenseType; label: string }[] = [
  { value: "exclusive", label: "Độc quyền" },
  { value: "cc", label: "Creative Commons (CC)" },
  { value: "commercial", label: "Thương mại" },
];

const LICENSE_SCOPE_OPTIONS: { value: LicenseScope; label: string }[] = [
  { value: "national", label: "Toàn quốc" },
  { value: "provincial", label: "Theo tỉnh" },
  { value: "school", label: "Theo trường" },
];

const ACCESS_TERMS_OPTIONS: { value: AccessTerms; label: string }[] = [
  { value: "free", label: "Miễn phí" },
  { value: "paid", label: "Trả phí" },
];

interface LicenseDraft {
  type: LicenseType;
  scope: LicenseScope;
  rightsHolder: string;
  validUntil: string;
  accessTerms: AccessTerms;
}

const DEFAULT_DRAFT: LicenseDraft = {
  type: "commercial",
  scope: "national",
  rightsHolder: "NXB Giáo dục VN",
  validUntil: "2028-12-31",
  accessTerms: "paid",
};

interface SignedResult {
  registryId: string;
  signedAt: string;
}

export function PartnerSigningPage() {
  const loading = usePageLoading();
  const items = useContent((s) => s.items);
  const updateItem = useContent((s) => s.updateItem);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<LicenseDraft>(DEFAULT_DRAFT);
  const [signed, setSigned] = useState<Record<string, SignedResult>>({});

  // Học liệu đối tác chưa cấp mã định danh: lọc theo publisher + registryId rỗng.
  const unsignedItems = useMemo(
    () => items.filter((i) => i.ownerId === "publisher" && !i.registryId),
    [items],
  );

  if (loading) return <PageSkeleton />;

  const selected = selectedId ? items.find((i) => i.id === selectedId) ?? null : null;
  const selectedSigned = selectedId ? signed[selectedId] : undefined;

  // Mã sẽ cấp — preview read-only, hệ thống tự sinh.
  const previewId = selected
    ? generateRegistryId(
        "partner",
        selected.subject,
        REGISTRY_SEQ_BASE + unsignedItems.findIndex((i) => i.id === selected.id),
        REGISTRY_YEAR,
      )
    : null;

  const pickItem = (id: string) => {
    setSelectedId(id);
    setDraft(DEFAULT_DRAFT);
  };

  const sign = () => {
    if (!selected || !previewId) return;
    const license: ContentLicense = {
      type: draft.type,
      scope: draft.scope,
      rightsHolder: draft.rightsHolder.trim() || "NXB Giáo dục VN",
      validUntil: draft.validUntil,
      accessTerms: draft.accessTerms,
    };
    updateItem(selected.id, {
      registryId: previewId,
      tier: "partner",
      qualityLabel: "trusted_partner",
      license,
    });
    setSigned((cur) => ({
      ...cur,
      [selected.id]: { registryId: previewId, signedAt: new Date().toLocaleString("vi-VN") },
    }));
    toast.success("Đã vào hàng đợi Hội đồng (ưu tiên Đối tác)");
  };

  return (
    <PageFrame
      title="Đăng ký & ký số học liệu"
      description="Cấp mã định danh và cấu hình bản quyền cho học liệu đối tác."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card className="self-start">
          <CardHeader>
            <CardTitle className="text-base">Chờ ký số</CardTitle>
            <CardDescription>Học liệu đối tác chưa được cấp mã định danh.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {unsignedItems.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Mọi học liệu đối tác đều đã được cấp mã định danh.
              </p>
            ) : (
              unsignedItems.map((item) => {
                const isActive = item.id === selectedId;
                const isSigned = Boolean(signed[item.id]);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => pickItem(item.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition",
                      isActive
                        ? "border-primary bg-accent"
                        : "border-border hover:border-primary/40 hover:bg-muted",
                    )}
                  >
                    <FileSignature className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">
                        {item.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.subject} • {item.grade}
                      </div>
                    </div>
                    {isSigned && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />}
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        {!selected ? (
          <Card className="self-start">
            <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-2 p-10 text-center">
              <FileSignature className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Chọn một học liệu để ký số</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Chọn học liệu ở danh sách bên trái, bạn sẽ cấu hình bản quyền và cấp mã định danh
                trước khi gửi Hội đồng thẩm định.
              </p>
            </CardContent>
          </Card>
        ) : selectedSigned ? (
          <Card className="self-start">
            <CardHeader>
              <CardTitle className="text-base">Đã ký số thành công</CardTitle>
              <CardDescription>{selected.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/30 p-6 text-center">
                <CheckCircle2 className="h-10 w-10 text-success" />
                <div className="space-y-2">
                  <RegistryIdChip id={selectedSigned.registryId} />
                  <div>
                    <QualityBadge label="trusted_partner" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Đã ký lúc {selectedSigned.signedAt}</p>
              </div>
              <div className="rounded-lg border border-primary/30 bg-accent p-3 text-sm text-accent-foreground">
                Học liệu đã vào hàng đợi Hội đồng với mức ưu tiên dành cho đối tác. Bạn sẽ nhận thông
                báo khi có kết quả thẩm định.
              </div>
              <Button variant="outline" className="w-full" onClick={() => setSelectedId(null)}>
                Ký học liệu khác
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="self-start">
            <CardHeader>
              <CardTitle className="text-base">Hồ sơ ký số</CardTitle>
              <CardDescription>{selected.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label className="mb-1.5 block text-xs">Mã định danh sẽ cấp</Label>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
                  <span className="font-mono text-sm font-medium text-foreground">
                    {previewId}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    <Sparkles className="h-3 w-3" /> Hệ thống tự sinh
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Bản quyền & cấp phép</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Loại giấy phép">
                    <Select
                      value={draft.type}
                      onValueChange={(v) => setDraft((d) => ({ ...d, type: v as LicenseType }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại giấy phép" />
                      </SelectTrigger>
                      <SelectContent>
                        {LICENSE_TYPE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="Phạm vi sử dụng">
                    <Select
                      value={draft.scope}
                      onValueChange={(v) => setDraft((d) => ({ ...d, scope: v as LicenseScope }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn phạm vi" />
                      </SelectTrigger>
                      <SelectContent>
                        {LICENSE_SCOPE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="Chủ sở hữu quyền">
                    <Input
                      value={draft.rightsHolder}
                      onChange={(e) => setDraft((d) => ({ ...d, rightsHolder: e.target.value }))}
                      placeholder="Tên đơn vị giữ bản quyền"
                    />
                  </Field>

                  <Field label="Thời hạn hiệu lực">
                    <Input
                      type="date"
                      value={draft.validUntil}
                      onChange={(e) => setDraft((d) => ({ ...d, validUntil: e.target.value }))}
                    />
                  </Field>

                  <Field label="Điều khoản truy cập">
                    <Select
                      value={draft.accessTerms}
                      onValueChange={(v) =>
                        setDraft((d) => ({ ...d, accessTerms: v as AccessTerms }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn điều khoản" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACCESS_TERMS_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </div>

              <Button className="w-full" onClick={sign}>
                <FileSignature className="mr-1.5 h-4 w-4" /> Ký số & gửi thẩm định
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PageFrame>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs">{label}</Label>
      {children}
    </div>
  );
}
