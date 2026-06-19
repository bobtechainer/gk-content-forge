import { useMemo, useState } from "react";
import { ArrowUpRight, CheckCircle2, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { resolveDemoAccount } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { usePageLoading } from "@/lib/use-page-loading";
import { useSession } from "@/stores/session";
import { PageFrame } from "../shared/page-frame";
import { PageSkeleton } from "../shared/page-skeleton";

/**
 * Duyệt cấp tổ (tổ trưởng bộ môn):
 *   cho_to_truong   → (tổ trưởng duyệt cấp tổ) → cho_truong_chot (chuyển nhà trường)
 */
type DeptReviewState = "cho_to_truong" | "cho_truong_chot";

interface DeptReviewItem {
  id: string;
  title: string;
  teacherName: string;
  subject: string;
  submittedAt: string;
  state: DeptReviewState;
}

const DEPT_REVIEW_ITEMS: DeptReviewItem[] = [
  {
    id: "dr-1",
    title: "Bộ đề ôn tập Mệnh đề – Tập hợp (Lớp 10)",
    teacherName: "Hoàng Xuân Nhi",
    subject: "Toán",
    submittedAt: "2026-06-15",
    state: "cho_to_truong",
  },
  {
    id: "dr-2",
    title: "Bài giảng tương tác: Hàm số bậc hai",
    teacherName: "Đỗ Thanh Tùng",
    subject: "Toán",
    submittedAt: "2026-06-16",
    state: "cho_to_truong",
  },
  {
    id: "dr-3",
    title: "Chuyên đề Vectơ trong mặt phẳng",
    teacherName: "Nguyễn Hải Yến",
    subject: "Toán",
    submittedAt: "2026-06-12",
    state: "cho_to_truong",
  },
  {
    id: "dr-4",
    title: "Phiếu thực hành Dao động điều hòa",
    teacherName: "Trần Minh Đức",
    subject: "Vật lý",
    submittedAt: "2026-06-14",
    state: "cho_to_truong",
  },
];

const STATE_META: Record<DeptReviewState, { label: string; cls: string }> = {
  cho_to_truong: { label: "Chờ tổ trưởng duyệt", cls: "bg-warning-100 text-warning-700" },
  cho_truong_chot: { label: "Đã chuyển nhà trường", cls: "bg-success/10 text-success" },
};

function StateBadge({ state }: { state: DeptReviewState }) {
  const m = STATE_META[state];
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", m.cls)}
    >
      {m.label}
    </span>
  );
}

export function TeacherDeptReviewPage() {
  const loading = usePageLoading();
  const schoolRole = useSession((s) => s.schoolRole);
  // Tổ trưởng là tài khoản giáo viên (schoolRole "dept_head"); phụ trách 1 môn.
  const subjectScope = resolveDemoAccount("teacher", schoolRole).subjectScope ?? "Toán";
  const [items, setItems] = useState<DeptReviewItem[]>(DEPT_REVIEW_ITEMS);

  // Tổ trưởng chỉ thấy học liệu thuộc tổ bộ môn của mình.
  const visibleItems = useMemo(
    () => items.filter((i) => i.subject === subjectScope),
    [items, subjectScope],
  );

  if (loading) return <PageSkeleton />;

  const approveDept = (item: DeptReviewItem) => {
    setItems((cur) =>
      cur.map((i) => (i.id === item.id ? { ...i, state: "cho_truong_chot" } : i)),
    );
    toast.success(`Đã duyệt cấp tổ, chuyển nhà trường: ${item.title}`);
  };

  return (
    <PageFrame
      title="Duyệt cấp tổ"
      description={`Học liệu tổ ${subjectScope} đang chờ tổ trưởng duyệt trước khi trình nhà trường.`}
    >
      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span>
          Bạn chỉ thấy học liệu thuộc tổ bộ môn {subjectScope}. Sau khi bạn duyệt cấp tổ, học liệu
          sẽ được chuyển sang để nhà trường chốt và trình lên Hội đồng thẩm định.
        </span>
      </div>

      {visibleItems.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Không có học liệu nào thuộc tổ {subjectScope} chờ bạn duyệt.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Học liệu</th>
                    <th className="px-4 py-3 font-medium">Giáo viên</th>
                    <th className="px-4 py-3 font-medium">Môn</th>
                    <th className="px-4 py-3 font-medium">Trạng thái</th>
                    <th className="px-4 py-3 text-right font-medium">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((item) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{item.title}</div>
                        <div className="text-xs text-muted-foreground">Gửi {item.submittedAt}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{item.teacherName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.subject}</td>
                      <td className="px-4 py-3">
                        <StateBadge state={item.state} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          {item.state === "cho_to_truong" ? (
                            <Button size="sm" onClick={() => approveDept(item)}>
                              <CheckCircle2 className="mr-1.5 h-4 w-4" /> Duyệt cấp tổ
                            </Button>
                          ) : (
                            <span className="inline-flex items-center text-xs text-muted-foreground">
                              <ArrowUpRight className="mr-1 h-3.5 w-3.5" /> Đã chuyển nhà trường
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </PageFrame>
  );
}
