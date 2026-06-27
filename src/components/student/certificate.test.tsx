// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { Certificate } from "./certificate";
import type { CourseTheme } from "@/lib/theme/resolve";

const mockTheme: CourseTheme = {
  schemaVersion: 1,
  base: "mobifone-default",
  accentSeed: "#237BD3",
  fontPairId: "inter-system",
  radiusStep: 8,
  density: "cozy",
  mode: "light",
};

describe("Certificate", () => {
  const originalPrint = window.print;

  beforeEach(() => {
    window.print = vi.fn();
  });

  afterEach(() => {
    window.print = originalPrint;
  });

  it("renders the course title", () => {
    render(<Certificate courseTitle="Toán lớp 8" />);
    expect(screen.getByText("Toán lớp 8")).toBeInTheDocument();
  });

  it("renders the default learner name when not provided", () => {
    render(<Certificate courseTitle="Vật lý" />);
    expect(screen.getByText("Học sinh")).toBeInTheDocument();
  });

  it("renders a custom learner name", () => {
    render(<Certificate courseTitle="Lịch sử" learnerName="Nguyễn Văn A" />);
    expect(screen.getByText("Nguyễn Văn A")).toBeInTheDocument();
  });

  it("renders the print button with correct label", () => {
    render(<Certificate courseTitle="Khoá học" />);
    expect(screen.getByRole("button", { name: /in chứng nhận/i })).toBeInTheDocument();
  });

  it("calls window.print() when the print button is clicked", () => {
    render(<Certificate courseTitle="Khoá học" theme={mockTheme} />);
    const printBtn = screen.getByRole("button", { name: /in chứng nhận/i });
    fireEvent.click(printBtn);
    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it("renders without theme (no crash)", () => {
    render(<Certificate courseTitle="Không có theme" />);
    expect(screen.getByText("Không có theme")).toBeInTheDocument();
  });

  it("renders with a theme applied (data-course-theme attribute present)", () => {
    const { container } = render(
      <Certificate courseTitle="Có theme" theme={mockTheme} />,
    );
    expect(container.querySelector("[data-course-theme]")).toBeInTheDocument();
  });
});
