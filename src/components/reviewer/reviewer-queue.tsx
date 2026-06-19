import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Check, Filter, Inbox, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ACCOUNTS, VERIFICATION_REQUESTS } from "@/lib/mock-data";
import type { ContentItem, ContentTier, VerificationRequest } from "@/lib/types";
import { usePageLoading } from "@/lib/use-page-loading";
import { cn } from "@/lib/utils";
import { useContent } from "@/stores/content";
import { PageFrame } from "../shared/page-frame";
import { PageSkeleton } from "../shared/page-skeleton";
import { QualityBadge } from "../shared/quality-badge";
import { RegistryIdChip } from "../shared/registry-id-chip";

const ALL = "all";

const TIER_LABEL: Record<ContentTier, string> = {
  root: "Tầng Gốc",
  partner: "Đối tác",
  community: "Cộng đồng",
};

/** Học liệu cần Hội đồng thẩm định: đang chờ duyệt hoặc nhãn ở giai đoạn đầu luồng. */
function needsReview(item: ContentItem): boolean {
  return (
    item.status === "pending" ||
    item.qualityLabel === "submitted" ||
    item.qualityLabel === "documented"
  );
}

export function ReviewerQueuePage() {
  const loading = usePageLoading();
  const items = useContent((s) => s.items);
  const [subject, setSubject] = useState<string>(ALL);
  const [grade, setGrade] = useState<string>(ALL);
  const [partnerFirst, setPartnerFirst] = useState(false);

  const queue = useMemo(() => items.filter(needsReview), [items]);

  const subjects = useMemo(
    () => Array.from(new Set(queue.map((i) => i.subject))).sort((a, b) => a.localeCompare(b, "vi")),
    [queue],
  );
  const grades = useMemo(
    () => Array.from(new Set(queue.map((i) => i.grade))).sort((a, b) => a.localeCompare(b, "vi")),
    [queue],
  );

  const filtered = useMemo(() => {
    const matched = queue.filter(
      (i) =>
        (subject === ALL || i.subject === subject) && (grade === ALL || i.grade === grade),
    );
    // Item đối tác luôn xếp trước; khi bật "Ưu tiên Đối tác" chỉ giữ lại item đối tác.
    const scoped = partnerFirst ? matched.filter((i) => i.tier === "partner") : matched;
    return [...scoped].sort((a, b) => {
      const pa = a.tier === "partner" ? 0 : 1;
      const pb = b.tier === "partner" ? 0 : 1;
      return pa - pb;
    });
  }, [queue, subject, grade, partnerFirst]);

  if (loading) return <PageSkeleton />;

  return (
    <PageFrame
      title="Hàng đợi thẩm định"
      description="Học liệu chờ Hội đồng thẩm định và đơn xác minh tài khoản chờ xét duyệt."
    >
      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Học liệu chờ thẩm định ({queue.length})</TabsTrigger>
          <TabsTrigger value="verification">Đơn xác minh tài khoản</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-4 space-y-4">
      {/* Bộ lọc */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" /> Lọc
          </div>
          <div className="min-w-[160px]">
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger aria-label="Lọc theo môn">
                <SelectValue placeholder="Môn học" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tất cả môn</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[140px]">
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger aria-label="Lọc theo lớp">
                <SelectValue placeholder="Cấp lớp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tất cả lớp</SelectItem>
                {grades.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button
            type="button"
            aria-pressed={partnerFirst}
            onClick={() => setPartnerFirst((v) => !v)}
            className={cn(
              "ml-auto inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
              partnerFirst
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            <BadgeCheck className="h-4 w-4" /> Ưu tiên Đối tác
          </button>
        </CardContent>
      </Card>

      {/* Bảng hàng đợi */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted-foreground">
            <Inbox className="h-8 w-8 text-muted-foreground" />
            Không có học liệu nào chờ thẩm định theo bộ lọc hiện tại.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[260px]">Học liệu</TableHead>
                  <TableHead>Môn / Lớp</TableHead>
                  <TableHead>Nhãn chất lượng</TableHead>
                  <TableHead>Tầng</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => {
                  const isPartner = item.tier === "partner";
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{item.title}</span>
                            {isPartner && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                <BadgeCheck className="h-3 w-3" /> Đối tác
                              </span>
                            )}
                          </div>
                          {item.registryId && <RegistryIdChip id={item.registryId} />}
                          <span className="text-xs text-muted-foreground">
                            {item.ownerName ?? item.ownerId} • gửi {item.createdAt}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="text-foreground">{item.subject}</div>
                        <div>{item.grade}</div>
                      </TableCell>
                      <TableCell>
                        {item.qualityLabel ? (
                          <QualityBadge label={item.qualityLabel} />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.tier ? TIER_LABEL[item.tier] : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline" className="gap-1.5">
                          <Link to="/reviewer/review/$id" params={{ id: item.id }}>
                            Thẩm định <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="verification" className="mt-4">
          <VerificationQueue />
        </TabsContent>
      </Tabs>
    </PageFrame>
  );
}

const VERIFICATION_STATUS_META: Record<
  VerificationRequest["status"],
  { label: string; cls: string }
> = {
  pending: { label: "Đang chờ", cls: "bg-warning-100 text-warning-700" },
  approved: { label: "Đã duyệt", cls: "bg-success/10 text-success" },
  rejected: { label: "Đã từ chối", cls: "bg-destructive/10 text-destructive" },
};

function VerificationStatusPill({ status }: { status: VerificationRequest["status"] }) {
  const meta = VERIFICATION_STATUS_META[status];
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", meta.cls)}>
      {meta.label}
    </span>
  );
}

/** Đơn xác minh tài khoản chờ Hội đồng xét duyệt (tái dùng dữ liệu mock của Bộ). */
function VerificationQueue() {
  const [requests, setRequests] = useState<VerificationRequest[]>(VERIFICATION_REQUESTS);

  const resolve = (id: string, status: "approved" | "rejected", name?: string) => {
    setRequests((cur) => cur.map((r) => (r.id === id ? { ...r, status } : r)));
    toast.success(
      status === "approved" ? `Đã duyệt xác minh ${name ?? ""}`.trim() : `Đã từ chối đơn ${name ?? ""}`.trim(),
    );
  };

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted-foreground">
          <Inbox className="h-8 w-8 text-muted-foreground" />
          Không có đơn xác minh tài khoản nào chờ xét duyệt.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[220px]">Người gửi đơn</TableHead>
              <TableHead>Loại tài khoản</TableHead>
              <TableHead>Hồ sơ minh chứng</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((r) => {
              const applicant = ACCOUNTS[r.applicantId];
              const pending = r.status === "pending";
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-primary-foreground"
                        style={{ backgroundColor: applicant?.avatarColor ?? "var(--primary)" }}
                      >
                        {applicant?.shortName ?? "?"}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-foreground">
                          {applicant?.name ?? r.applicantId}
                        </div>
                        <div className="text-xs text-muted-foreground">gửi {r.submittedAt}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.accountType}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="text-foreground">{r.materialsCount} học liệu</div>
                    <div>
                      {r.views.toLocaleString("vi-VN")} lượt xem • {r.accountAgeDays} ngày tuổi
                    </div>
                  </TableCell>
                  <TableCell>
                    <VerificationStatusPill status={r.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {pending ? (
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          className="gap-1.5"
                          onClick={() => resolve(r.id, "approved", applicant?.name)}
                        >
                          <Check className="h-4 w-4" /> Duyệt
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-destructive"
                          onClick={() => resolve(r.id, "rejected", applicant?.name)}
                        >
                          <X className="h-4 w-4" /> Từ chối
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
