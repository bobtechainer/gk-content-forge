import { useMemo, useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Eye,
  Gavel,
  ShieldX,
  Sparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CURRICULUM, type Outcome } from "@/lib/curriculum";
import { resolveDemoAccount } from "@/lib/mock-data";
import type { ContentTier, QualityLabel } from "@/lib/types";
import { usePageLoading } from "@/lib/use-page-loading";
import { cn } from "@/lib/utils";
import { useContent } from "@/stores/content";
import { useSession } from "@/stores/session";
import { PageFrame } from "../shared/page-frame";
import { PageSkeleton } from "../shared/page-skeleton";
import { QualityBadge } from "../shared/quality-badge";
import { RegistryIdChip } from "../shared/registry-id-chip";

const TIER_LABEL: Record<ContentTier, string> = {
  root: "Tầng Gốc",
  partner: "Đối tác",
  community: "Cộng đồng",
};

/** 5 tiêu chí rubric của Hội đồng thẩm định. */
const RUBRIC = [
  { id: "accuracy", label: "Chính xác khoa học" },
  { id: "outcomes", label: "Bám chuẩn đầu ra" },
  { id: "pedagogy", label: "Sư phạm" },
  { id: "technical", label: "Kỹ thuật / đa phương tiện" },
  { id: "copyright", label: "Bản quyền" },
] as const;

type RubricVerdict = "pass" | "revise" | "fail";

const VERDICT_OPTIONS: { value: RubricVerdict; label: string }[] = [
  { value: "pass", label: "Đạt" },
  { value: "revise", label: "Cần sửa" },
  { value: "fail", label: "Không đạt" },
];

const APPROVE_TARGETS: { value: Extract<QualityLabel, "reviewed" | "ministry_standard">; label: string }[] = [
  { value: "reviewed", label: "Đã thẩm định" },
  { value: "ministry_standard", label: "Chuẩn Bộ" },
];

/** Gom outcomes của môn tương ứng từ khung chương trình để đối chiếu. */
function outcomesForSubject(subject: string): Outcome[] {
  const out: Outcome[] = [];
  for (const grade of CURRICULUM) {
    for (const subj of grade.subjects) {
      if (subj.name !== subject) continue;
      for (const strand of subj.strands) {
        for (const chapter of strand.chapters) {
          for (const lesson of chapter.lessons) {
            out.push(...lesson.outcomes);
          }
        }
      }
    }
  }
  return out;
}

export function ReviewerDetailPage() {
  const loading = usePageLoading();
  const { id } = useParams({ from: "/reviewer/review/$id" });
  const item = useContent((s) => s.items.find((i) => i.id === id));
  const setStatus = useContent((s) => s.setStatus);
  const updateItem = useContent((s) => s.updateItem);

  const roleId = useSession((s) => s.roleId);
  const schoolRole = useSession((s) => s.schoolRole);
  const council =
    roleId === "reviewer"
      ? resolveDemoAccount("reviewer", schoolRole).council ?? "Hội đồng thẩm định"
      : "Hội đồng thẩm định";

  const [verdicts, setVerdicts] = useState<Record<string, RubricVerdict>>({});
  const [checkedOutcomes, setCheckedOutcomes] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const [target, setTarget] = useState<"reviewed" | "ministry_standard">("reviewed");

  const outcomes = useMemo(() => outcomesForSubject(item?.subject ?? ""), [item?.subject]);

  if (loading) return <PageSkeleton />;

  if (!item) {
    return (
      <PageFrame title="Không tìm thấy học liệu" description="Có thể học liệu đã được xử lý hoặc gỡ bỏ.">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <ShieldX className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Không có học liệu nào khớp mã định danh này trong hàng đợi.
            </p>
            <Button asChild variant="outline">
              <Link to="/reviewer/queue">
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Về hàng đợi
              </Link>
            </Button>
          </CardContent>
        </Card>
      </PageFrame>
    );
  }

  const isCourse = item.category === "course";

  const approve = () => {
    const meta = APPROVE_TARGETS.find((t) => t.value === target);
    updateItem(item.id, { qualityLabel: target });
    setStatus(item.id, "published");
    toast.success(`Đã gắn nhãn "${meta?.label}" cho ${item.title}`);
  };

  const requestRevision = () => {
    updateItem(item.id, { qualityLabel: "needs_revision" });
    toast.success(`Đã gửi yêu cầu chỉnh sửa tới tác giả ${item.ownerName ?? ""}`.trim());
  };

  const reject = () => {
    updateItem(item.id, { qualityLabel: "rejected" });
    setStatus(item.id, "rejected");
    toast.success(`Đã từ chối ${item.title}`);
  };

  return (
    <PageFrame
      title="Thẩm định học liệu"
      description={`Đối chiếu rubric và chuẩn đầu ra trước khi gắn nhãn. Thẩm định bởi: ${council}.`}
      actions={
        <Button asChild variant="outline" size="sm">
          <Link to="/reviewer/queue">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Hàng đợi
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* Cột trái — trải nghiệm học liệu */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  {item.registryId && <RegistryIdChip id={item.registryId} />}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {item.qualityLabel && <QualityBadge label={item.qualityLabel} />}
                  {item.tier === "partner" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      <BadgeCheck className="h-3 w-3" /> Đối tác
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                <span>
                  Môn: <span className="text-foreground">{item.subject}</span>
                </span>
                <span>
                  Lớp: <span className="text-foreground">{item.grade}</span>
                </span>
                <span>
                  Tầng:{" "}
                  <span className="text-foreground">{item.tier ? TIER_LABEL[item.tier] : "—"}</span>
                </span>
                <span>
                  Tác giả: <span className="text-foreground">{item.ownerName ?? item.ownerId}</span>
                </span>
              </div>
              {item.description && (
                <p className="text-sm text-muted-foreground">{item.description}</p>
              )}
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((t) => (
                    <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Khu xem nội dung (placeholder fidelity — Preview thực dùng cho student/learn) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-4 w-4 text-primary" /> Xem trải nghiệm học liệu
              </CardTitle>
              <CardDescription>
                {isCourse
                  ? "Khóa học nhiều phần — xem trước từng phần như học sinh trải nghiệm."
                  : "Nội dung học liệu hiển thị đúng như trên kho quốc gia."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold text-white"
                  style={{ backgroundColor: item.thumbnailColor }}
                >
                  {item.subject.slice(0, 1)}
                </div>
                <div className="text-sm font-medium text-foreground">{item.title}</div>
                <p className="max-w-md text-xs text-muted-foreground">
                  Khu vực này nhúng trình Preview của {isCourse ? "khóa học" : "học liệu"} ở chế độ
                  chỉ xem. Bạn cuộn qua từng phần để đánh giá đầy đủ trước khi chấm rubric.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info("Mở trình xem học liệu (demo)")}
                >
                  Mở toàn màn hình
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cột phải — form thẩm định (sticky) */}
        <div className="xl:sticky xl:top-20 xl:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Gavel className="h-4 w-4 text-primary" /> Phiếu thẩm định
              </CardTitle>
              <CardDescription>Thẩm định bởi: {council}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Rubric 5 tiêu chí */}
              <div className="space-y-4">
                <div className="text-sm font-semibold text-foreground">Tiêu chí đánh giá</div>
                {RUBRIC.map((c) => (
                  <div key={c.id} className="space-y-2">
                    <Label className="text-sm text-foreground">{c.label}</Label>
                    <RadioGroup
                      value={verdicts[c.id]}
                      onValueChange={(v) =>
                        setVerdicts((cur) => ({ ...cur, [c.id]: v as RubricVerdict }))
                      }
                      className="grid grid-cols-3 gap-2"
                    >
                      {VERDICT_OPTIONS.map((opt) => {
                        const checked = verdicts[c.id] === opt.value;
                        return (
                          <label
                            key={opt.value}
                            className={cn(
                              "flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                              checked
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:bg-muted",
                            )}
                          >
                            <RadioGroupItem value={opt.value} className="h-3.5 w-3.5" />
                            {opt.label}
                          </label>
                        );
                      })}
                    </RadioGroup>
                  </div>
                ))}
              </div>

              {/* Checklist chuẩn đầu ra */}
              <div className="space-y-2 border-t border-border pt-4">
                <div className="text-sm font-semibold text-foreground">
                  Đối chiếu chuẩn đầu ra ({item.subject})
                </div>
                {outcomes.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Chưa có chuẩn đầu ra trong khung chương trình cho môn này.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {outcomes.map((o) => (
                      <label
                        key={o.id}
                        className="flex cursor-pointer items-start gap-2.5 rounded-md p-1.5 hover:bg-muted"
                      >
                        <Checkbox
                          checked={!!checkedOutcomes[o.id]}
                          onCheckedChange={(v) =>
                            setCheckedOutcomes((cur) => ({ ...cur, [o.id]: v === true }))
                          }
                          className="mt-0.5"
                        />
                        <span className="text-xs text-muted-foreground">
                          <span className="font-mono text-foreground">{o.code}</span> — {o.text}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Ghi chú */}
              <div className="space-y-2 border-t border-border pt-4">
                <Label htmlFor="review-notes" className="text-sm font-semibold text-foreground">
                  Nhận xét của Hội đồng
                </Label>
                <Textarea
                  id="review-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú chuyên môn, điểm cần lưu ý cho tác giả…"
                  rows={3}
                />
              </div>

              {/* Hành động */}
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-sm text-muted-foreground">Gắn nhãn:</span>
                  <Select value={target} onValueChange={(v) => setTarget(v as typeof target)}>
                    <SelectTrigger aria-label="Nhãn đích" className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {APPROVE_TARGETS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full gap-1.5 bg-primary text-white hover:bg-primary-hover"
                  onClick={approve}
                >
                  <CheckCircle2 className="h-4 w-4" /> Đạt — gắn nhãn
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="gap-1.5" onClick={requestRevision}>
                    <Sparkles className="h-4 w-4" /> Yêu cầu chỉnh sửa
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-1.5 text-destructive"
                    onClick={reject}
                  >
                    <XCircle className="h-4 w-4" /> Từ chối
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageFrame>
  );
}
