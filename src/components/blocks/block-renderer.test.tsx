// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { BlockRenderer } from "./block-renderer";
import type { CourseBlock } from "@/stores/course";

const blk = (b: Partial<CourseBlock>): CourseBlock => ({ id: "b1", type: "text", content: "", ...b }) as CourseBlock;

describe("BlockRenderer (read-only)", () => {
  it("renders text HTML content", () => {
    render(<BlockRenderer block={blk({ type: "text", content: "<p>Xin chào</p>" })} mode="preview" />);
    expect(screen.getByText("Xin chào")).toBeInTheDocument();
  });
  it("renders a callout with its text", () => {
    render(<BlockRenderer block={blk({ type: "callout", content: "Ghi nhớ", calloutVariant: "tip" })} mode="learn" />);
    expect(screen.getByText("Ghi nhớ")).toBeInTheDocument();
  });
  it("returns null for a section marker", () => {
    const { container } = render(<BlockRenderer block={blk({ type: "section", content: "Phần 2" })} mode="preview" />);
    expect(container.firstChild).toBeNull();
  });
});
