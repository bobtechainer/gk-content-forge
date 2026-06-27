// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import type { Editor } from "@tiptap/react";

// BubbleMenu from @tiptap/react/menus uses a portal and real ProseMirror editor
// to position itself. In jsdom there is no selection API, so we mock BubbleMenu
// to render its children directly, allowing us to assert button labels.
vi.mock("@tiptap/react/menus", () => ({
  BubbleMenu: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="bubble-menu" className={className}>
      {children}
    </div>
  ),
}));

import { BubbleToolbar } from "./bubble-toolbar";

function buildMockEditor(overrides: Record<string, unknown> = {}): Editor {
  const run = vi.fn();
  const toggleBold = vi.fn(() => ({ run }));
  const toggleItalic = vi.fn(() => ({ run }));
  const toggleUnderline = vi.fn(() => ({ run }));
  const toggleHeading = vi.fn(() => ({ run }));
  const toggleBulletList = vi.fn(() => ({ run }));
  const toggleOrderedList = vi.fn(() => ({ run }));
  const toggleCode = vi.fn(() => ({ run }));
  const focus = vi.fn(() => ({
    toggleBold,
    toggleItalic,
    toggleUnderline,
    toggleHeading,
    toggleBulletList,
    toggleOrderedList,
    toggleCode,
  }));
  const chain = vi.fn(() => ({ focus }));

  return {
    isActive: vi.fn(() => false),
    chain,
    ...overrides,
  } as unknown as Editor;
}

describe("BubbleToolbar", () => {
  it("returns null when editor is null", () => {
    const { container } = render(<BubbleToolbar editor={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders all eight format buttons", () => {
    const editor = buildMockEditor();
    render(<BubbleToolbar editor={editor} />);

    const expectedLabels = [
      "Đậm",
      "Nghiêng",
      "Gạch chân",
      "Tiêu đề 2",
      "Tiêu đề 3",
      "Danh sách",
      "Danh sách số",
      "Mã",
    ];

    for (const label of expectedLabels) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("renders the bubble-menu container", () => {
    const editor = buildMockEditor();
    render(<BubbleToolbar editor={editor} />);
    expect(screen.getByTestId("bubble-menu")).toBeInTheDocument();
  });

  it("applies active class when isActive returns true for bold", () => {
    const editor = buildMockEditor({
      isActive: (name: string) => name === "bold",
    });
    render(<BubbleToolbar editor={editor} />);
    const boldButton = screen.getByRole("button", { name: "Đậm" });
    expect(boldButton).toHaveClass("bg-primary");
  });

  it("applies inactive class when isActive returns false", () => {
    const editor = buildMockEditor();
    render(<BubbleToolbar editor={editor} />);
    const italicButton = screen.getByRole("button", { name: "Nghiêng" });
    expect(italicButton).toHaveClass("text-muted-foreground");
  });
});
