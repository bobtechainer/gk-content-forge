import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRICULUM, type CurriculumLesson } from "@/lib/curriculum";
import { usePageLoading } from "@/lib/use-page-loading";
import { useContent } from "@/stores/content";
import { AccessBadge } from "@/components/student/access-badge";
import { CurriculumTree } from "../shared/curriculum-tree";
import { PageFrame } from "../shared/page-frame";
import { PageSkeleton } from "../shared/page-skeleton";
import { QualityBadge } from "../shared/quality-badge";
import { RegistryIdChip } from "../shared/registry-id-chip";

/**
 * Ánh xạ Bài trong khung CT sang môn để lọc kho học liệu. Khung CT hiện chỉ seed
 * Lớp 10; nếu một bài không có trong map, ta suy ra môn từ tiền tố mã chuẩn.
 */
const LESSON_SUBJECT: Record<string, string> = {
  "bai-menhde": "Toán",
  "bai-taphop": "Toán",
  "bai-vecto": "Toán",
  "bai-thantho": "Ngữ văn",
};

const GRADES = ["Lớp 10", "Lớp 11", "Lớp 12"];

function subjectOfLesson(lesson: CurriculumLesson): string {
  if (LESSON_SUBJECT[lesson.id]) return LESSON_SUBJECT[lesson.id];
  const code = lesson.outcomes[0]?.code ?? "";
  if (code.startsWith("VAN")) return "Ngữ văn";
  if (code.startsWith("TOAN")) return "Toán";
  return "Toán";
}

export function StudentExplorePage() {
  const loading = usePageLoading();
  const items = useContent((s) => s.items);
  const [grade, setGrade] = useState("Lớp 10");

  // Mặc định chọn Bài đầu tiên của khung CT.
  const firstLesson =
    CURRICULUM[0]?.subjects[0]?.strands[0]?.chapters[0]?.lessons[0] ?? null;
  const [selected, setSelected] = useState<CurriculumLesson | null>(firstLesson);

  const subject = selected ? subjectOfLesson(selected) : null;

  // Học liệu công bố thuộc môn của Bài đang chọn (lọc theo lớp đang xem).
  const materials = useMemo(() => {
    if (!subject) return [];
    return items.filter(
      (i) => i.status === "published" && i.subject === subject && i.grade === grade,
    );
  }, [items, subject, grade]);

  // Nếu lớp đang xem không có học liệu môn đó, vẫn cho xem theo môn (mọi lớp).
  const fallbackMaterials = useMemo(() => {
    if (!subject || materials.length > 0) return [];
    return items.filter((i) => i.status === "published" && i.subject === subject).slice(0, 6);
  }, [items, subject, materials.length]);

  const shown = materials.length > 0 ? materials : fallbackMaterials;

  if (loading) return <PageSkeleton />;

  return (
    <PageFrame
      title="Khám phá học liệu"
      description="Duyệt khung chương trình theo từng bài và mở học liệu phù hợp với bạn."
    >
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        {/* Cột trái — cây chương trình */}
        <Card className="h-fit">
          <CardHeader className="gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Compass className="h-4.5 w-4.5 text-primary" /> Khung chương trình
            </CardTitle>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger aria-label="Chọn lớp">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GRADES.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <CurriculumTree
              onSelectLesson={setSelected}
              selectedLessonId={selected?.id}
            />
          </CardContent>
        </Card>

        {/* Cột phải — học liệu của Bài đang chọn */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {selected ? selected.title : "Chọn một bài để xem học liệu"}
            </h2>
            {selected && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {subject} · {grade} — {shown.length} học liệu phù hợp.
              </p>
            )}
          </div>

          {shown.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                Chưa có học liệu nào gắn với bài này. Hãy thử chọn bài khác.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {shown.map((item) => (
                <Card key={item.id} className="flex flex-col">
                  <CardContent className="flex flex-1 flex-col gap-3 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                        <BookOpen className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-2 font-medium text-foreground">{item.title}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {item.subject} · {item.grade}
                        </div>
                      </div>
                    </div>

                    {item.registryId && <RegistryIdChip id={item.registryId} />}

                    <div className="flex flex-wrap items-center gap-1.5">
                      {item.qualityLabel && <QualityBadge label={item.qualityLabel} />}
                      <AccessBadge tier={item.tier} accessTerms={item.license?.accessTerms} />
                    </div>

                    <Button className="mt-auto w-full" asChild>
                      <Link to="/student/learn/$id" params={{ id: item.id }}>
                        Học ngay
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageFrame>
  );
}
