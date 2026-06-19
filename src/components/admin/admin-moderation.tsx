import { useState } from "react";
import { AlertTriangle, Check, ChevronDown, FileText, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ACCOUNTS, CONTENT_REPORTS, VERIFICATION_REQUESTS } from "@/lib/mock-data";
import type { ContentReport, VerificationRequest } from "@/lib/types";
import { usePageLoading } from "@/lib/use-page-loading";
import { cn } from "@/lib/utils";
import { useContent } from "@/stores/content";
import { PageFrame } from "../shared/page-frame";
import { PageSkeleton } from "../shared/page-skeleton";

export function AdminContentReviewPage() {
  const loading = usePageLoading();
  const items = useContent((s) => s.items.filter((i) => i.status === "pending"));
  const setStatus = useContent((s) => s.setStatus);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  if (loading) return <PageSkeleton />;

  return (
    <PageFrame title="Duyệt nội dung" description="Hàng đợi nội dung chờ phê duyệt.">
      {items.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Không có nội dung chờ duyệt.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const open = openId === item.id;
            return (
              <Card key={item.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 p-4 text-left"
                  onClick={() => {
                    setOpenId(open ? null : item.id);
                    setReason("");
                  }}
                >
                  <FileText className="h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-foreground">{item.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.ownerName ?? item.ownerId} • {item.subject} • {item.createdAt}
                    </div>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
                </button>
                {open && (
                  <div className="border-t border-border p-4">
                    <p className="text-sm text-muted-foreground">
                      {item.description || "Không có mô tả."}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.tags.map((t) => (
                        <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                          {t}
                        </span>
                      ))}
                    </div>
                    <Textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Lý do từ chối (nếu có)…"
                      rows={2}
                      className="mt-3"
                    />
                    <div className="mt-3 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        className="text-destructive"
                        onClick={() => {
                          setStatus(item.id, "rejected");
                          toast.success("Đã từ chối nội dung");
                          setOpenId(null);
                        }}
                      >
                        <X className="mr-1.5 h-4 w-4" /> Từ chối
                      </Button>
                      <Button
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => {
                          setStatus(item.id, "published");
                          toast.success("Đã phê duyệt & xuất bản");
                          setOpenId(null);
                        }}
                      >
                        <Check className="mr-1.5 h-4 w-4" /> Phê duyệt
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </PageFrame>
  );
}

export function AdminVerificationRequestsPage() {
  const loading = usePageLoading();
  const [requests, setRequests] = useState<VerificationRequest[]>(VERIFICATION_REQUESTS);
  const [openId, setOpenId] = useState<string | null>(null);

  if (loading) return <PageSkeleton />;

  const resolve = (id: string, status: "approved" | "rejected") => {
    setRequests((cur) => cur.map((r) => (r.id === id ? { ...r, status } : r)));
    toast.success(status === "approved" ? "Đã phê duyệt xác minh" : "Đã từ chối đơn");
    setOpenId(null);
  };

  return (
    <PageFrame title="Duyệt xác minh" description="Đơn xin tích xanh từ cá nhân và tổ chức.">
      <div className="space-y-3">
        {requests.map((r) => {
          const applicant = ACCOUNTS[r.applicantId];
          const open = openId === r.id;
          return (
            <Card key={r.id}>
              <button
                type="button"
                className="flex w-full items-center gap-3 p-4 text-left"
                onClick={() => setOpenId(open ? null : r.id)}
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: applicant?.avatarColor ?? "var(--primary)" }}
                >
                  {applicant?.shortName ?? "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-foreground">{applicant?.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.accountType} • gửi {r.submittedAt}
                  </div>
                </div>
                <StatusPill status={r.status} />
                <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
              </button>
              {open && (
                <div className="space-y-3 border-t border-border p-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Stat label="Học liệu" value={r.materialsCount.toString()} />
                    <Stat label="Lượt xem" value={r.views.toLocaleString()} />
                    <Stat label="Tuổi tài khoản" value={`${r.accountAgeDays} ngày`} />
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-medium text-muted-foreground">
                      Giấy tờ đã tải
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {r.documents.map((doc) => (
                        <span
                          key={doc}
                          className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs"
                        >
                          <FileText className="h-3.5 w-3.5" /> {doc}
                        </span>
                      ))}
                    </div>
                  </div>
                  {r.status === "pending" && (
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        className="text-destructive"
                        onClick={() => resolve(r.id, "rejected")}
                      >
                        Từ chối
                      </Button>
                      <Button
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => resolve(r.id, "approved")}
                      >
                        Phê duyệt
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </PageFrame>
  );
}

const REASON_LABELS: Record<ContentReport["reason"], string> = {
  copyright: "Vi phạm bản quyền",
  inappropriate: "Nội dung không phù hợp",
  spam: "Spam",
  inaccurate: "Thông tin sai lệch",
  other: "Khác",
};

export function AdminReportsPage() {
  const loading = usePageLoading();
  const [reports, setReports] = useState<ContentReport[]>(CONTENT_REPORTS);
  const deleteItem = useContent((s) => s.deleteItem);

  if (loading) return <PageSkeleton />;

  const setStatus = (id: string, status: ContentReport["status"]) =>
    setReports((cur) => cur.map((r) => (r.id === id ? { ...r, status } : r)));

  return (
    <PageFrame
      title="Báo cáo vi phạm"
      description="Xử lý nội dung bị báo cáo trên toàn nền tảng."
    >
      <div className="space-y-3">
        {reports.map((r) => (
          <Card key={r.id}>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-foreground">{r.contentTitle}</div>
                <div className="text-xs text-muted-foreground">
                  {REASON_LABELS[r.reason]} • bởi {r.reporterName} • {r.reportedAt}
                </div>
                {r.note && <div className="mt-1 text-xs text-muted-foreground">“{r.note}”</div>}
              </div>
              {r.status !== "open" ? (
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {r.status === "resolved" ? "Đã xử lý" : "Đã bỏ qua"}
                </span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      toast.success("Đã gửi cảnh báo tới tác giả");
                    }}
                  >
                    Cảnh báo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStatus(r.id, "dismissed");
                      toast.success("Đã bỏ qua báo cáo");
                    }}
                  >
                    Bỏ qua
                  </Button>
                  <Button
                    size="sm"
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => {
                      deleteItem(r.contentId);
                      setStatus(r.id, "resolved");
                      toast.success("Đã gỡ nội dung vi phạm");
                    }}
                  >
                    Gỡ nội dung
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </PageFrame>
  );
}

const SUBJECTS_SEED = [
  "Toán",
  "Vật lý",
  "Hóa học",
  "Sinh học",
  "Ngữ văn",
  "Tiếng Anh",
  "Lịch sử",
  "Địa lý",
];

export function AdminSettingsPage() {
  const loading = usePageLoading();
  const [thresholds, setThresholds] = useState({
    personalMaterials: 5,
    personalViews: 500,
    orgMaterials: 10,
    orgViews: 2000,
  });
  const [subjects, setSubjects] = useState<string[]>(SUBJECTS_SEED);
  const [newSubject, setNewSubject] = useState("");
  const [banned, setBanned] = useState<string[]>(["từ khóa cấm 1", "từ khóa cấm 2"]);
  const [newBanned, setNewBanned] = useState("");

  if (loading) return <PageSkeleton />;

  return (
    <PageFrame
      title="Cấu hình hệ thống"
      description="Ngưỡng xác minh, danh mục môn học và quy tắc kiểm duyệt."
      actions={
        <Button
          className="bg-primary text-white hover:bg-primary-hover"
          onClick={() => toast.success("Đã lưu cấu hình")}
        >
          Lưu cấu hình
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ngưỡng xác minh</CardTitle>
            <CardDescription>Điều kiện đạt tích xanh</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <NumberField
              label="Cá nhân — học liệu"
              value={thresholds.personalMaterials}
              onChange={(v) => setThresholds((t) => ({ ...t, personalMaterials: v }))}
            />
            <NumberField
              label="Cá nhân — lượt xem"
              value={thresholds.personalViews}
              onChange={(v) => setThresholds((t) => ({ ...t, personalViews: v }))}
            />
            <NumberField
              label="Doanh nghiệp — học liệu"
              value={thresholds.orgMaterials}
              onChange={(v) => setThresholds((t) => ({ ...t, orgMaterials: v }))}
            />
            <NumberField
              label="Doanh nghiệp — lượt xem"
              value={thresholds.orgViews}
              onChange={(v) => setThresholds((t) => ({ ...t, orgViews: v }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Danh mục môn học</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newSubject.trim()) {
                    setSubjects((s) => [...s, newSubject.trim()]);
                    setNewSubject("");
                  }
                }}
                placeholder="Thêm môn học…"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (newSubject.trim()) {
                    setSubjects((s) => [...s, newSubject.trim()]);
                    setNewSubject("");
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {subjects.map((s) => (
                <span
                  key={s}
                  className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs"
                >
                  {s}
                  <button
                    type="button"
                    aria-label={`Xóa ${s}`}
                    onClick={() => setSubjects((cur) => cur.filter((x) => x !== s))}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Từ khóa bị cấm (AI filter)</CardTitle>
            <CardDescription>Nội dung chứa các từ này sẽ bị chặn tự động.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newBanned}
                onChange={(e) => setNewBanned(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newBanned.trim()) {
                    setBanned((b) => [...b, newBanned.trim()]);
                    setNewBanned("");
                  }
                }}
                placeholder="Thêm từ khóa…"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (newBanned.trim()) {
                    setBanned((b) => [...b, newBanned.trim()]);
                    setNewBanned("");
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {banned.map((b) => (
                <span
                  key={b}
                  className="flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs text-destructive"
                >
                  {b}
                  <button
                    type="button"
                    aria-label={`Xóa ${b}`}
                    onClick={() => setBanned((cur) => cur.filter((x) => x !== b))}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageFrame>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs">{label}</Label>
      <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-lg font-bold text-foreground">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: VerificationRequest["status"] }) {
  const map = {
    pending: { label: "Chờ duyệt", cls: "bg-amber-500/10 text-amber-600" },
    approved: { label: "Đã duyệt", cls: "bg-emerald-500/10 text-emerald-600" },
    rejected: { label: "Từ chối", cls: "bg-destructive/10 text-destructive" },
  }[status];
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${map.cls}`}>{map.label}</span>
  );
}
