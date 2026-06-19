import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye, Plus, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PublishSheet } from "@/components/publish-sheet";
import { MATERIAL_TYPE_LABELS } from "@/lib/taxonomy";
import type { LearningMaterialSubtype, MaterialType } from "@/lib/types";
import type { StudioScope } from "@/lib/use-scoped-content";
import { useContent } from "@/stores/content";
import { MaterialTypeIcon } from "./material-type-icon";

const SUBJECTS = [
  "Toán",
  "Vật lý",
  "Hóa học",
  "Sinh học",
  "Ngữ văn",
  "Tiếng Anh",
  "Lịch sử",
  "Địa lý",
];
const GRADES = Array.from({ length: 12 }, (_, i) => `Lớp ${i + 1}`);

const FORMATS: Record<LearningMaterialSubtype, string[]> = {
  quiz: ["Soạn trực tiếp"],
  lesson: ["PDF", "DOCX", "PPTX"],
  advanced: ["ZIP (HTML tương tác)"],
  scorm: ["ZIP (gói SCORM)"],
  document: ["PDF", "DOCX", "TXT", "XLSX"],
  video: ["MP4", "MOV", "AVI", "Link YouTube"],
  image: ["JPG", "PNG", "SVG", "GIF", "WEBP"],
  audio: ["MP3", "WAV", "OGG", "M4A"],
  "3d_vr": ["GLB", "GLTF", "OBJ", "FBX"],
};

export function MaterialUploadForm({ scope, id }: { scope: StudioScope; id: string }) {
  const navigate = useNavigate();
  const item = useContent((s) => s.items.find((x) => x.id === id));
  const updateItem = useContent((s) => s.updateItem);
  const base = scope === "org" ? "/org" : "/creator";

  const subtype: MaterialType = item?.materialSubtype ?? "document";
  const formats = FORMATS[(item?.materialSubtype as LearningMaterialSubtype) ?? "document"] ?? [
    "PDF",
  ];

  const [title, setTitle] = useState(item?.title ?? "Học liệu chưa đặt tên");
  const [format, setFormat] = useState(formats[0]);
  const [fileName, setFileName] = useState(item?.fileName ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [subject, setSubject] = useState(item?.subject ?? "Toán");
  const [grade, setGrade] = useState(item?.grade ?? "Lớp 8");
  const [tags, setTags] = useState<string[]>(item?.tags ?? []);
  const [newTag, setNewTag] = useState("");
  const [publishOpen, setPublishOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const saveDraft = () => {
    updateItem(id, { title, description, subject, grade, tags, fileName });
    toast.success("Đã lưu nháp");
  };

  const onFile = (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    toast.success(`Đã chọn tệp: ${file.name}`);
  };

  const addTag = () => {
    const t = newTag.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setNewTag("");
  };

  return (
    <div className="flex min-h-[calc(100vh-0px)] flex-col bg-muted/20">
      <div className="sticky top-0 z-20 flex min-h-14 items-center gap-3 border-b border-border bg-card px-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Quay lại"
          onClick={() => navigate({ to: `${base}/library` })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <MaterialTypeIcon type={subtype} size={28} />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => item && updateItem(id, { title })}
          aria-label="Tiêu đề học liệu"
          className="min-w-0 flex-1 rounded-md bg-transparent px-2 py-2 text-base font-semibold text-foreground outline-none hover:bg-muted/50 focus:bg-muted/50"
        />
        <Button variant="outline" size="sm" onClick={saveDraft}>
          Lưu nháp
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.info("Mở trang xem trước trong tab mới (demo)")}
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

      <div className="mx-auto grid w-full max-w-5xl gap-4 p-4 md:grid-cols-2 md:p-8">
        {/* Left: format + upload */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <Label className="mb-1.5 block">Loại học liệu</Label>
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
              <MaterialTypeIcon type={subtype} size={28} />
              {MATERIAL_TYPE_LABELS[subtype]}
            </div>
            <Label className="mb-1.5 block">Định dạng</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formats.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFile(e.dataTransfer.files?.[0]);
            }}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card p-8 text-center"
          >
            <UploadCloud className="h-8 w-8 text-primary" />
            <div className="text-sm font-medium text-foreground">Kéo & thả tệp vào đây</div>
            <div className="text-xs text-muted-foreground">hoặc</div>
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              Chọn tệp
            </Button>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] ?? undefined)}
            />
            {fileName && (
              <div className="mt-2 flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-xs">
                {fileName}
                <button type="button" aria-label="Xóa tệp" onClick={() => setFileName("")}>
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: metadata */}
        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <div>
            <Label className="mb-1.5 block">Mô tả</Label>
            <Textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn gọn nội dung học liệu…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Môn học</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Khối lớp</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger>
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
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Tags</Label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-primary"
                >
                  {t}
                  <button
                    type="button"
                    aria-label={`Xóa ${t}`}
                    onClick={() => setTags(tags.filter((x) => x !== t))}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Thêm tag…"
                  className="h-7 w-24 text-xs"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  aria-label="Thêm tag"
                  onClick={addTag}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PublishSheet
        open={publishOpen}
        onOpenChange={setPublishOpen}
        contentId={id}
        title={title}
        onPublished={() => navigate({ to: `${base}/library` })}
      />
    </div>
  );
}
