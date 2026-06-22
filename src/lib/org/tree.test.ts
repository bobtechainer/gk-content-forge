import { describe, expect, test } from "vitest";
import { nodeById, childrenOf, ancestorChain, subtreeIds } from "./tree";
import type { OrgNode } from "./types";

const N = (id: string, parentId: string | null): OrgNode => ({
  id, name: id, shortName: id, type: "business", parentId, avatarColor: "#000",
});
// root -> a -> a1 ; root -> b
const NODES: OrgNode[] = [N("root", null), N("a", "root"), N("a1", "a"), N("b", "root")];

describe("org tree", () => {
  test("nodeById", () => {
    expect(nodeById(NODES, "a")?.id).toBe("a");
    expect(nodeById(NODES, "x")).toBeNull();
  });
  test("childrenOf", () => {
    expect(childrenOf(NODES, "root").map((n) => n.id)).toEqual(["a", "b"]);
    expect(childrenOf(NODES, "a").map((n) => n.id)).toEqual(["a1"]);
  });
  test("ancestorChain gồm chính node + lên tới gốc", () => {
    expect(ancestorChain(NODES, "a1")).toEqual(["a1", "a", "root"]);
    expect(ancestorChain(NODES, "root")).toEqual(["root"]);
  });
  test("subtreeIds gồm chính node + mọi con cháu", () => {
    expect(subtreeIds(NODES, "root").sort()).toEqual(["a", "a1", "b", "root"].sort());
    expect(subtreeIds(NODES, "a").sort()).toEqual(["a", "a1"].sort());
  });
});
