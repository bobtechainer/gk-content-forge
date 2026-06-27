// @vitest-environment jsdom
import { describe, expect, it, beforeEach, vi } from "vitest";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

// ---------------------------------------------------------------------------
// All mocks MUST be hoisted before any actual module imports.
// ---------------------------------------------------------------------------

let mockContentItem: any = undefined;

vi.mock("@/stores/content", () => ({
  useContent: (selector: (s: { items: any[] }) => any) =>
    selector({ items: mockContentItem ? [mockContentItem] : [] }),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock("@/lib/use-page-loading", () => ({
  usePageLoading: () => false,
}));

vi.mock("../shared/page-frame", () => ({
  PageFrame: ({
    children,
    title,
  }: {
    children: React.ReactNode;
    title: string;
  }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock("../shared/page-skeleton", () => ({
  PageSkeleton: () => <div>Loading…</div>,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Import AFTER all mocks are registered
// ---------------------------------------------------------------------------
import { StudentLearnPage } from "./student-learn";
import type { PublishedCourse } from "@/lib/publish/snapshot";
import type { ContentItem } from "@/lib/types";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("StudentLearnPage — empty state when no snapshot", () => {
  beforeEach(() => {
    localStorage.clear();
    mockContentItem = {
      id: "c_test",
      title: "Test Course",
      subject: "Toán",
      grade: "Lớp 8",
      status: "draft",
    } as ContentItem;
  });

  it("shows unpublished empty state when item has no publishedSnapshot", () => {
    render(<StudentLearnPage contentId="c_test" />);
    expect(screen.getByText(/Nội dung chưa được xuất bản/i)).toBeInTheDocument();
  });
});

describe("StudentLearnPage — renders real published snapshot", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders a text block from the publishedSnapshot", () => {
    const snapshot: PublishedCourse = {
      publishedAt: 1000,
      lessons: [
        {
          id: "l1",
          title: "Bài 1",
          blocks: [
            {
              id: "b1",
              type: "text",
              content: "<p>Nội dung thật từ snapshot</p>",
            } as any,
          ],
        },
      ],
    };

    mockContentItem = {
      id: "c_published",
      title: "Khoá học xuất bản",
      subject: "Toán",
      grade: "Lớp 8",
      status: "published",
      publishedSnapshot: snapshot,
    } as ContentItem;

    render(<StudentLearnPage contentId="c_published" />);
    expect(screen.getByText("Nội dung thật từ snapshot")).toBeInTheDocument();
  });

  it("shows progress bar when snapshot has lessons", () => {
    const snapshot: PublishedCourse = {
      publishedAt: 2000,
      lessons: [
        {
          id: "l1",
          title: "Bài 1",
          blocks: [
            { id: "b1", type: "text", content: "<p>Nội dung</p>" } as any,
          ],
        },
      ],
    };

    mockContentItem = {
      id: "c_progress",
      title: "Khoá học có tiến độ",
      subject: "Vật lý",
      grade: "Lớp 10",
      status: "published",
      publishedSnapshot: snapshot,
    } as ContentItem;

    render(<StudentLearnPage contentId="c_progress" />);
    expect(screen.getByText(/Tiến độ:/i)).toBeInTheDocument();
  });
});
