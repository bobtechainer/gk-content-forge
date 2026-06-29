import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateContent } from "@/lib/use-create-content";
import { useScopedContent, type StudioScope } from "@/lib/use-scoped-content";
import { usePageLoading } from "@/lib/use-page-loading";
import { ContentGrid } from "./content-card";
import { MaterialTypeGrid } from "./material-type-picker";
import { PageFrame } from "./page-frame";
import { PageSkeleton } from "./page-skeleton";

export function StudioView({ scope }: { scope: StudioScope }) {
  const loading = usePageLoading();
  const { createCategory, createMaterial, createModule } = useCreateContent(scope);
  const items = useScopedContent(scope);
  const drafts = items.filter((i) => i.status === "draft");

  if (loading) return <PageSkeleton />;

  return (
    <PageFrame
      title="Tạo mới"
      description="Chọn loại nội dung để bắt đầu. Builder và form tải lên có giao diện đồng nhất."
    >
      <Card>
        <CardHeader>
          <CardTitle>Chọn loại nội dung</CardTitle>
          <CardDescription>Sản phẩm xuất bản, học liệu tương tác và tệp đính kèm.</CardDescription>
        </CardHeader>
        <CardContent>
          <MaterialTypeGrid onPickCategory={createCategory} onPickMaterial={createMaterial} onPickModule={createModule} />
        </CardContent>
      </Card>

      {drafts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bản nháp đang dựng ({drafts.length})</CardTitle>
            <CardDescription>Tiếp tục hoàn thiện để xuất bản.</CardDescription>
          </CardHeader>
          <CardContent>
            <ContentGrid items={drafts} scope={scope} />
          </CardContent>
        </Card>
      )}
    </PageFrame>
  );
}
