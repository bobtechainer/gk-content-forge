import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PublishSheet } from "@/components/publish-sheet";
import { toast } from "sonner";
import { useContent } from "@/stores/content";

export const Route = createFileRoute("/creator/builder/book/$id")({
  head: () => ({ meta: [{ title: "Soạn sách — GK Studio" }] }),
  component: ProductBuilder,
});

function ProductBuilder() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const item = useContent((state) => state.items.find((content) => content.id === id));
  const updateItem = useContent((state) => state.updateItem);
  const [title, setTitle] = useState(item?.title ?? "Sách điện tử chưa đặt tên");
  const [publishOpen, setPublishOpen] = useState(false);

  const saveTitle = () => {
    if (item && title.trim() && title !== item.title) updateItem(id, { title: title.trim() });
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-muted/30">
      <div className="sticky top-0 z-20 flex min-h-14 items-center gap-3 border-b border-border bg-card px-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Quay lại dashboard"
          onClick={() => navigate({ to: "/creator/dashboard" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <input
          aria-label="Tiêu đề Sách điện tử"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={saveTitle}
          className="min-w-0 flex-1 rounded-md bg-transparent px-2 py-2 text-base font-semibold text-foreground outline-none hover:bg-muted/50 focus:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.info("Mở trang xem trước trong tab mới (demo)")}
          aria-label="Xem trước Sách điện tử"
        >
          <Eye className="mr-1.5 h-4 w-4" /> Xem trước
        </Button>
        <Button
          size="sm"
          className="bg-primary text-white hover:bg-primary-hover"
          onClick={() => setPublishOpen(true)}
        >
          Xuất bản
        </Button>
      </div>
      <main className="mx-auto grid w-full max-w-5xl gap-4 p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Sách điện tử</CardTitle>
            <CardDescription>
              Builder scaffold cho Content Studio v2. Nội dung chi tiết sẽ được lắp ráp theo
              chương/bài.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {["Thông tin chung", "Cấu trúc nội dung", "Phân phối"].map((section) => (
              <div
                key={section}
                className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground"
              >
                {section}
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
      <PublishSheet
        open={publishOpen}
        onOpenChange={setPublishOpen}
        contentId={id}
        title={title}
        onPublished={() => navigate({ to: "/creator/dashboard" })}
      />
    </div>
  );
}
