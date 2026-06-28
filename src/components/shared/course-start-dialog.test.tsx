// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { CourseStartDialog } from "./course-start-dialog";

describe("CourseStartDialog", () => {
  it("renders both choice buttons when open", () => {
    render(
      <CourseStartDialog
        open={true}
        onOpenChange={vi.fn()}
        onContinue={vi.fn()}
        onNewBlank={vi.fn()}
      />,
    );
    expect(screen.getByText("Tiếp tục bài giảng đang dở")).toBeInTheDocument();
    expect(screen.getByText("Tạo bài giảng mới hoàn toàn")).toBeInTheDocument();
  });

  it("clicking 'Tiếp tục…' calls onContinue and closes the dialog", () => {
    const onContinue = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <CourseStartDialog
        open={true}
        onOpenChange={onOpenChange}
        onContinue={onContinue}
        onNewBlank={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục bài giảng đang dở" }));
    expect(onContinue).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("clicking 'Tạo…mới…' calls onNewBlank and closes the dialog", () => {
    const onNewBlank = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <CourseStartDialog
        open={true}
        onOpenChange={onOpenChange}
        onContinue={vi.fn()}
        onNewBlank={onNewBlank}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Tạo bài giảng mới hoàn toàn" }));
    expect(onNewBlank).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
