import { describe, expect, it } from "vitest";
import { parseHex, relativeLuminance, contrastRatio, mix, accessibleInk, ramp } from "./color";

describe("parseHex", () => {
  it("parses 6-digit hex", () => {
    expect(parseHex("#237BD3")).toEqual({ r: 35, g: 123, b: 211 });
  });

  it("parses 3-digit shorthand hex", () => {
    expect(parseHex("#fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHex("#000")).toEqual({ r: 0, g: 0, b: 0 });
    expect(parseHex("#f0a")).toEqual({ r: 255, g: 0, b: 170 });
  });

  it("throws on invalid hex", () => {
    expect(() => parseHex("#gg0011")).toThrow();
  });
});

describe("relativeLuminance", () => {
  it("white has luminance 1", () => {
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 4);
  });

  it("black has luminance 0", () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 4);
  });
});

describe("contrastRatio", () => {
  it("black on white is ~21", () => {
    const ratio = contrastRatio("#000000", "#ffffff");
    expect(ratio).toBeCloseTo(21, 0);
  });

  it("white on white is 1", () => {
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 4);
  });

  it("returns value ≥1 for any pair", () => {
    const ratio = contrastRatio("#237BD3", "#FFA23A");
    expect(ratio).toBeGreaterThanOrEqual(1);
  });
});

describe("mix", () => {
  it("t=0 returns hexA", () => {
    expect(mix("#ff0000", "#0000ff", 0).toLowerCase()).toBe("#ff0000");
  });

  it("t=1 returns hexB", () => {
    expect(mix("#ff0000", "#0000ff", 1).toLowerCase()).toBe("#0000ff");
  });

  it("t=0.5 returns midpoint", () => {
    expect(mix("#000000", "#ffffff", 0.5).toLowerCase()).toBe("#808080");
  });
});

describe("accessibleInk", () => {
  it("returns dark ink on white background", () => {
    const ink = accessibleInk("#ffffff");
    expect(contrastRatio("#ffffff", ink)).toBeGreaterThanOrEqual(4.5);
  });

  it("returns white ink on black background", () => {
    const ink = accessibleInk("#000000");
    expect(ink.toLowerCase()).toBe("#ffffff");
    expect(contrastRatio("#000000", ink)).toBeGreaterThanOrEqual(4.5);
  });

  it("returns accessible ink on orange (#FFA23A)", () => {
    const bg = "#FFA23A";
    const ink = accessibleInk(bg);
    expect(contrastRatio(bg, ink)).toBeGreaterThanOrEqual(4.5);
  });

  it("returns accessible ink on primary blue (#237BD3)", () => {
    const bg = "#237BD3";
    const ink = accessibleInk(bg);
    expect(contrastRatio(bg, ink)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("ramp", () => {
  it("is deterministic", () => {
    const a = ramp("#237BD3");
    const b = ramp("#237BD3");
    expect(a).toEqual(b);
  });

  it("has accent equal to seed", () => {
    const r = ramp("#237BD3");
    expect(r.accent).toBe("#237BD3");
  });

  it("soft is lighter than seed", () => {
    const seed = "#237BD3";
    const r = ramp(seed);
    expect(relativeLuminance(parseHex(r.soft))).toBeGreaterThan(
      relativeLuminance(parseHex(seed)),
    );
  });

  it("strong is darker than seed", () => {
    const seed = "#237BD3";
    const r = ramp(seed);
    expect(relativeLuminance(parseHex(r.strong))).toBeLessThan(
      relativeLuminance(parseHex(seed)),
    );
  });

  it("ink meets 4.5:1 contrast against accent", () => {
    const seed = "#FFA23A";
    const r = ramp(seed);
    expect(contrastRatio(r.accent, r.ink)).toBeGreaterThanOrEqual(4.5);
  });
});
