// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { mergeContentItems } from "@/lib/stores/merge-content";
import { SEED_CONTENT } from "@/lib/mock-data";
import type { ContentItem } from "@/lib/types";

describe("content migrate is non-destructive", () => {
  beforeEach(() => localStorage.clear());

  it("preserves a user-created item across a simulated version bump", () => {
    const userDraft = { id: "user-draft-1", title: "Bài của tôi" } as ContentItem;
    const merged = mergeContentItems([userDraft, ...SEED_CONTENT], SEED_CONTENT);
    expect(merged.find((i) => i.id === "user-draft-1")).toBeTruthy();
  });
});
