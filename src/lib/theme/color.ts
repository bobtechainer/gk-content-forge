/** Pure color utilities — no browser deps, fully testable. */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/** Parse #rgb or #rrggbb hex string into { r, g, b } (0–255). */
export function parseHex(hex: string): RGB {
  const h = hex.replace("#", "");
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) throw new Error(`Invalid hex: ${hex}`);
    return { r, g, b };
  }
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) throw new Error(`Invalid hex: ${hex}`);
    return { r, g, b };
  }
  throw new Error(`Invalid hex: ${hex}`);
}

/** WCAG relative luminance (sRGB linearization). */
export function relativeLuminance({ r, g, b }: RGB): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * WCAG contrast ratio between two hex colors.
 * Returns a value in [1, 21].
 */
export function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(parseHex(hexA));
  const lB = relativeLuminance(parseHex(hexB));
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Linear mix of two hex colors. t=0 → hexA, t=1 → hexB. */
export function mix(hexA: string, hexB: string, t: number): string {
  const a = parseHex(hexA);
  const b = parseHex(hexB);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bv = Math.round(a.b + (b.b - a.b) * t);
  return toHex(r, g, bv);
}

function toHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const hex = (v: number) => clamp(v).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/**
 * Return black or white ink whichever gives the higher contrast ratio on bgHex.
 * Guarantees ≥4.5:1 for any mid-tone or beyond (WCAG AA level).
 */
export function accessibleInk(bgHex: string): string {
  const WHITE = "#ffffff";
  const BLACK = "#000000";
  const cWhite = contrastRatio(bgHex, WHITE);
  const cBlack = contrastRatio(bgHex, BLACK);
  return cBlack >= cWhite ? BLACK : WHITE;
}

export interface ColorRamp {
  /** The seed color itself, used as the accent. */
  accent: string;
  /** Very light tint (88% toward white). */
  soft: string;
  /** Slightly deepened (20% toward black). */
  strong: string;
  /** Accessible ink on the accent background. */
  ink: string;
}

/** Build a deterministic color ramp from a hex seed. */
export function ramp(seedHex: string): ColorRamp {
  const accent = seedHex;
  const soft = mix(seedHex, "#ffffff", 0.88);
  const strong = mix(seedHex, "#000000", 0.2);
  const ink = accessibleInk(seedHex);
  return { accent, soft, strong, ink };
}
