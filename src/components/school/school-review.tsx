import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { usePageLoading } from "@/lib/use-page-loading";
import { PageFrame } from "../shared/page-frame";
import { PageSkeleton } from "../shared/page-skeleton";

/**
 * Luồng duyệt nội bộ 2 cấp:
 *   cho_to_truong  → (tổ trưởng duyệt cấp tổ)        → cho_truong_chot
 *   cho_truong_chot → (nhà trường chốt & chuyển)     → da_chuyen_hoi_dong
 */
type ReviewState = "cho_to_truong" | "cho_truong_chot" | "da_chuyen_hoi_dong";

interface SchoolReviewItem {
  id: string;
  title: string;
  teacherName: string;
  subject: string;
  submittedAt: string;
  state: ReviewState;
}

const SCHOOL_REVIEW_ITEMS: SchoolReviewItem[] = [
  {
    id: "sr-1",
    title: "Bộ đề ôn tập Mệnh đề – Tập hợp (Lớp 10)",
    teacherName: "Hoàng Xuân Nhi",
    subject: "Toán",
    submittedAt: "2026-06-15",
    state: "cho_to_truong",
  },
  {
    id: "sr-2",
    title: "Bài giảng tương tác: Hàm số bậc hai",
    teacherName: "Đỗ Thanh Tùng",
    subject: "Toán",
    submittedAt: "2026-06-16",
    state: "cho_to_truong",
  },
  {
    id: "sr-3",
    title: "Phiếu thực hành Dao động điều hòa",
    teacherName: "Trần Minh Đức",
    subject: "Vật lý",
    submittedAt: "2026-06-14",
    state: "cho_to_truong",
  },
  {
    id: "sr-4",
    title: "Chuyên đề Vectơ trong mặt phẳng",
    teacherName: "Hoàng Xuân Nhi",
    subject: "Toán",
    submittedAt: "2026-06-10",
    state: "cho_truong_chot",
  },
  {
    id: "sr-5",
    title: "Đọc hiểu thần thoại và sử thi",
    teacherName: "Lê Thu Hằng",
    subject: "Ngữ văn",
    submittedAt: "2026-06-09",
    state: "cho_truong_chot",
  },
  {
    id: "sr-6",
    title: "Đề kiểm tra giữa kỳ Hóa học 10",
    teacherName: "Phạm Quốc Bảo",
    subject: "Hóa học",
    submittedAt: "2026-06-02",
    state: "da_chuyen_hoi_dong",
  },
];

const STATE_META: Record<ReviewState, { label: string; cls: string }> = {
  cho_to_truong: { label: "Chờ tổ trưởng duyệt", cls: "bg-warning-100 text-warning-700" },
  cho_truong_chot: { label: "Chờ trường chốt", cls: "bg-accent text-accent-foreground" },
  da_chuyen_hoi_dong: { label: "Đã chuyển Hội đồng", cls: "bg-success/10 text-success" },
};

function StateBadge({ state }: { state: ReviewState }) {
  const m = STATE_META[state];
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", m.cls)}
    >
      {m.label}
    </span>
  );
}

export function SchoolReviewPage() {
  const loading = usePageLoading();
  const [items, setItems] = useState<SchoolReviewItem[]>(SCHOOL_REVIEW_ITEMS);

  if (loading) return <PageSkeleton />;

  const advance = (id: string, to: ReviewState, message: string) => {
    setItems((cur) => cur.map((i) => (i.id === id ? { ...i, state: to } : i)));
    toast.success(message);
  };

  const finalizeSchool = (item: SchoolReviewItem) =>
    advance(item.id, "da_chuyen_hoi_dong", `Đã chốt và chuyển Hội đồng: ${item.title}`);

  const renderActions = (item: SchoolReviewItem) => {
    if (item.state === "cho_truong_chot") {
      return (
        <Button size="sm" onClick={() => finalizeSchool(item)}>
          <ArrowUpRight className="mr-1.5 h-4 w-4" /> Chốt & chuyển Hội đồng
        </Button>
      );
    }
    if (item.state === "cho_to_truong") {
      return <span className="text-xs text-muted-foreground">Đang chờ tổ trưởng</span>;
    }
    return <span className="text-xs text-muted-foreground">Đã hoàn tất</span>;
  };

  // ---- Màn quản lý/hiệu trưởng: Tabs theo trạng thái ----
  const byState = (state: ReviewState) => items.filter((i) => i.state === state);

  return (
    <PageFrame
      title="Duyệt nội bộ"
      description="Theo dõi học liệu của giáo viên qua hai cấp: tổ bộ môn duyệt trước, nhà trường chốt và chuyển Hội đồng."
    >
      <Tabs defaultValue="cho_truong_chot">
        <TabsList>
          <TabsTrigger value="cho_to_truong">
            Chờ tổ trưởng ({byState("cho_to_truong").length})
          </TabsTrigger>
          <TabsTrigger value="cho_truong_chot">
            Chờ trường chốt ({byState("cho_truong_chot").length})
          </TabsTrigger>
          <TabsTrigger value="da_chuyen_hoi_dong">
            Đã chuyển Hội đồng ({byState("da_chuyen_hoi_dong").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cho_to_truong">
          <ReviewTable
            items={byState("cho_to_truong")}
            renderActions={renderActions}
            emptyText="Không có học liệu nào đang chờ tổ trưởng."
          />
        </TabsContent>
        <TabsContent value="cho_truong_chot">
          <ReviewTable
            items={byState("cho_truong_chot")}
            renderActions={renderActions}
            emptyText="Không có học liệu nào chờ nhà trường chốt."
          />
        </TabsContent>
        <TabsContent value="da_chuyen_hoi_dong">
          <ReviewTable
            items={byState("da_chuyen_hoi_dong")}
            renderActions={renderActions}
            emptyText="Chưa có học liệu nào được chuyển lên Hội đồng."
          />
        </TabsContent>
      </Tabs>
    </PageFrame>
  );
}

function ReviewTable({
  items,
  renderActions,
  emptyText,
}: {
  items: SchoolReviewItem[];
  renderActions: (item: SchoolReviewItem) => React.ReactNode;
  emptyText: string;
}) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-muted-foreground">{emptyText}</CardContent>
      </Card>
    );
  }
  return (
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
              {items.map((item) => (
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
                    <div className="flex justify-end">{renderActions(item)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
