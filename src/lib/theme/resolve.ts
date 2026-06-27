import { ramp, accessibleInk, mix } from "./color";

export type CourseThemeVars = Record<string, string>;

export interface CourseTheme {
  schemaVersion: 1;
  /** SystemThemeId or "custom" */
  base: string;
  /** Hex color seed for the accent ramp */
  accentSeed: string;
  /** ID from FONT_PAIRS allow-list */
  fontPairId: string;
  /** Border-radius step in px */
  radiusStep: number;
  density: "compact" | "cozy" | "spacious";
  mode: "light" | "dark" | "auto";
}

/**
 * Build a scoped CSS-var map for a course theme.
 * Returns {} when no theme is provided (inherits global tokens).
 * Apply the result as `style={...}` on the `[data-course-theme]` root to
 * scope the overrides without leaking to app chrome.
 */
export function getResolvedThemeVars(theme?: CourseTheme): CourseThemeVars {
  if (!theme) return {};

  const r = ramp(theme.accentSeed);

  // Surface and ink depend on mode
  let surface: string;
  let ink: string;

  if (theme.mode === "dark") {
    // Near-black surface derived from accent seed, light ink
    surface = mix(theme.accentSeed, "#000000", 0.85);
    ink = "#f5f5f5";
  } else {
    // Light mode: white-ish surface, dark ink
    surface = "#ffffff";
    ink = accessibleInk(surface);
  }

  const vars: CourseThemeVars = {
    "--course-accent": r.accent,
    "--course-accent-soft": r.soft,
    "--course-accent-fg": r.ink,
    "--course-surface": surface,
    "--course-ink": ink,
    "--course-radius": `${theme.radiusStep}px`,
  };

  return vars;
}
