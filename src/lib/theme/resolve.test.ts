import { describe, expect, it } from "vitest";
import { getResolvedThemeVars } from "./resolve";
import { contrastRatio } from "./color";
import type { CourseTheme } from "./resolve";

const lightTheme: CourseTheme = {
  schemaVersion: 1,
  base: "mobifone-default",
  accentSeed: "#237BD3",
  fontPairId: "inter-system",
  radiusStep: 8,
  density: "cozy",
  mode: "light",
};

const darkTheme: CourseTheme = {
  ...lightTheme,
  mode: "dark",
};

describe("getResolvedThemeVars", () => {
  it("returns {} when no theme (inherits global tokens)", () => {
    expect(getResolvedThemeVars(undefined)).toEqual({});
  });

  it("returns a map with all required --course-* keys for a light theme", () => {
    const vars = getResolvedThemeVars(lightTheme);
    expect(vars["--course-accent"]).toBeTruthy();
    expect(vars["--course-accent-soft"]).toBeTruthy();
    expect(vars["--course-accent-fg"]).toBeTruthy();
    expect(vars["--course-surface"]).toBeTruthy();
    expect(vars["--course-ink"]).toBeTruthy();
    expect(vars["--course-radius"]).toBe("8px");
  });

  it("accent equals accentSeed", () => {
    const vars = getResolvedThemeVars(lightTheme);
    expect(vars["--course-accent"]).toBe("#237BD3");
  });

  it("radius is formatted as px string", () => {
    const vars = getResolvedThemeVars({ ...lightTheme, radiusStep: 12 });
    expect(vars["--course-radius"]).toBe("12px");
  });

  it("dark theme produces a different surface from light theme", () => {
    const lightVars = getResolvedThemeVars(lightTheme);
    const darkVars = getResolvedThemeVars(darkTheme);
    expect(lightVars["--course-surface"]).not.toBe(darkVars["--course-surface"]);
  });

  it("accent-fg meets AA contrast (≥4.5) vs accent", () => {
    const vars = getResolvedThemeVars(lightTheme);
    const ratio = contrastRatio(vars["--course-accent"]!, vars["--course-accent-fg"]!);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("accent-fg meets AA contrast for orange accent seed", () => {
    const orangeTheme: CourseTheme = { ...lightTheme, accentSeed: "#FFA23A" };
    const vars = getResolvedThemeVars(orangeTheme);
    const ratio = contrastRatio(vars["--course-accent"]!, vars["--course-accent-fg"]!);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("emits --course-font-heading and --course-font-body as non-empty strings", () => {
    const vars = getResolvedThemeVars(lightTheme);
    expect(typeof vars["--course-font-heading"]).toBe("string");
    expect(vars["--course-font-heading"]!.length).toBeGreaterThan(0);
    expect(typeof vars["--course-font-body"]).toBe("string");
    expect(vars["--course-font-body"]!.length).toBeGreaterThan(0);
  });

  it("falls back to first font pair when fontPairId is unknown", () => {
    const unknownFontTheme: CourseTheme = { ...lightTheme, fontPairId: "nonexistent-id" };
    const vars = getResolvedThemeVars(unknownFontTheme);
    expect(vars["--course-font-heading"]).toBeTruthy();
    expect(vars["--course-font-body"]).toBeTruthy();
  });
});
