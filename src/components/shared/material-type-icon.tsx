import { MATERIAL_TYPE_ICONS } from "@/lib/taxonomy";
import type { MaterialType } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Accent color per material type, reused for tiles, badges and thumbnails. */
export const MATERIAL_TYPE_ACCENT: Record<MaterialType, string> = {
  book: "var(--colors-brand-700)",
  course: "var(--colors-violet-600)",
  quiz: "var(--colors-brand-600)",
  lesson: "var(--colors-blue-light-500)",
  advanced: "var(--colors-success-600)",
  scorm: "var(--colors-indigo-500)",
  document: "var(--colors-warning-500)",
  video: "var(--colors-error-500)",
  image: "var(--colors-pink-600)",
  audio: "var(--colors-teal-500)",
  "3d_vr": "var(--colors-orange-500)",
};

/** Best-matching SVG (from /public/book) per material type, used where an SVG glyph is preferred. */
export const MATERIAL_TYPE_SVG: Record<MaterialType, string> = {
  book: "document",
  course: "puzzie",
  quiz: "star",
  lesson: "doc",
  advanced: "html",
  scorm: "code",
  document: "document",
  video: "mp4",
  image: "image",
  audio: "audio",
  "3d_vr": "3d",
};

interface MaterialTypeIconProps {
  type: MaterialType;
  /** "lucide" (default) renders a tinted tile with a Lucide glyph; "svg" renders the /book SVG. */
  variant?: "lucide" | "svg";
  className?: string;
  /** Tile size in px for the lucide variant. */
  size?: number;
}

export function MaterialTypeIcon({
  type,
  variant = "lucide",
  className,
  size = 40,
}: MaterialTypeIconProps) {
  if (variant === "svg") {
    return (
      <img
        src={`/book/${MATERIAL_TYPE_SVG[type]}.svg`}
        alt={type}
        className={cn("rounded object-contain", className)}
        style={{ height: size, width: size }}
      />
    );
  }

  const Icon = MATERIAL_TYPE_ICONS[type];
  const accent = MATERIAL_TYPE_ACCENT[type];

  return (
    <span
      className={cn("flex shrink-0 items-center justify-center rounded-lg", className)}
      style={{ height: size, width: size, backgroundColor: `color-mix(in srgb, ${accent} 10%, transparent)`, color: accent }}
    >
      <Icon style={{ height: size * 0.5, width: size * 0.5 }} />
    </span>
  );
}
