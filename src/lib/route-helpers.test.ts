import { describe, expect, test } from "vitest";
import type { ContentItem } from "@/lib/types";
import {
  getAppHomeForAccount,
  getVisibleContentItems,
  getVisibleMaterialItems,
} from "./route-helpers";

const createItem = (overrides: Partial<ContentItem>): ContentItem => ({
  id: "content-1",
  title: "Sample content",
  type: "learning_material",
  category: "learning_material",
  materialType: "quiz",
  materialSubtype: "quiz",
  status: "draft",
  ownerId: "teacher",
  createdAt: "2026-06-10",
  views: 0,
  likes: 0,
  shares: 0,
  thumbnailColor: "#2563EB",
  subject: "Toán",
  grade: "Lớp 8",
  platforms: [],
  tags: [],
  description: "",
  ...overrides,
});

const items: ContentItem[] = [
  createItem({
    id: "teacher-quiz",
    ownerId: "teacher",
    materialType: "quiz",
    materialSubtype: "quiz",
  }),
  createItem({
    id: "teacher-book",
    ownerId: "teacher",
    type: "book",
    category: "book",
    materialType: "book",
  }),
  createItem({
    id: "publisher-video",
    ownerId: "publisher",
    materialType: "video",
    materialSubtype: "video",
  }),
];

describe("session route helpers", () => {
  test("returns only owned content for non-admin sessions", () => {
    expect(getVisibleContentItems(items, "teacher").map((item) => item.id)).toEqual([
      "teacher-quiz",
      "teacher-book",
    ]);
  });

  test("returns every content item for admin sessions", () => {
    expect(getVisibleContentItems(items, "admin").map((item) => item.id)).toEqual([
      "teacher-quiz",
      "teacher-book",
      "publisher-video",
    ]);
  });

  test("returns only visible learning material content", () => {
    expect(getVisibleMaterialItems(items, "teacher").map((item) => item.id)).toEqual([
      "teacher-quiz",
    ]);
    expect(getVisibleMaterialItems(items, "admin").map((item) => item.id)).toEqual([
      "teacher-quiz",
      "publisher-video",
    ]);
  });

  test("maps account types to app shell home paths", () => {
    expect(getAppHomeForAccount("personal")).toBe("/creator/dashboard");
    expect(getAppHomeForAccount("organization")).toBe("/org/dashboard");
    expect(getAppHomeForAccount("admin")).toBe("/admin/dashboard");
  });

  test("maps localized account types from seed data", () => {
    expect(getAppHomeForAccount("Cá nhân")).toBe("/creator/dashboard");
    expect(getAppHomeForAccount("Doanh nghiệp")).toBe("/org/dashboard");
    expect(getAppHomeForAccount("Admin")).toBe("/admin/dashboard");
  });
});
