import { useEffect, useMemo, useState } from "react";
import {
  LayoutList, X, Search, ChevronRight, GraduationCap, ListChecks, Plus, ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PreviewConfirmDialog } from "./preview-confirm-dialog";
import { useInsertStoryboard } from "@/stores/insert-storyboard";
import { useStoryboardLibrary, allStoryboardItems, type StoryboardLibraryItem } from "@/stores/storyboard-library";
import { useCourse } from "@/stores/course";
import { useContent } from "@/stores/content";
import { useModuleStart } from "@/stores/module-start";
import { aiClient } from "@/lib/ai";
import { sceneSrc } from "@/lib/storyboard/scene-art";
import {
  applyStoryboardAsCourseOutline, applyStoryboardAsLessonOutline, storyboardStats,
  type ApplyMode, type LessonScope,
} from "@/lib/storyboard/apply-storyboard";
import { type BuilderScope } from "@/lib/builder-url";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface InsertStoryboardPanelProps {
  courseId: string;
  scope: BuilderScope;
}

/**
 * Panel "Chèn storyboard" — dock độc lập bên phải builder (kiểu chèn bảng có sẵn
 * của Google Sheets). Danh sách LẤY ĐÚNG kho module Storyboard (`allStoryboardItems`
 * — preset hệ thống trước, của người dùng sau) → xem trước → chọn cách áp:
 *  - Mục lục khoá học (dựng cây Chương/Bài).
 *  - Dàn ý bài học (áp vào bài đang mở, hoặc toàn khoá).
 */
export function InsertStoryboardPanel({ courseId, scope }: InsertStoryboardPanelProps) {
  const open = useInsertStoryboard((s) => s.open);
  const closePanel = useInsertStoryboard((s) => s.closePanel);

  const userItems = useStoryboardLibrary((s) => s.items);
  // Cùng nguồn & cùng thứ tự với module Storyboard (ModuleGallery).
  const items = useMemo(() => allStoryboardItems(userItems), [userItems]);

  const activeLessonId = useCourse((s) => s.activeLessonId);
  const contentItem = useContent((s) => s.items.find((x) => x.id === courseId));

  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<StoryboardLibraryItem | null>(null);
  const [mode, setMode] = useState<ApplyMode>("lesson-outline");
  const [lessonScope, setLessonScope] = useState<LessonScope>("lesson");

  // Esc để đóng panel (khi chưa mở lớp xem trước).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !selected) closePanel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, selected, closePanel]);

  if (!open) return null;

  const match = (s: string) => !q.trim() || s.toLowerCase().includes(q.trim().toLowerCase());
  const filtered = items.filter((it) => match(it.name) || match(it.description ?? ""));

  const openPreview = (item: StoryboardLibraryItem) => {
    setSelected(item);
    // Mặc định theo ngữ cảnh: đang mở một bài → áp dàn ý bài này; chưa có bài → mục lục khoá.
    setMode(activeLessonId ? "lesson-outline" : "course-outline");
    setLessonScope(activeLessonId ? "lesson" : "course");
  };

  const closeAll = () => { setSelected(null); closePanel(); };

  const confirmLabel =
    mode === "course-outline" ? "Dựng mục lục khoá"
      : lessonScope === "course" ? "Áp cho toàn khoá" : "Áp vào bài";

  const doApply = async () => {
    const item = selected;
    if (!item) return;
    const cs = useCourse.getState();

    if (mode === "course-outline") {
      const res = applyStoryboardAsCourseOutline(item.storyboard, {
        addChapter: (title) => cs.addChapterUnder(courseId, null, title),
        addLesson: (chapterId, title) => cs.addLessonUnder(courseId, { id: chapterId, type: "chapter" }, title),
      });
      toast.success(`Đã dựng ${res.chapters} chương, ${res.lessons} bài vào mục lục khoá.`);
      closeAll();
      return;
    }

    // Dàn ý bài học
    const data = cs.courseData[courseId];
    const lessonIds =
      lessonScope === "course"
        ? (data?.lessons ?? []).map((l) => l.id)
        : activeLessonId ? [activeLessonId] : [];
    if (lessonIds.length === 0) {
      toast.error(lessonScope === "course" ? "Khoá chưa có bài nào để áp." : "Hãy mở một bài trước khi áp.");
      return;
    }
    closeAll();
    const tid = toast.loading("Đang áp dàn ý vào bài…");
    try {
      const subject = contentItem?.subject ?? "";
      const grade = contentItem?.grade ?? "";
      const topic = contentItem?.title || subject || "bài học";
      const res = await applyStoryboardAsLessonOutline(item.storyboard, lessonIds, {
        addBlock: (lessonId, type) => cs.addBlock(courseId, lessonId, type),
        updateBlock: (lessonId, blockId, patch) => cs.updateBlock(courseId, lessonId, blockId, patch),
        fillBlock: (it) => aiClient.fillBlock({ item: it, subject, grade, topic }),
      });
      toast.success(`Đã áp dàn ý: ${res.blocks} khối vào ${res.lessons > 1 ? `${res.lessons} bài` : "bài"}.`, { id: tid });
    } catch {
      toast.error("Có lỗi khi áp dàn ý. Bạn thử lại nhé.", { id: tid });
    }
  };

  const openCreate = () => {
    useModuleStart.getState().request({ module: "storyboard", scope, newTab: true });
  };

  return (
    <div className="flex h-full w-full flex-col bg-card" role="dialog" aria-label="Chèn storyboard">
        {/* Header */}
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-primary"><LayoutList className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Chèn storyboard</p>
            <p className="truncate text-[11px] text-muted-foreground">Chọn dàn ý có sẵn, xem trước rồi áp vào khoá hoặc bài</p>
          </div>
          <button type="button" onClick={closePanel} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="Đóng">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm dàn ý theo tên…" className="h-9 pl-8 text-sm" />
          </div>
        </div>

        {/* Danh sách — cùng thứ tự với module Storyboard */}
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {filtered.length === 0 ? (
            <p className="px-2 py-12 text-center text-xs text-muted-foreground">Không tìm thấy dàn ý phù hợp.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((it) => (
                <StoryboardCard key={it.id} item={it} onPick={openPreview} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 border-t border-border px-4 py-3">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" /> Tạo storyboard mới <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </div>

      {/* Lớp xem trước + chọn cách áp (Dialog tự portal, nổi trên cùng) */}
      {selected && (
        <PreviewConfirmDialog
          open
          onOpenChange={(o) => { if (!o) setSelected(null); }}
          title={`Xem trước: ${selected.name}`}
          confirmLabel={confirmLabel}
          onConfirm={() => { void doApply(); }}
        >
          <StoryboardPreview
            item={selected}
            mode={mode}
            onModeChange={setMode}
            lessonScope={lessonScope}
            onLessonScopeChange={setLessonScope}
            hasActiveLesson={!!activeLessonId}
          />
        </PreviewConfirmDialog>
      )}
    </div>
  );
}

/* ─── Thẻ dàn ý (giống card trong module Storyboard) ─────────────── */

function StoryboardCard({
  item, onPick,
}: {
  item: StoryboardLibraryItem;
  onPick: (item: StoryboardLibraryItem) => void;
}) {
  const frames = item.storyboard.sections.flatMap((s) => s.items);
  return (
    <button
      type="button"
      onClick={() => onPick(item)}
      className="group w-full overflow-hidden rounded-xl border border-border bg-card text-left transition hover:border-primary hover:shadow-md"
    >
      {/* Thumbnail ảnh cảnh — 3 khung đầu (giống ModuleGallery) */}
      <div className="flex gap-1 border-b border-border bg-muted/30 p-2">
        {frames.slice(0, 3).map((f, i) => (
          <div key={i} className="relative h-14 flex-1 overflow-hidden rounded-md bg-cover bg-center" style={{ backgroundImage: `url("${sceneSrc(f.image)}")` }}>
            <span className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">{i + 1}</span>
          </div>
        ))}
        {frames.length === 0 && <div className="h-14 flex-1 rounded-md bg-muted" />}
      </div>
      <div className="flex items-center gap-2 p-2.5">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">{item.name}</span>
          <span className="block truncate text-[11px] text-muted-foreground">
            {item.source === "system" ? "Hệ thống" : "Của tôi"} · {frames.length} khung
          </span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
      </div>
    </button>
  );
}

/* ─── Nội dung xem trước + chọn cách áp ──────────────────────────── */

function StoryboardPreview({
  item, mode, onModeChange, lessonScope, onLessonScopeChange, hasActiveLesson,
}: {
  item: StoryboardLibraryItem;
  mode: ApplyMode;
  onModeChange: (m: ApplyMode) => void;
  lessonScope: LessonScope;
  onLessonScopeChange: (s: LessonScope) => void;
  hasActiveLesson: boolean;
}) {
  const { sections, items } = storyboardStats(item.storyboard);
  return (
    <div className="space-y-4">
      {/* Xem trước cấu trúc — đúng thứ tự section/khung trong storyboard */}
      <div className="space-y-2.5">
        <p className="text-[11px] text-muted-foreground">{sections} mục · {items} khung</p>
        {item.storyboard.sections.map((sec) => (
          <div key={sec.id}>
            <p className="text-xs font-semibold text-foreground">{sec.title}</p>
            <div className="mt-1 grid grid-cols-2 gap-1.5">
              {sec.items.map((f) => (
                <div key={f.id} className="overflow-hidden rounded-md border border-border bg-card">
                  <div className="h-14 bg-cover bg-center" style={{ backgroundImage: `url("${sceneSrc(f.image)}")` }} />
                  <p className="truncate px-1.5 py-1 text-[11px] font-medium text-foreground">{f.title || f.intent}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Chọn cách áp */}
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="mb-2 text-xs font-semibold text-foreground">Áp dụng như</p>
        <RadioGroup value={mode} onValueChange={(v) => onModeChange(v as ApplyMode)} className="gap-2.5">
          <label htmlFor="apply-course" className="flex cursor-pointer items-start gap-2.5">
            <RadioGroupItem value="course-outline" id="apply-course" className="mt-0.5" />
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-xs font-medium text-foreground"><GraduationCap className="h-3.5 w-3.5 text-primary" /> Mục lục khoá học</span>
              <span className="block text-[11px] text-muted-foreground">Mỗi mục thành một chương, mỗi khung thành một bài trong cây nội dung.</span>
            </span>
          </label>
          <label htmlFor="apply-lesson" className="flex cursor-pointer items-start gap-2.5">
            <RadioGroupItem value="lesson-outline" id="apply-lesson" className="mt-0.5" />
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-xs font-medium text-foreground"><ListChecks className="h-3.5 w-3.5 text-primary" /> Dàn ý bài học</span>
              <span className="block text-[11px] text-muted-foreground">Tạo khối mục và khối nội dung mẫu ngay trong bài.</span>
            </span>
          </label>
        </RadioGroup>

        {/* Phạm vi áp khi là dàn ý bài học */}
        {mode === "lesson-outline" && (
          <div className="mt-3 border-t border-border pt-3">
            <p className="mb-2 text-xs font-semibold text-foreground">Phạm vi</p>
            <RadioGroup value={lessonScope} onValueChange={(v) => onLessonScopeChange(v as LessonScope)} className="gap-2.5">
              <label htmlFor="scope-lesson" className={cn("flex items-center gap-2.5", hasActiveLesson ? "cursor-pointer" : "cursor-not-allowed opacity-60")}>
                <RadioGroupItem value="lesson" id="scope-lesson" disabled={!hasActiveLesson} />
                <span className="text-xs text-foreground">
                  Áp cho bài này
                  {!hasActiveLesson && <span className="ml-1 text-[11px] text-muted-foreground">— hãy mở một bài trước</span>}
                </span>
              </label>
              <label htmlFor="scope-course" className="flex cursor-pointer items-center gap-2.5">
                <RadioGroupItem value="course" id="scope-course" />
                <span className="text-xs text-foreground">Áp cho toàn khoá <span className="text-[11px] text-muted-foreground">— mọi bài trong khoá</span></span>
              </label>
            </RadioGroup>
          </div>
        )}
      </div>
    </div>
  );
}
