import { describe, expect, test } from "vitest";
import { effectiveCapabilities, can, profilesForLogin } from "./permissions";
import type { OrgNode, Membership } from "./types";

const N = (id: string, parentId: string | null): OrgNode => ({
  id, name: id, shortName: id, type: "business", parentId, avatarColor: "#000",
});
const NODES: OrgNode[] = [N("root", null), N("child", "root")];
const M = (id: string, loginId: string, nodeId: string, role: Membership["role"]): Membership => ({
  id, loginId, nodeId, role, lockedByPin: false,
});
const MEMBERSHIPS: Membership[] = [
  M("m1", "owner-login", "root", "owner"),
  M("m2", "viewer-login", "child", "viewer"),
];

describe("permissions", () => {
  test("owner ở gốc kế thừa toàn quyền xuống node con", () => {
    const caps = effectiveCapabilities("owner-login", "child", { nodes: NODES, memberships: MEMBERSHIPS });
    expect(can(caps, "members.manage")).toBe(true);
    expect(can(caps, "org.transfer")).toBe(true);
  });
  test("viewer ở node con chỉ xem, không có quyền quản lý", () => {
    const caps = effectiveCapabilities("viewer-login", "child", { nodes: NODES, memberships: MEMBERSHIPS });
    expect(can(caps, "content.view")).toBe(true);
    expect(can(caps, "members.manage")).toBe(false);
  });
  test("extraCapabilities được cộng thêm", () => {
    const ms: Membership[] = [{ ...M("m3", "x", "root", "viewer"), extraCapabilities: ["content.publish_sign"] }];
    const caps = effectiveCapabilities("x", "root", { nodes: NODES, memberships: ms });
    expect(can(caps, "content.publish_sign")).toBe(true);
  });
  test("profilesForLogin trả các hồ sơ kèm node", () => {
    const profs = profilesForLogin("owner-login", { nodes: NODES, memberships: MEMBERSHIPS });
    expect(profs).toHaveLength(1);
    expect(profs[0].node?.id).toBe("root");
    expect(profs[0].membership.role).toBe("owner");
  });
});
