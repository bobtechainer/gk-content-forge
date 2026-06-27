import { describe, it, expect } from "vitest";
import { courseThumbnailColor } from "./thumbnail";
import type { CourseTheme } from "./resolve";

const mockTheme: CourseTheme = {
  schemaVersion: 1,
  base: "mobifone-default",
  accentSeed: "#237BD3",
  fontPairId: "inter-system",
  radiusStep: 8,
  density: "cozy",
  mode: "light",
};

const mockItem = { thumbnailColor: "#2563EB" };

describe("courseThumbnailColor", () => {
  it("returns accentSeed when theme is present", () => {
    expect(courseThumbnailColor(mockItem, mockTheme)).toBe("#237BD3");
  });

  it("returns item.thumbnailColor when theme is undefined", () => {
    expect(courseThumbnailColor(mockItem, undefined)).toBe("#2563EB");
  });

  it("returns item.thumbnailColor when theme is undefined (no theme set)", () => {
    const item = { thumbnailColor: "#10B981" };
    expect(courseThumbnailColor(item, undefined)).toBe("#10B981");
  });

  it("returns accentSeed from a different theme accent", () => {
    const darkTheme: CourseTheme = { ...mockTheme, accentSeed: "#3B82F6" };
    expect(courseThumbnailColor(mockItem, darkTheme)).toBe("#3B82F6");
  });
});
