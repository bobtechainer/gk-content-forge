import type { CourseTheme } from "./resolve";

export interface FontPair {
  id: string;
  label: string;
  /** CSS font-family for headings (system-safe stack). */
  heading: string;
  /** CSS font-family for body text (system-safe stack). */
  body: string;
}

/** Allow-listed font pairs — CSP blocks remote fonts so we use system/generic stacks only. */
export const FONT_PAIRS: FontPair[] = [
  {
    id: "inter-system",
    label: "Inter / System",
    heading: "Inter, ui-sans-serif, system-ui, sans-serif",
    body: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
  {
    id: "georgia-system",
    label: "Georgia / System",
    heading: "Georgia, 'Times New Roman', serif",
    body: "ui-sans-serif, system-ui, sans-serif",
  },
  {
    id: "mono-clean",
    label: "Mono / Clean",
    heading: "ui-monospace, 'Cascadia Code', 'Fira Code', monospace",
    body: "ui-sans-serif, system-ui, sans-serif",
  },
  {
    id: "system-serif",
    label: "System / Serif",
    heading: "ui-serif, Georgia, Cambria, serif",
    body: "ui-serif, Georgia, Cambria, serif",
  },
  {
    id: "playful-round",
    label: "Playful Round",
    heading: "'Comic Sans MS', 'Chalkboard SE', ui-rounded, cursive",
    body: "ui-sans-serif, system-ui, sans-serif",
  },
  {
    id: "clean-sans",
    label: "Clean Sans",
    heading: "ui-sans-serif, 'Helvetica Neue', Arial, sans-serif",
    body: "ui-sans-serif, 'Helvetica Neue', Arial, sans-serif",
  },
];

/** Record of system-provided course theme presets. */
export const SYSTEM_THEMES: Record<string, CourseTheme> = {
  "mobifone-default": {
    schemaVersion: 1,
    base: "mobifone-default",
    accentSeed: "#237BD3",
    fontPairId: "inter-system",
    radiusStep: 8,
    density: "cozy",
    mode: "light",
  },
  stem: {
    schemaVersion: 1,
    base: "stem",
    accentSeed: "#0E7C86",
    fontPairId: "mono-clean",
    radiusStep: 6,
    density: "compact",
    mode: "light",
  },
  humanities: {
    schemaVersion: 1,
    base: "humanities",
    accentSeed: "#7C3AED",
    fontPairId: "georgia-system",
    radiusStep: 10,
    density: "cozy",
    mode: "light",
  },
  "mam-non": {
    schemaVersion: 1,
    base: "mam-non",
    accentSeed: "#F59E0B",
    fontPairId: "playful-round",
    radiusStep: 16,
    density: "spacious",
    mode: "light",
  },
  "trung-hoc": {
    schemaVersion: 1,
    base: "trung-hoc",
    accentSeed: "#16A34A",
    fontPairId: "clean-sans",
    radiusStep: 8,
    density: "compact",
    mode: "light",
  },
  dark: {
    schemaVersion: 1,
    base: "dark",
    accentSeed: "#3B82F6",
    fontPairId: "inter-system",
    radiusStep: 8,
    density: "cozy",
    mode: "dark",
  },
};
