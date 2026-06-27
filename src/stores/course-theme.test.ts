// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { useCourseTheme } from "./course-theme";
import type { CourseTheme } from "@/lib/theme/resolve";

const sampleTheme: CourseTheme = {
  schemaVersion: 1,
  base: "mobifone-default",
  accentSeed: "#237BD3",
  fontPairId: "inter-system",
  radiusStep: 8,
  density: "cozy",
  mode: "light",
};

function reset() {
  useCourseTheme.setState({ byCourse: {} });
  localStorage.clear();
}

describe("useCourseTheme", () => {
  beforeEach(reset);

  it("getTheme returns undefined for unknown course", () => {
    expect(useCourseTheme.getState().getTheme("course-x")).toBeUndefined();
  });

  it("setTheme then getTheme returns the same theme", () => {
    useCourseTheme.getState().setTheme("course-1", sampleTheme);
    expect(useCourseTheme.getState().getTheme("course-1")).toEqual(sampleTheme);
  });

  it("setTheme is immutable — does not mutate byCourse object", () => {
    const before = useCourseTheme.getState().byCourse;
    useCourseTheme.getState().setTheme("course-2", sampleTheme);
    expect(useCourseTheme.getState().byCourse).not.toBe(before);
  });

  it("clear removes the course theme", () => {
    useCourseTheme.getState().setTheme("course-1", sampleTheme);
    useCourseTheme.getState().clear("course-1");
    expect(useCourseTheme.getState().getTheme("course-1")).toBeUndefined();
  });

  it("clear does not affect other courses", () => {
    useCourseTheme.getState().setTheme("course-1", sampleTheme);
    useCourseTheme.getState().setTheme("course-2", { ...sampleTheme, accentSeed: "#FFA23A" });
    useCourseTheme.getState().clear("course-1");
    expect(useCourseTheme.getState().getTheme("course-2")).toBeDefined();
  });

  it("persists byCourse to localStorage under gk-course-theme", () => {
    useCourseTheme.getState().setTheme("course-1", sampleTheme);
    const raw = localStorage.getItem("gk-course-theme");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string);
    expect(parsed.state.byCourse["course-1"]).toBeDefined();
    expect(parsed.state.byCourse["course-1"].accentSeed).toBe("#237BD3");
  });

  it("persists under version 1", () => {
    useCourseTheme.getState().setTheme("course-1", sampleTheme);
    const raw = localStorage.getItem("gk-course-theme");
    const parsed = JSON.parse(raw as string);
    expect(parsed.version).toBe(1);
  });

  it("setTheme for multiple courses stores all independently", () => {
    const themeA = sampleTheme;
    const themeB = { ...sampleTheme, accentSeed: "#7C3AED", base: "humanities" };
    useCourseTheme.getState().setTheme("course-a", themeA);
    useCourseTheme.getState().setTheme("course-b", themeB);
    expect(useCourseTheme.getState().getTheme("course-a")?.accentSeed).toBe("#237BD3");
    expect(useCourseTheme.getState().getTheme("course-b")?.accentSeed).toBe("#7C3AED");
  });
});
