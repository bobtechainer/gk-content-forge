import { useState } from "react";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCourseTheme } from "@/stores/course-theme";
import { getResolvedThemeVars, type CourseTheme } from "@/lib/theme/resolve";
import { SYSTEM_THEMES, FONT_PAIRS } from "@/lib/theme/system-themes";
import { contrastRatio, accessibleInk, ramp, mix } from "@/lib/theme/color";

// ─── Contrast helpers ─────────────────────────────────────────────────────────

function contrastLevel(ratio: number): "AAA" | "AA" | "Fail" {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  return "Fail";
}

/** Nudge a hex color toward black/white until contrastRatio vs bg ≥ 4.5. */
function nudgeToAA(hex: string, bg: string): string {
  const target = accessibleInk(bg); // black or white direction
  let current = hex;
  for (let i = 0; i < 20; i++) {
    if (contrastRatio(current, bg) >= 4.5) break;
    current = mix(current, target, 0.1);
  }
  return current;
}

// ─── Mini-preview card for a system theme ────────────────────────────────────

interface ThemeCardProps {
  id: string;
  label: string;
  theme: CourseTheme;
  isActive: boolean;
  onApply: () => void;
}

function ThemeCard({ id, label, theme, isActive, onApply }: ThemeCardProps) {
  const vars = getResolvedThemeVars(theme);

  return (
    <Card
      className={`overflow-hidden transition-shadow ${isActive ? "ring-2 ring-primary shadow-md" : "hover:shadow-sm"}`}
      data-testid={`theme-card-${id}`}
    >
      {/* Live mini-preview — scoped vars via inline style (allowed) */}
      <div
        data-course-theme
        style={vars}
        className="p-3 text-[13px]"
      >
        <p
          style={{
            fontFamily: "var(--course-font-heading)",
            color: "var(--course-ink)",
            fontWeight: 600,
          }}
          className="mb-1 truncate"
        >
          {label}
        </p>
        {/* Accent-soft callout chip */}
        <span
          style={{
            background: "var(--course-accent-soft)",
            color: "var(--course-ink)",
            borderRadius: "var(--course-radius)",
            fontSize: "11px",
          }}
          className="inline-block px-2 py-0.5 mb-2"
        >
          Học liệu
        </span>
        {/* Accent button */}
        <div
          style={{
            background: "var(--course-accent)",
            color: "var(--course-accent-fg)",
            borderRadius: "var(--course-radius)",
            fontFamily: "var(--course-font-body)",
            fontSize: "11px",
          }}
          className="px-2 py-1 text-center font-medium"
        >
          Bắt đầu
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
        <span className="text-xs font-medium text-foreground">{label}</span>
        {isActive ? (
          <Badge variant="secondary" className="text-[10px]">
            Đang dùng
          </Badge>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-xs"
            onClick={onApply}
          >
            Áp dụng
          </Button>
        )}
      </div>
    </Card>
  );
}

// ─── Contrast badge ───────────────────────────────────────────────────────────

interface ContrastBadgeProps {
  ratio: number;
  label?: string;
}

function ContrastBadge({ ratio, label }: ContrastBadgeProps) {
  const level = contrastLevel(ratio);
  const colorClass =
    level === "AAA"
      ? "bg-success/10 text-success border-success/30"
      : level === "AA"
        ? "bg-warning/10 text-warning border-warning/30"
        : "bg-destructive/10 text-destructive border-destructive/30";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${colorClass}`}
      aria-label={`Tương phản ${ratio.toFixed(1)}:1 — ${level}`}
      data-testid="contrast-badge"
    >
      {level}
      {label && <span className="font-normal opacity-70">{label}</span>}
      <span className="opacity-60">{ratio.toFixed(1)}:1</span>
    </span>
  );
}

// ─── Custom editor ────────────────────────────────────────────────────────────

const RADIUS_STEPS = [0, 4, 6, 8, 10, 12, 16] as const;
type RadiusStep = (typeof RADIUS_STEPS)[number];

interface CustomEditorProps {
  courseId: string;
  onClose: () => void;
}

function CustomEditor({ courseId, onClose }: CustomEditorProps) {
  const currentTheme = useCourseTheme((s) => s.byCourse[courseId]);

  const [accentSeed, setAccentSeed] = useState(
    currentTheme?.accentSeed ?? "#237BD3",
  );
  const [fontPairId, setFontPairId] = useState(
    currentTheme?.fontPairId ?? "inter-system",
  );
  const [radiusStep, setRadiusStep] = useState<RadiusStep>(
    (RADIUS_STEPS.includes(currentTheme?.radiusStep as RadiusStep)
      ? currentTheme?.radiusStep
      : 8) as RadiusStep,
  );
  const [density, setDensity] = useState<CourseTheme["density"]>(
    currentTheme?.density ?? "cozy",
  );
  const [mode, setMode] = useState<CourseTheme["mode"]>(
    currentTheme?.mode ?? "light",
  );

  // Compute accent ramp for live preview
  const accentRamp = ramp(accentSeed);

  // Determine surface for the mode
  const surface =
    mode === "dark" ? mix(accentSeed, "#000000", 0.85) : "#ffffff";

  // Contrast: accent-fg on accent (how button text reads)
  const accentFgRatio = contrastRatio(accentRamp.ink, accentSeed);
  // Contrast: accent color as text on surface (e.g. links, headings)
  const accentOnSurfaceRatio = contrastRatio(accentSeed, surface);

  // Auto-nudge accent if it fails as text on surface (e.g. links/headings must read)
  // If the raw accent color on the surface fails AA, darken it until it passes.
  const resolvedAccent =
    accentOnSurfaceRatio < 4.5
      ? nudgeToAA(accentSeed, surface)
      : accentSeed;
  const resolvedOnSurface = contrastRatio(resolvedAccent, surface);
  const applyBlocked = resolvedOnSurface < 4.5;

  const previewTheme: CourseTheme = {
    schemaVersion: 1,
    base: "custom",
    accentSeed: resolvedAccent,
    fontPairId,
    radiusStep,
    density,
    mode,
  };
  const previewVars = getResolvedThemeVars(previewTheme);

  const handleApply = () => {
    useCourseTheme.getState().setTheme(courseId, previewTheme);
    onClose();
  };

  const handleReset = () => {
    useCourseTheme.getState().clear(courseId);
    onClose();
  };

  return (
    <div className="space-y-5">
      {/* Live preview */}
      <div
        data-course-theme
        style={previewVars}
        className="rounded-md border border-border overflow-hidden"
      >
        <div className="p-4">
          <p
            style={{
              fontFamily: "var(--course-font-heading)",
              color: "var(--course-ink)",
              fontWeight: 700,
              fontSize: "15px",
            }}
            className="mb-1"
          >
            Xem trước giao diện
          </p>
          <span
            style={{
              background: "var(--course-accent-soft)",
              color: "var(--course-ink)",
              borderRadius: "var(--course-radius)",
              fontSize: "12px",
            }}
            className="inline-block px-2 py-0.5 mb-3"
          >
            Ghi chú quan trọng
          </span>
          <p
            style={{
              fontFamily: "var(--course-font-body)",
              color: "var(--course-ink)",
              fontSize: "13px",
            }}
            className="mb-3 opacity-80"
          >
            Nội dung học liệu hiển thị theo phong cách này.
          </p>
          <div
            style={{
              background: "var(--course-accent)",
              color: "var(--course-accent-fg)",
              borderRadius: "var(--course-radius)",
              fontFamily: "var(--course-font-body)",
              fontSize: "13px",
              display: "inline-block",
            }}
            className="px-4 py-1.5 font-medium"
          >
            Bắt đầu học
          </div>
        </div>
      </div>

      {/* Accent color */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground">
          Màu chủ đạo
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={accentSeed}
            onChange={(e) => setAccentSeed(e.target.value)}
            className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent p-0.5"
            aria-label="Chọn màu chủ đạo"
          />
          <input
            type="text"
            value={accentSeed}
            onChange={(e) => {
              const v = e.target.value;
              if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setAccentSeed(v);
            }}
            className="h-8 w-24 rounded border border-border bg-transparent px-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            maxLength={7}
            aria-label="Mã hex màu chủ đạo"
          />
          <div className="flex items-center gap-1.5">
            <ContrastBadge ratio={accentFgRatio} label="nút" />
            <ContrastBadge ratio={accentOnSurfaceRatio} label="liên kết" />
          </div>
        </div>
        {applyBlocked && (
          <p className="mt-1 text-[11px] text-destructive" role="alert">
            Màu này không đạt chuẩn tương phản WCAG AA. Vui lòng chọn màu khác.
          </p>
        )}
        {/* Ramp preview swatches */}
        <div className="mt-2 flex gap-1">
          {([
            { bg: accentRamp.soft, label: "soft" },
            { bg: accentRamp.accent, label: "accent" },
            { bg: accentRamp.strong, label: "strong" },
          ] as const).map(({ bg, label }) => (
            <div
              key={label}
              style={{ background: bg }}
              className="h-5 w-10 rounded"
              title={`${label}: ${bg}`}
            />
          ))}
        </div>
      </div>

      {/* Font pair */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground">
          Bộ chữ
        </label>
        <Select value={fontPairId} onValueChange={setFontPairId}>
          <SelectTrigger className="h-8 text-xs" aria-label="Chọn bộ chữ">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_PAIRS.map((fp) => (
              <SelectItem key={fp.id} value={fp.id} className="text-xs">
                {fp.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Radius */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground">
          Bo góc: {radiusStep}px
        </label>
        <input
          type="range"
          min={0}
          max={RADIUS_STEPS.length - 1}
          step={1}
          value={RADIUS_STEPS.indexOf(radiusStep)}
          onChange={(e) => {
            const idx = Number(e.target.value);
            setRadiusStep(RADIUS_STEPS[idx] as RadiusStep);
          }}
          className="w-full accent-primary"
          aria-label="Bo góc"
        />
        <div className="mt-0.5 flex justify-between text-[10px] text-muted-foreground">
          {RADIUS_STEPS.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
      </div>

      {/* Density */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground">
          Mật độ
        </label>
        <Select value={density} onValueChange={(v) => setDensity(v as CourseTheme["density"])}>
          <SelectTrigger className="h-8 text-xs" aria-label="Chọn mật độ">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="compact" className="text-xs">Compact — gọn</SelectItem>
            <SelectItem value="cozy" className="text-xs">Cozy — vừa</SelectItem>
            <SelectItem value="spacious" className="text-xs">Spacious — thoáng</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mode */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground">
          Chế độ màu
        </label>
        <Select value={mode} onValueChange={(v) => setMode(v as CourseTheme["mode"])}>
          <SelectTrigger className="h-8 text-xs" aria-label="Chọn chế độ màu">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light" className="text-xs">Sáng (Light)</SelectItem>
            <SelectItem value="dark" className="text-xs">Tối (Dark)</SelectItem>
            <SelectItem value="auto" className="text-xs">Tự động (Auto)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          className="flex-1 bg-primary text-xs text-white hover:bg-primary-hover"
          onClick={handleApply}
          disabled={applyBlocked}
          data-testid="custom-apply-btn"
        >
          Áp dụng
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs text-muted-foreground"
          onClick={handleReset}
        >
          Khôi phục mặc định
        </Button>
      </div>
    </div>
  );
}

// ─── Main ThemePanel ──────────────────────────────────────────────────────────

interface ThemePanelProps {
  courseId: string;
}

export function ThemePanel({ courseId }: ThemePanelProps) {
  const [open, setOpen] = useState(false);
  const currentTheme = useCourseTheme((s) => s.byCourse[courseId]);
  const [tab, setTab] = useState<"gallery" | "custom">("gallery");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          aria-label="Mở tuỳ chỉnh giao diện"
        >
          <Palette className="h-3.5 w-3.5" />
          Giao diện
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[380px] overflow-y-auto sm:max-w-[380px] @media(prefers-reduced-motion:reduce):transition-none"
      >
        <SheetHeader className="mb-4">
          <SheetTitle>Giao diện khoá học</SheetTitle>
        </SheetHeader>

        {/* Tab switcher */}
        <div className="mb-4 flex rounded-lg border border-border p-0.5">
          <button
            onClick={() => setTab("gallery")}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${
              tab === "gallery"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Bộ giao diện
          </button>
          <button
            onClick={() => setTab("custom")}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${
              tab === "custom"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Tuỳ chỉnh
          </button>
        </div>

        {tab === "gallery" ? (
          <div className="grid grid-cols-2 gap-3" data-testid="theme-gallery">
            {Object.entries(SYSTEM_THEMES).map(([id, theme]) => (
              <ThemeCard
                key={id}
                id={id}
                label={themeLabel(id)}
                theme={theme}
                isActive={currentTheme?.base === id}
                onApply={() => {
                  useCourseTheme.getState().setTheme(courseId, theme);
                  setOpen(false);
                }}
              />
            ))}
          </div>
        ) : (
          <CustomEditor courseId={courseId} onClose={() => setOpen(false)} />
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const THEME_LABELS: Record<string, string> = {
  "mobifone-default": "MobiFone",
  stem: "STEM",
  humanities: "Nhân văn",
  "mam-non": "Mầm non",
  "trung-hoc": "Trung học",
  dark: "Tối (Dark)",
};

function themeLabel(id: string): string {
  return THEME_LABELS[id] ?? id;
}
