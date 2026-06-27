import { describe, expect, it } from "vitest";
import { getResolvedThemeVars } from "./resolve";

describe("getResolvedThemeVars (Phase 0)", () => {
  it("returns an empty var map when no theme (inherits global tokens)", () => {
    expect(getResolvedThemeVars(undefined)).toEqual({});
  });
});
