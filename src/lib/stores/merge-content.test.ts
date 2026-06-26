import { describe, expect, it } from "vitest";
import { mergeContentItems } from "./merge-content";
import type { ContentItem } from "@/lib/types";

const seedItem = (id: string): ContentItem =>
  ({ id, title: `seed ${id}` }) as ContentItem;
const userItem = (id: string): ContentItem =>
  ({ id, title: `user ${id}` }) as ContentItem;

describe("mergeContentItems", () => {
  it("keeps user items (ids not in seed) and refreshes seed", () => {
    const seed = [seedItem("s1"), seedItem("s2")];
    const persisted = [userItem("u1"), { ...seedItem("s1"), title: "stale" } as ContentItem];
    const out = mergeContentItems(persisted, seed);
    expect(out.find((i) => i.id === "u1")).toBeTruthy();          // giữ user
    expect(out.find((i) => i.id === "s1")?.title).toBe("seed s1"); // seed làm mới (không stale)
    expect(out.filter((i) => i.id === "s1")).toHaveLength(1);      // không nhân đôi
  });

  it("returns user items first, then fresh seed", () => {
    const out = mergeContentItems([userItem("u1")], [seedItem("s1")]);
    expect(out.map((i) => i.id)).toEqual(["u1", "s1"]);
  });

  it("handles empty persisted (fresh install) → just seed", () => {
    const seed = [seedItem("s1")];
    expect(mergeContentItems([], seed)).toEqual(seed);
  });
});
