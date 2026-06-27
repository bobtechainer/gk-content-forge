// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemePanel } from "./theme-panel";
import { useCourseTheme } from "@/stores/course-theme";
import { SYSTEM_THEMES } from "@/lib/theme/system-themes";
import { contrastRatio } from "@/lib/theme/color";

const COURSE_ID = "test-course-1";

function resetStore() {
  useCourseTheme.setState({ byCourse: {} });
  localStorage.clear();
}

// Helper: open the sheet and optionally switch tab
async function openPanel(container: HTMLElement, tab?: "gallery" | "custom") {
  const trigger = container.querySelector('[aria-label="Mở tuỳ chỉnh giao diện"]');
  if (!trigger) throw new Error("Trigger not found");
  fireEvent.click(trigger);

  if (tab === "custom") {
    const customTab = screen.getByText("Tuỳ chỉnh");
    fireEvent.click(customTab);
  }
}

describe("ThemePanel — gallery", () => {
  beforeEach(resetStore);

  it("renders a trigger button labelled 'Giao diện'", () => {
    const { getByText } = render(<ThemePanel courseId={COURSE_ID} />);
    expect(getByText("Giao diện")).toBeInTheDocument();
  });

  it("opens the sheet and shows ≥6 theme cards by preset name", () => {
    const { container } = render(<ThemePanel courseId={COURSE_ID} />);
    fireEvent.click(container.querySelector('[aria-label="Mở tuỳ chỉnh giao diện"]')!);

    // Each system theme key should produce a card
    const ids = Object.keys(SYSTEM_THEMES);
    expect(ids.length).toBeGreaterThanOrEqual(6);
    ids.forEach((id) => {
      expect(screen.getByTestId(`theme-card-${id}`)).toBeInTheDocument();
    });
  });

  it("clicking 'Áp dụng' on a preset stores that theme", () => {
    const { container } = render(<ThemePanel courseId={COURSE_ID} />);
    fireEvent.click(container.querySelector('[aria-label="Mở tuỳ chỉnh giao diện"]')!);

    // Click the first "Áp dụng" button (first non-active card)
    const applyBtns = screen.getAllByText("Áp dụng");
    fireEvent.click(applyBtns[0]);

    // The stored theme should match one of the system presets
    const stored = useCourseTheme.getState().getTheme(COURSE_ID);
    expect(stored).toBeDefined();
    const presetValues = Object.values(SYSTEM_THEMES);
    const matches = presetValues.some((p) => p.accentSeed === stored?.accentSeed);
    expect(matches).toBe(true);
  });

  it("clicking 'Áp dụng' on MobiFone preset stores mobifone-default theme", () => {
    const { container } = render(<ThemePanel courseId={COURSE_ID} />);
    fireEvent.click(container.querySelector('[aria-label="Mở tuỳ chỉnh giao diện"]')!);

    // Click the Áp dụng button inside the mobifone-default card
    const card = screen.getByTestId("theme-card-mobifone-default");
    const btn = card.querySelector("button");
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn!);

    const stored = useCourseTheme.getState().getTheme(COURSE_ID);
    expect(stored?.base).toBe("mobifone-default");
    expect(stored?.accentSeed).toBe(SYSTEM_THEMES["mobifone-default"].accentSeed);
  });

  it("active theme card shows 'Đang dùng' badge instead of 'Áp dụng'", () => {
    // Pre-set a theme so mobifone-default is active
    useCourseTheme.getState().setTheme(COURSE_ID, SYSTEM_THEMES["mobifone-default"]);

    const { container } = render(<ThemePanel courseId={COURSE_ID} />);
    fireEvent.click(container.querySelector('[aria-label="Mở tuỳ chỉnh giao diện"]')!);

    const card = screen.getByTestId("theme-card-mobifone-default");
    expect(card).toHaveTextContent("Đang dùng");
    // Should not have a standalone Áp dụng inside the active card
    expect(card.querySelector("button")).toBeNull();
  });
});

describe("ThemePanel — custom editor", () => {
  beforeEach(resetStore);

  it("renders the custom editor tab with accent color input", () => {
    const { container } = render(<ThemePanel courseId={COURSE_ID} />);
    openPanel(container, "custom");

    expect(screen.getByLabelText("Chọn màu chủ đạo")).toBeInTheDocument();
    expect(screen.getByLabelText("Mã hex màu chủ đạo")).toBeInTheDocument();
  });

  it("shows a contrast badge for the default accent", () => {
    const { container } = render(<ThemePanel courseId={COURSE_ID} />);
    openPanel(container, "custom");

    const badges = screen.getAllByTestId("contrast-badge");
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it("contrast badge shows 'Fail' for a light accent used as text on white surface (#eeeeee on #ffffff)", () => {
    // Very light grey accent on white surface: ~1.17:1 → Fail WCAG AA.
    // This verifies the "accent as link/heading text on surface" contrast path.
    const ratio = contrastRatio("#eeeeee", "#ffffff");
    const level = ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : "Fail";
    expect(level).toBe("Fail");
  });

  it("contrast badge renders 'Fail' in the UI when a very light hex is typed", () => {
    const { container } = render(<ThemePanel courseId={COURSE_ID} />);
    openPanel(container, "custom");

    // #eeeeee on white surface ≈ 1.17:1 — fails WCAG AA as link/heading text
    const hexInput = screen.getByLabelText("Mã hex màu chủ đạo");
    fireEvent.change(hexInput, { target: { value: "#eeeeee" } });

    const badges = screen.getAllByTestId("contrast-badge");
    // The "liên kết" badge (accent-on-surface) must show Fail
    const failBadges = badges.filter((b) => b.textContent?.includes("Fail"));
    expect(failBadges.length).toBeGreaterThan(0);
  });

  it("'Áp dụng' in custom editor stores a base:'custom' theme", () => {
    const { container } = render(<ThemePanel courseId={COURSE_ID} />);
    openPanel(container, "custom");

    const applyBtn = screen.getByTestId("custom-apply-btn");
    fireEvent.click(applyBtn);

    const stored = useCourseTheme.getState().getTheme(COURSE_ID);
    expect(stored?.base).toBe("custom");
    expect(stored?.schemaVersion).toBe(1);
  });

  it("'Khôi phục mặc định' clears the stored theme", () => {
    useCourseTheme.getState().setTheme(COURSE_ID, SYSTEM_THEMES["dark"]);

    const { container } = render(<ThemePanel courseId={COURSE_ID} />);
    openPanel(container, "custom");

    const resetBtn = screen.getByText("Khôi phục mặc định");
    fireEvent.click(resetBtn);

    expect(useCourseTheme.getState().getTheme(COURSE_ID)).toBeUndefined();
  });
});
