import { MATERIAL_TYPE_ICONS } from "@/lib/taxonomy";
import type { MaterialType } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Accent color per material type, reused for tiles, badges and thumbnails. */
export const MATERIAL_TYPE_ACCENT: Record<MaterialType, string> = {
  book: "#20447E",
  course: "#8B5CF6",
  quiz: "#2563EB",
  lesson: "#0EA5E9",
  advanced: "#10B981",
  scorm: "#6366F1",
  document: "#F59E0B",
  video: "#EF4444",
  image: "#EC4899",
  audio: "#14B8A6",
  "3d_vr": "#F97316",
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
      style={{ height: size, width: size, backgroundColor: `${accent}1A`, color: accent }}
    >
      <Icon style={{ height: size * 0.5, width: size * 0.5 }} />
    </span>
  );
}
