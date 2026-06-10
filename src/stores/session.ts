import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RoleId } from "@/lib/types";

export type Workspace = "personal" | "org";

interface SessionState {
  roleId: RoleId | null;
  /** Which workspace the user is currently operating in. */
  workspace: Workspace;
  setRole: (id: RoleId | null) => void;
  setWorkspace: (ws: Workspace) => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      roleId: null,
      workspace: "personal",
      setRole: (id) => set({ roleId: id, workspace: "personal" }),
      setWorkspace: (ws) => set({ workspace: ws }),
    }),
    { name: "gk-session" },
  ),
);
