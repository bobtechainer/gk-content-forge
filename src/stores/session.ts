import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RoleId, SchoolRole } from "@/lib/types";

export type Workspace = "personal" | "org";

interface SessionState {
  roleId: RoleId | null;
  schoolRole?: SchoolRole;
  /**
   * Id của node tổ chức đang hoạt động (luồng identity mới). Là chủ sở hữu nội
   * dung được tạo trong phiên. Không set ở luồng cũ (school/demo role-switch).
   */
  activeNodeId?: string;
  /** Which workspace the user is currently operating in. */
  workspace: Workspace;
  /**
   * True once the persisted session has been read back from localStorage.
   * Auth guards must wait for this before redirecting, otherwise a cold page
   * load (new tab, refresh, deep link) bounces a logged-in user to /login
   * during the brief window before rehydration.
   */
  hasHydrated: boolean;
  setRole: (id: RoleId | null, schoolRole?: SchoolRole) => void;
  setWorkspace: (ws: Workspace) => void;
  /**
   * Đặt view-group cho luồng identity: roleId là nhóm màn dẫn xuất từ hồ sơ
   * (business→"publisher", personal→"teacher", systemRole→"admin"/"reviewer"),
   * activeNodeId là node tổ chức đang hoạt động (chủ sở hữu nội dung).
   */
  setView: (roleId: RoleId, activeNodeId?: string) => void;
  setHasHydrated: (v: boolean) => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      roleId: null,
      schoolRole: undefined,
      activeNodeId: undefined,
      workspace: "personal",
      hasHydrated: false,
      setRole: (id, schoolRole) => set({ roleId: id, schoolRole, workspace: "personal" }),
      setWorkspace: (ws) => set({ workspace: ws }),
      setView: (roleId, activeNodeId) =>
        set({
          roleId,
          activeNodeId,
          schoolRole: undefined,
          workspace: roleId === "publisher" ? "org" : "personal",
        }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "gk-session",
      // hasHydrated is a runtime flag, never persisted.
      partialize: (s) => ({
        roleId: s.roleId,
        schoolRole: s.schoolRole,
        activeNodeId: s.activeNodeId,
        workspace: s.workspace,
      }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
