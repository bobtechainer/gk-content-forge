import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RoleId } from "@/lib/types";

export type Workspace = "personal" | "org";

interface SessionState {
  roleId: RoleId | null;
  /** Which workspace the user is currently operating in. */
  workspace: Workspace;
  /**
   * True once the persisted session has been read back from localStorage.
   * Auth guards must wait for this before redirecting, otherwise a cold page
   * load (new tab, refresh, deep link) bounces a logged-in user to /login
   * during the brief window before rehydration.
   */
  hasHydrated: boolean;
  setRole: (id: RoleId | null) => void;
  setWorkspace: (ws: Workspace) => void;
  setHasHydrated: (v: boolean) => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      roleId: null,
      workspace: "personal",
      hasHydrated: false,
      setRole: (id) => set({ roleId: id, workspace: "personal" }),
      setWorkspace: (ws) => set({ workspace: ws }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "gk-session",
      // hasHydrated is a runtime flag, never persisted.
      partialize: (s) => ({ roleId: s.roleId, workspace: s.workspace }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
