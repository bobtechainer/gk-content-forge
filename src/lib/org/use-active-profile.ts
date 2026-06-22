import { LOGINS, ORG_NODES, MEMBERSHIPS } from "@/lib/org-mock-data";
import { useIdentity } from "@/stores/identity";
import { effectiveCapabilities, can as canCap, type ProfileRef } from "./permissions";
import { nodeById } from "./tree";
import type { Capability } from "./capabilities";
import type { Login, Membership, OrgNode } from "./types";

export type ViewGroup = "admin" | "reviewer" | "creator" | "org";

export interface ActiveProfile {
  login: Login | null;
  membership: Membership | null;
  node: OrgNode | null;
  capabilities: Set<Capability>;
  can: (c: Capability) => boolean;
  viewGroup: ViewGroup | null;
}

export function useActiveProfile(): ActiveProfile {
  const loginId = useIdentity((s) => s.activeLoginId);
  const membershipId = useIdentity((s) => s.activeMembershipId);
  const login = LOGINS.find((l) => l.id === loginId) ?? null;
  const membership = MEMBERSHIPS.find((m) => m.id === membershipId) ?? null;
  const node = membership ? nodeById(ORG_NODES, membership.nodeId) : null;
  const capabilities =
    login && membership
      ? effectiveCapabilities(login.id, membership.nodeId, {
          nodes: ORG_NODES,
          memberships: MEMBERSHIPS,
        })
      : new Set<Capability>();
  const viewGroup: ViewGroup | null =
    login?.systemRole === "admin"
      ? "admin"
      : login?.systemRole === "reviewer"
        ? "reviewer"
        : node?.type === "business"
          ? "org"
          : node?.type === "personal"
            ? "creator"
            : null;
  return { login, membership, node, capabilities, can: (c) => canCap(capabilities, c), viewGroup };
}

export type { ProfileRef };

/**
 * Dẫn xuất roleId (view-group cũ) từ một hồ sơ để cầu nối với các màn đang chạy:
 * - login hệ thống admin → "admin"; reviewer → "reviewer"
 * - node business → "publisher" (nhóm org/*)
 * - node personal → "teacher" (nhóm creator/*)
 */
export function viewGroupRoleIdFor(
  login: Login,
  node: OrgNode | null,
): "admin" | "reviewer" | "publisher" | "teacher" {
  if (login.systemRole === "admin") return "admin";
  if (login.systemRole === "reviewer") return "reviewer";
  if (node?.type === "business") return "publisher";
  return "teacher";
}
