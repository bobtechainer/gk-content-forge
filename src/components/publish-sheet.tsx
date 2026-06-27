import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useContent } from "@/stores/content";
import { useSession } from "@/stores/session";
import { useCourse } from "@/stores/course";
import { snapshotCourse } from "@/lib/publish/snapshot";
import { analyzeContent } from "@/lib/publish/analyze";
import { ACCOUNTS } from "@/lib/mock-data";
import type { Platform } from "@/lib/types";
import type { PublishAnalysis } from "@/lib/ai/types";

export function PublishSheet({
  open,
  onOpenChange,
  contentId,
  title,
  onPublished,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contentId: string;
  title: string;
  onPublished?: () => void;
}) {
  const [analysis, setAnalysis] = useState<PublishAnalysis | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [desc, setDesc] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>(["national"]);
  const [subject, setSubject] = useState("Toán");
  const [grade, setGrade] = useState("Lớp 8");
  const [lang, setLang] = useState("vi");
  const [publishing, setPublishing] = useState(false);

  const publish = useContent((s) => s.publish);
  const roleId = useSession((s) => s.roleId);

  useEffect(() => {
    if (!open) return;
    setAnalysis(null);
    // Compute real quality rubric from course blocks
    const courseData = useCourse.getState().courseData[contentId];
    const blocks = courseData?.lessons.flatMap((l) => l.blocks) ?? [];
    const result = analyzeContent(blocks, { subject, grade });
    setAnalysis(result);
    setTags(result.tags);
    setDesc(result.description);
  }, [open, contentId, subject, grade]);

  const togglePlatform = (p: Platform) => {
    setPlatforms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));
  };

  const submit = async () => {
    setPublishing(true);
    await new Promise((r) => setTimeout(r, 900));
    const verified =
      roleId && (ACCOUNTS[roleId].verified === "L2" || ACCOUNTS[roleId].verified === "admin");
    // contentId IS the courseId used by the builder — see course-builder.tsx
    const courseData = useCourse.getState().courseData[contentId];
    const snapshot = courseData ? snapshotCourse(courseData, Date.now()) : undefined;
    publish(
      contentId,
      {
        tags,
        description: desc,
        platforms,
        subject,
        grade,
        ownerVerified: !!verified,
      },
      snapshot,
    );
    setPublishing(false);
    onOpenChange(false);
    toast.success(verified ? "Đã xuất bản thành công!" : "Đã gửi nội dung — chờ duyệt từ admin");
    onPublished?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[480px]">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Xuất bản nội dung
          </SheetTitle>
          <p className="text-sm text-muted-foreground">{title}</p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">
            {!analysis ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang phân tích nội dung…
                </div>
                {[80, 100, 60, 90, 70].map((w, i) => (
                  <div
                    key={i}
                    className="h-4 animate-pulse rounded bg-gradient-to-r from-muted via-muted-foreground/10 to-muted"
                    style={{ width: `${w}%` }}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
                  <QualityRing score={analysis.score} />
                  <div>
                    <div className="text-sm font-medium text-foreground">Chất lượng nội dung</div>
                    <div className="text-xs text-muted-foreground">
                      {analysis.score >= 70
                        ? "Nội dung rõ ràng, có cấu trúc tốt"
                        : analysis.score >= 40
                          ? "Nội dung cơ bản — có thể cải thiện thêm"
                          : "Nội dung còn thiếu — xem gợi ý bên dưới"}
                    </div>
                  </div>
                </div>

                {analysis.notes.length > 0 && (
                  <div className="rounded-lg border border-warning/40 bg-warning/5 p-3">
                    <p className="mb-1.5 text-xs font-medium text-foreground">
                      Gợi ý cải thiện
                    </p>
                    <ul className="space-y-1">
                      {analysis.notes.map((note) => (
                        <li key={note} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <span className="mt-0.5 shrink-0 text-warning">•</span>
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <Label className="mb-2 block">Tags</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-primary"
                      >
                        {t}
                        <button
                          type="button"
                          aria-label={`Xóa thẻ ${t}`}
                          onClick={() => setTags(tags.filter((x) => x !== t))}
                          className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-full hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <div className="flex items-center gap-1">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newTag.trim()) {
                            setTags([...tags, newTag.trim()]);
                            setNewTag("");
                          }
                        }}
                        placeholder="Thêm tag…"
                        className="h-7 w-24 text-xs"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="min-h-8 min-w-8"
                        aria-label="Thêm thẻ"
                        onClick={() => {
                          if (newTag.trim()) {
                            setTags([...tags, newTag.trim()]);
                            setNewTag("");
                          }
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Mô tả</Label>
                  <Textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Chọn nền tảng đích</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <PlatformCard
                      label="Trường học số quốc gia"
                      color="var(--primary)"
                      letter="TH"
                      checked={platforms.includes("national")}
                      onToggle={() => togglePlatform("national")}
                    />
                    <PlatformCard
                      label="GK Ebooks"
                      color="var(--primary)"
                      letter="GK"
                      checked={platforms.includes("ebooks")}
                      onToggle={() => togglePlatform("ebooks")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div>
                    <Label className="mb-1.5 block text-xs">Môn học</Label>
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "Toán",
                          "Vật lý",
                          "Hóa học",
                          "Sinh học",
                          "Ngữ văn",
                          "Tiếng Anh",
                          "Lịch sử",
                          "Địa lý",
                        ].map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-xs">Khối lớp</Label>
                    <Select value={grade} onValueChange={setGrade}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => `Lớp ${i + 1}`).map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-xs">Ngôn ngữ</Label>
                    <Select value={lang} onValueChange={setLang}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vi">Tiếng Việt</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border bg-card p-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Lưu nháp
          </Button>
          <Button
            className="gap-1.5 bg-primary text-white hover:bg-primary-hover"
            disabled={!analysis || publishing}
            onClick={submit}
          >
            {publishing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Đang xuất bản…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" /> Xuất bản
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function QualityRing({ score }: { score: number }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} stroke="var(--border)" strokeWidth="6" fill="none" />
        <circle
          cx="36"
          cy="36"
          r={r}
          stroke="var(--success)"
          strokeWidth="6"
          fill="none"
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-foreground">{score}</span>
        <span className="-mt-1 text-[10px] text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

function PlatformCard({
  label,
  color,
  letter,
  checked,
  onToggle,
}: {
  label: string;
  color: string;
  letter: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      aria-label={`${checked ? "Bỏ chọn" : "Chọn"} nền tảng ${label}`}
      onClick={onToggle}
      className={`flex min-h-11 items-center gap-2 rounded-lg border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${checked ? "border-primary bg-accent" : "border-border bg-card hover:border-muted-foreground/40"}`}
    >
      <Checkbox checked={checked} className="pointer-events-none" />
      <div
        className="flex h-9 w-9 items-center justify-center rounded-md text-xs font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {letter}
      </div>
      <span className="text-xs font-medium leading-tight text-foreground">{label}</span>
    </button>
  );
}
