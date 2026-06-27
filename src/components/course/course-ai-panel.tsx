import { useState } from "react";
import {
  Sparkles,
  Wand2,
  ChevronUp,
  ChevronDown,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { aiClient } from "@/lib/ai";
import { useStoryboard } from "@/stores/storyboard";
import { useContent } from "@/stores/content";
import { useCourse } from "@/stores/course";
import { fillStoryboard } from "@/lib/ai/fill-orchestrator";

/* ─── Props ─────────────────────────────────────────────────────── */

interface CourseAiPanelProps {
  courseId?: string;
  lessonId?: string;
}

/* ─── Block type label map ──────────────────────────────────────── */

const BLOCK_TYPE_LABELS: Record<string, string> = {
  text: "Văn bản",
  image: "Hình ảnh",
  video: "Video",
  callout: "Callout",
  divider: "Ngăn cách",
  embed: "Nhúng",
  code: "Code",
  math: "Toán",
  columns: "Cột",
  quiz: "Câu hỏi",
  html: "HTML",
  section: "Phần",
  accordion: "Accordion",
  process: "Quy trình",
  flashcards: "Thẻ nhớ",
};

/* ─── Component ─────────────────────────────────────────────────── */

export function CourseAiPanel({ courseId, lessonId }: CourseAiPanelProps) {
  const [topic, setTopic] = useState("");
  const [objectives, setObjectives] = useState("");
  const [progress, setProgress] = useState("");

  const setStoryboard = useStoryboard((s) => s.setStoryboard);
  const updateItem = useStoryboard((s) => s.updateItem);
  const removeItem = useStoryboard((s) => s.removeItem);
  const moveItem = useStoryboard((s) => s.moveItem);
  const setStatus = useStoryboard((s) => s.setStatus);
  const storyboard = useStoryboard((s) => (lessonId ? s.byLesson[lessonId] : undefined));
  const status = useStoryboard((s) => (lessonId ? (s.status[lessonId] ?? "idle") : "idle"));

  const contentItem = useContent((s) => s.items.find((x) => x.id === courseId));
  const subject = contentItem?.subject ?? "";
  const grade = contentItem?.grade ?? "";

  const isPlanning = status === "planning";
  const isReady = status === "ready" || status === "done";
  const isFilling = status === "filling";

  /* ─── Tạo dàn ý ─────────────────────────────────────────────── */

  async function handleGenerateStoryboard() {
    if (!lessonId || !topic.trim()) return;
    setStatus(lessonId, "planning");
    try {
      const sb = await aiClient.generateStoryboard({
        subject,
        grade,
        topic: topic.trim(),
        objectives: objectives.trim() || undefined,
      });
      setStoryboard(lessonId, sb);
      setStatus(lessonId, "ready");
    } catch {
      setStatus(lessonId, "idle");
    }
  }

  /* ─── Tạo nội dung từ dàn ý ─────────────────────────────────── */

  async function handleFill() {
    if (!courseId || !lessonId || !storyboard || status === "filling" || status === "done") return;
    setStatus(lessonId, "filling");
    setProgress("");
    try {
      await fillStoryboard({
        storyboard,
        meta: { subject, grade, topic },
        addBlock: (type) => useCourse.getState().addBlock(courseId!, lessonId!, type),
        updateBlock: (id, patch) => useCourse.getState().updateBlock(courseId!, lessonId!, id, patch),
        onProgress: (done, total) => {
          setProgress(`${done}/${total}`);
        },
      });
      setStatus(lessonId, "done");
    } catch {
      setStatus(lessonId, "ready");
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* ─── Header ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b px-3 py-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">AI Soạn bài</h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ─── Intake form ─────────────────────────────────── */}
        <div className="space-y-3 border-b p-3">
          {/* Subject / Grade — read-only prefill */}
          {(subject || grade) && (
            <div className="flex gap-1.5">
              {subject && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {subject}
                </Badge>
              )}
              {grade && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {grade}
                </Badge>
              )}
            </div>
          )}

          {/* Topic */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              Chủ đề bài học <span className="text-destructive">*</span>
            </label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Vd: Phân số, Quang hợp, Cách mạng tháng Tám..."
              className="h-8 text-xs"
              disabled={isPlanning || isFilling}
            />
          </div>

          {/* Objectives */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              Mục tiêu học tập{" "}
              <span className="text-muted-foreground">(không bắt buộc)</span>
            </label>
            <Textarea
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              placeholder="Học sinh sẽ làm được gì sau bài học này?"
              className="min-h-[60px] text-xs"
              disabled={isPlanning || isFilling}
            />
          </div>

          {/* Tạo dàn ý */}
          <Button
            size="sm"
            className="w-full gap-2 text-xs"
            onClick={handleGenerateStoryboard}
            disabled={!topic.trim() || isPlanning || isFilling || !lessonId}
          >
            {isPlanning ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Đang tạo dàn ý...
              </>
            ) : (
              <>
                <Wand2 className="h-3.5 w-3.5" />
                Tạo dàn ý
              </>
            )}
          </Button>
        </div>

        {/* ─── Storyboard list ─────────────────────────────── */}
        {storyboard && isReady && (
          <div className="space-y-3 p-3">
            {storyboard.sections.map((section) => (
              <div key={section.id} className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {section.title}
                </p>
                {section.items.map((item, itemIdx) => (
                  <div
                    key={item.id}
                    className="rounded-md border bg-card p-2 space-y-1.5"
                  >
                    {/* Block type chip + move/remove controls */}
                    <div className="flex items-center gap-1.5">
                      <Badge className="shrink-0 text-[10px] font-medium">
                        {BLOCK_TYPE_LABELS[item.blockType] ?? item.blockType}
                      </Badge>
                      <div className="ml-auto flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          aria-label="Di chuyển lên"
                          disabled={itemIdx === 0}
                          onClick={() => moveItem(lessonId!, section.id, item.id, "up")}
                          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-30"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Di chuyển xuống"
                          disabled={itemIdx === section.items.length - 1}
                          onClick={() => moveItem(lessonId!, section.id, item.id, "down")}
                          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-30"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Xóa mục"
                          onClick={() => removeItem(lessonId!, section.id, item.id)}
                          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Intent — editable */}
                    <Input
                      value={item.intent}
                      onChange={(e) =>
                        updateItem(lessonId!, section.id, item.id, {
                          intent: e.target.value,
                        })
                      }
                      aria-label={`Ý định của mục ${item.id}`}
                      placeholder="Ý định của block..."
                      className="h-7 text-xs"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Empty state when no lesson selected */}
        {!lessonId && (
          <div className="flex flex-col items-center justify-center py-8 text-center px-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Chọn bài học để bắt đầu dùng AI soạn nội dung
            </p>
          </div>
        )}

        {/* Empty state when lesson selected but no storyboard yet */}
        {lessonId && !storyboard && status === "idle" && (
          <div className="flex flex-col items-center justify-center py-6 text-center px-3">
            <p className="text-xs text-muted-foreground">
              Nhập chủ đề và bấm <strong>Tạo dàn ý</strong> để bắt đầu
            </p>
          </div>
        )}
      </div>

      {/* ─── Footer: Tạo nội dung từ dàn ý ──────────────────────── */}
      <div className="border-t p-3">
        <Button
          size="sm"
          className="w-full gap-2 bg-primary text-xs text-primary-foreground hover:bg-primary-hover"
          disabled={!isReady || isFilling || status === "done" || !lessonId}
          onClick={handleFill}
        >
          {isFilling ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {progress ? `Đang tạo ${progress}...` : "Đang tạo nội dung..."}
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              Tạo nội dung từ dàn ý
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
