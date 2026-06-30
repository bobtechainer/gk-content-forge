import { BookOpen, GraduationCap, LayoutList, Palette } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LEARNING_MATERIAL_SUBTYPES } from "@/lib/taxonomy";
import type { CreationCategory, LearningMaterialSubtype } from "@/lib/types";
import { MATERIAL_TYPE_ACCENT } from "./material-type-icon";

const INTERACTIVE: LearningMaterialSubtype[] = ["quiz", "lesson", "advanced", "scorm"];
const ATTACHMENTS: LearningMaterialSubtype[] = ["document", "video", "image", "audio", "3d_vr"];

const SUBTYPE_MAP = Object.fromEntries(LEARNING_MATERIAL_SUBTYPES.map((s) => [s.id, s]));

/** Module dùng lại — ngang hàng học liệu, có kho + trình tạo riêng, độc lập khoá học. */
export type ReusableModule = "storyboard" | "ui_system";

interface PickHandlers {
  onPickCategory: (category: CreationCategory) => void;
  onPickMaterial: (subtype: LearningMaterialSubtype) => void;
  onPickModule: (module: ReusableModule) => void;
}

/** The 4-zone creation grid, shared by the modal hub and the Studio landing page. */
export function MaterialTypeGrid({ onPickCategory, onPickMaterial, onPickModule }: PickHandlers) {
  return (
    <div className="space-y-6">
      <Section title="Sản phẩm xuất bản" hint="Có trình soạn thảo riêng cho từng loại">
        <div className="grid gap-3 sm:grid-cols-2">
          <ProductButton
            label="Tạo Sách"
            description="Sách điện tử, giáo trình nhiều chương"
            icon={BookOpen}
            accent={MATERIAL_TYPE_ACCENT.book}
            onClick={() => onPickCategory("book")}
          />
          <ProductButton
            label="Tạo Khóa học"
            description="Lộ trình học có bài giảng & kiểm tra"
            icon={GraduationCap}
            accent={MATERIAL_TYPE_ACCENT.course}
            onClick={() => onPickCategory("course")}
          />
        </div>
      </Section>

      <Section title="Học liệu tương tác" hint="Soạn trực tiếp hoặc tải gói">
        <div className="grid gap-2.5 sm:grid-cols-2">
          {INTERACTIVE.map((id) => (
            <MaterialButton key={id} id={id} onClick={() => onPickMaterial(id)} />
          ))}
        </div>
      </Section>

      <Section title="Tệp đính kèm" hint="Tải tệp lên kèm thông tin mô tả">
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {ATTACHMENTS.map((id) => (
            <MaterialButton key={id} id={id} onClick={() => onPickMaterial(id)} />
          ))}
        </div>
      </Section>

      <Section title="Storyboard & Giao diện" hint="Tạo một lần, dùng cho nhiều bài và nhiều khoá">
        <div className="grid gap-3 sm:grid-cols-2">
          <ProductButton
            label="Tạo Storyboard"
            description="Phác khung cảnh cho bài giảng, dùng lại khi cần"
            icon={LayoutList}
            accent="var(--primary)"
            onClick={() => onPickModule("storyboard")}
          />
          <ProductButton
            label="Tạo Giao diện"
            description="Bộ màu, phông, bố cục cho khoá học của bạn"
            icon={Palette}
            accent="var(--primary)"
            onClick={() => onPickModule("ui_system")}
          />
        </div>
      </Section>
    </div>
  );
}

interface MaterialTypePickerProps extends PickHandlers {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MaterialTypePicker({
  open,
  onOpenChange,
  onPickCategory,
  onPickMaterial,
  onPickModule,
}: MaterialTypePickerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border p-5">
          <DialogTitle>Tạo nội dung mới</DialogTitle>
          <DialogDescription>
            Chọn loại học liệu để mở trình tạo phù hợp. Sản phẩm xuất bản dùng builder riêng, học
            liệu khác dùng form tải lên.
          </DialogDescription>
        </DialogHeader>

        <div className="p-5">
          <MaterialTypeGrid
            onPickCategory={(c) => {
              onOpenChange(false);
              onPickCategory(c);
            }}
            onPickMaterial={(m) => {
              onOpenChange(false);
              onPickMaterial(m);
            }}
            onPickModule={(m) => {
              onOpenChange(false);
              onPickModule(m);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2.5 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>
      {children}
    </section>
  );
}

function ProductButton({
  label,
  description,
  icon: Icon,
  accent,
  onClick,
}: {
  label: string;
  description: string;
  icon: typeof BookOpen;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        className="flex h-12 w-12 items-center justify-center rounded-lg"
        style={{ backgroundColor: `color-mix(in srgb, ${accent} 10%, transparent)`, color: accent }}
      >
        <Icon className="h-6 w-6" />
      </span>
      <span>
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
    </button>
  );
}

function MaterialButton({ id, onClick }: { id: LearningMaterialSubtype; onClick: () => void }) {
  const meta = SUBTYPE_MAP[id];
  const Icon = meta.icon;
  const accent = MATERIAL_TYPE_ACCENT[id];
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: `color-mix(in srgb, ${accent} 10%, transparent)`, color: accent }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-foreground">{meta.label}</span>
        <span className="block truncate text-xs text-muted-foreground">{meta.description}</span>
      </span>
    </button>
  );
}
