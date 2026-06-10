import type { Account, RoleId } from "./types";
import { ACCOUNTS } from "./mock-data";
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

/** Hook variant: resolves the active account from the current session role. */
export function useActiveAccount(scope: StudioScope): Account | null {
  const roleId = useSession((s) => s.roleId);
  return roleId ? resolveActiveAccount(roleId, scope) : null;
}
