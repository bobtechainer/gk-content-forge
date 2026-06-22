import { LOGINS, MEMBERSHIPS, STATIC_MEMBERS } from "@/lib/org-mock-data";
import { ancestorChain, nodeById } from "./tree";
import type { OrgRoleId } from "./capabilities";
import type { OrgNode } from "./types";

/**
 * Một dòng thành viên đã chuẩn hoá để hiển thị (gộp membership có login +
 * thành viên tĩnh). `source` cho biết thành viên trực tiếp ở node hay kế thừa
 * từ một node cha (kèm tên node cha để ghi chú).
 */
export interface MemberRow {
  /** Khoá ổn định: id membership hoặc id thành viên tĩnh. */
  id: string;
  name: string;
  shortName: string;
  email: string;
  avatarColor: string;
  role: OrgRoleId;
  /** "direct" = trực tiếp ở node; "inherited" = kế thừa từ node cha. */
  source: "direct" | "inherited";
  /** Tên node cha mà thành viên được kế thừa từ đó (chỉ khi source = inherited). */
  inheritedFromName: string | null;
  lockedByPin: boolean;
}

const FALLBACK_COLOR = "var(--colors-gray-400)";

/** Hai chữ cái viết tắt từ tên (fallback khi không có shortName). */
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Số thành viên trực tiếp của một node (membership có login + thành viên tĩnh),
 * dùng cho thẻ đơn vị con trong màn Tổ chức.
 */
export function directMemberCount(nodeId: string): number {
  const fromLogins = MEMBERSHIPS.filter((m) => m.nodeId === nodeId).length;
  const fromStatic = STATIC_MEMBERS.filter((m) => m.nodeId === nodeId).length;
  return fromLogins + fromStatic;
}

/** Tên người quản (vai trò cao nhất) của một node — phục vụ thẻ đơn vị con. */
const ROLE_RANK: Record<OrgRoleId, number> = {
  owner: 6,
  admin: 5,
  manager: 4,
  publisher: 3,
  editor: 2,
  viewer: 1,
};

export function managerNameFor(nodeId: string): string | null {
  const candidates = MEMBERSHIPS.filter((m) => m.nodeId === nodeId);
  if (candidates.length === 0) return null;
  const top = [...candidates].sort((a, b) => ROLE_RANK[b.role] - ROLE_RANK[a.role])[0];
  const login = LOGINS.find((l) => l.id === top.loginId);
  return login?.name ?? null;
}

/** Dòng thành viên trực tiếp ở một node (membership có login). */
function directRowsFromLogins(nodeId: string, source: MemberRow["source"], fromName: string | null): MemberRow[] {
  return MEMBERSHIPS.filter((m) => m.nodeId === nodeId).map((m) => {
    const login = LOGINS.find((l) => l.id === m.loginId);
    const name = login?.name ?? "Thành viên";
    return {
      id: m.id,
      name,
      shortName: login?.shortName ?? initialsOf(name),
      email: login?.email ?? "",
      avatarColor: login?.avatarColor ?? FALLBACK_COLOR,
      role: m.role,
      source,
      inheritedFromName: source === "inherited" ? fromName : null,
      lockedByPin: m.lockedByPin,
    } satisfies MemberRow;
  });
}

/** Dòng thành viên tĩnh (không có login) ở một node. */
function staticRows(nodeId: string): MemberRow[] {
  return STATIC_MEMBERS.filter((m) => m.nodeId === nodeId).map((m) => ({
    id: m.id,
    name: m.name,
    shortName: m.shortName,
    email: m.email,
    avatarColor: m.avatarColor,
    role: m.role,
    source: "direct" as const,
    inheritedFromName: null,
    lockedByPin: false,
  }));
}

/**
 * Toàn bộ thành viên hiển thị cho một node: trực tiếp ở node + kế thừa từ các
 * node cha (ghi chú "kế thừa từ <node cha>"). Đặt trực tiếp lên trước.
 */
export function membersForNode(nodes: OrgNode[], nodeId: string): MemberRow[] {
  const direct = [...directRowsFromLogins(nodeId, "direct", null), ...staticRows(nodeId)];

  // Ancestor chain gồm chính node ở đầu; bỏ phần tử đầu để lấy các node cha.
  const ancestors = ancestorChain(nodes, nodeId).slice(1);
  const inherited = ancestors.flatMap((ancestorId) => {
    const ancestorNode = nodeById(nodes, ancestorId);
    return directRowsFromLogins(ancestorId, "inherited", ancestorNode?.name ?? null);
  });

  return [...direct, ...inherited];
}
