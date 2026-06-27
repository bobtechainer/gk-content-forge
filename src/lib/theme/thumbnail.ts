import type { CourseTheme } from "./resolve";

/**
 * Returns the thumbnail color for a content item.
 * When a course theme is present, uses the theme's accentSeed as the accent.
 * Otherwise falls back to the item's own thumbnailColor.
 */
export function courseThumbnailColor(
  item: { thumbnailColor: string },
  theme: CourseTheme | undefined,
): string {
  if (theme?.accentSeed) return theme.accentSeed;
  return item.thumbnailColor;
}
