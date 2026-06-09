import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RoleId } from "@/lib/types";

interface SessionState {
  roleId: RoleId | null;
  setRole: (id: RoleId | null) => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      roleId: null,
      setRole: (id) => set({ roleId: id }),
    }),
    { name: "gk-session" },
  ),
);