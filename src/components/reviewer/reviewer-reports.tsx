import { useMemo, useState } from "react";
import { AlertTriangle, PauseCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CONTENT_REPORTS } from "@/lib/mock-data";
import type { ContentReport, ReportReason } from "@/lib/types";
import { usePageLoading } from "@/lib/use-page-loading";
import { useContent } from "@/stores/content";
import { PageFrame } from "../shared/page-frame";
import { PageSkeleton } from "../shared/page-skeleton";
import { RegistryIdChip } from "../shared/registry-id-chip";

const REASON_LABELS: Record<ReportReason, string> = {
  copyright: "Tranh chấp bản quyền",
  inappropriate: "Nội dung không phù hợp",
  spam: "Spam",
  inaccurate: "Sai lệch chuyên môn",
  other: "Khác",
};

export function ReviewerReportsPage() {
  const loading = usePageLoading();
  const [reports, setReports] = useState<ContentReport[]>(CONTENT_REPORTS);
  const items = useContent((s) => s.items);

  const registryById = useMemo(() => {
    const map = new Map<string, string | undefined>();
    for (const i of items) map.set(i.id, i.registryId);
    return map;
  }, [items]);

  if (loading) return <PageSkeleton />;

  const copyrightReports = reports.filter((r) => r.reason === "copyright");
  // "Chuyên môn" = báo cáo sai lệch nội dung học liệu.
  const subjectReports = reports.filter((r) => r.reason === "inaccurate");

  const setStatus = (id: string, status: ContentReport["status"]) =>
    setReports((cur) => cur.map((r) => (r.id === id ? { ...r, status } : r)));

  const renderTable = (rows: ContentReport[], emptyText: string) => {
    if (rows.length === 0) {
      return (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            {emptyText}
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
                <TableHead className="min-w-[260px]">Học liệu</TableHead>
                <TableHead>Lý do</TableHead>
                <TableHead>Người báo cáo</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const registryId = registryById.get(r.contentId);
                const resolved = r.status !== "open";
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <span className="font-medium text-foreground">{r.contentTitle}</span>
                        {registryId && <RegistryIdChip id={registryId} />}
                        {r.note && (
                          <span className="text-xs italic text-muted-foreground">“{r.note}”</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                        {REASON_LABELS[r.reason]}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div>{r.reporterName}</div>
                      <div className="text-xs">{r.reportedAt}</div>
                    </TableCell>
                    <TableCell>
                      {resolved ? (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          {r.status === "resolved" ? "Đã xử lý" : "Đã bỏ qua"}
                        </span>
                      ) : (
                        <span className="rounded-full bg-warning-100 px-2.5 py-1 text-xs font-medium text-warning-700">
                          Đang chờ
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {resolved ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            className="gap-1.5 bg-primary text-white hover:bg-primary-hover"
                            onClick={() => {
                              setStatus(r.id, "resolved");
                              toast.success(`Đã xử lý báo cáo: ${r.contentTitle}`);
                            }}
                          >
                            <ShieldCheck className="h-4 w-4" /> Xử lý
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-destructive"
                            onClick={() => {
                              setStatus(r.id, "resolved");
                              toast.success(`Đã tạm dừng khai thác ${r.contentTitle}`);
                            }}
                          >
                            <PauseCircle className="h-4 w-4" /> Tạm dừng khai thác
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setStatus(r.id, "dismissed");
                              toast.success("Đã bỏ qua báo cáo");
                            }}
                          >
                            Bỏ qua
                          </Button>
                        </div>
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
  };

  return (
    <PageFrame
      title="Rà soát & cảnh báo"
      description="Trung tâm xử lý vi phạm toàn nền tảng: bản quyền, nội dung không phù hợp, spam, sai lệch chuyên môn và các báo cáo khác."
    >
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Tất cả ({reports.length})</TabsTrigger>
          <TabsTrigger value="copyright">Bản quyền ({copyrightReports.length})</TabsTrigger>
          <TabsTrigger value="subject">Chuyên môn ({subjectReports.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          {renderTable(reports, "Chưa có báo cáo vi phạm nào.")}
        </TabsContent>
        <TabsContent value="copyright" className="mt-4">
          {renderTable(copyrightReports, "Không có tranh chấp bản quyền.")}
        </TabsContent>
        <TabsContent value="subject" className="mt-4">
          {renderTable(subjectReports, "Không có báo cáo sai lệch nội dung.")}
        </TabsContent>
      </Tabs>
    </PageFrame>
  );
}
