import type { Account, RoleId } from "./types";
import { ACCOUNTS } from "./mock-data";
import { ORG_NODES } from "./org-mock-data";
import { resolveActiveOrgId, type StudioScope } from "./use-scoped-content";
import { useSession } from "@/stores/session";

/**
 * The account whose identity should be displayed for a given scope.
 * In org scope a personal account shows the organization it operates within
 * (e.g. teacher → NXB Giáo dục VN), not the logged-in person.
 */
export function resolveActiveAccount(roleId: RoleId, scope: StudioScope): Account {
  if (scope === "org" && roleId !== "admin") return ACCOUNTS[resolveActiveOrgId(roleId)];
  return ACCOUNTS[roleId];
}

/**
 * Tài khoản hiển thị suy ra từ node tổ chức đang hoạt động (luồng identity):
 * node business → danh tính tổ chức; node personal → danh tính cá nhân.
 */
export function accountFromNode(nodeId: string): Account | null {
  const node = ORG_NODES.find((n) => n.id === nodeId);
  if (!node) return null;
  const isBusiness = node.type === "business";
  return {
    id: (isBusiness ? "publisher" : "teacher") as RoleId,
    name: node.name,
    shortName: node.shortName,
    accountType: isBusiness ? "Doanh nghiệp" : "Cá nhân",
    verified: isBusiness ? "verified" : "none",
    avatarColor: node.avatarColor,
    bio: node.bio ?? "",
    followers: node.followers ?? 0,
    website: node.website,
    email: node.email,
    businessLicense: node.businessLicense,
  };
}

/** Hook variant: ưu tiên node đang hoạt động (identity), nếu không thì theo role. */
export function useActiveAccount(scope: StudioScope): Account | null {
  const roleId = useSession((s) => s.roleId);
  const activeNodeId = useSession((s) => s.activeNodeId);
  if (activeNodeId) {
    const acc = accountFromNode(activeNodeId);
    if (acc) return acc;
  }
  return roleId ? resolveActiveAccount(roleId, scope) : null;
}
