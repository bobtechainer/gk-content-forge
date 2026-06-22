import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MEMBERSHIPS } from "@/lib/org-mock-data";

interface IdentityState {
  activeLoginId: string | null;
  activeMembershipId: string | null;
  verifiedPins: Record<string, boolean>;
  hasHydrated: boolean;
  loginAs: (loginId: string) => void;
  /** mở hồ sơ; trả false nếu hồ sơ khoá mà chưa verify PIN */
  selectProfile: (membershipId: string) => boolean;
  verifyPin: (membershipId: string, pin: string) => boolean;
  logout: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useIdentity = create<IdentityState>()(
  persist(
    (set, get) => ({
      activeLoginId: null,
      activeMembershipId: null,
      verifiedPins: {},
      hasHydrated: false,
      loginAs: (loginId) => set({ activeLoginId: loginId, activeMembershipId: null }),
      verifyPin: (membershipId, pin) => {
        const m = MEMBERSHIPS.find((x) => x.id === membershipId);
        const ok = !!m && m.lockedByPin && m.pin === pin;
        if (ok) set((s) => ({ verifiedPins: { ...s.verifiedPins, [membershipId]: true } }));
        return ok;
      },
      selectProfile: (membershipId) => {
        const m = MEMBERSHIPS.find((x) => x.id === membershipId);
        if (!m) return false;
        if (m.lockedByPin && !get().verifiedPins[membershipId]) return false;
        set({ activeMembershipId: membershipId });
        return true;
      },
      logout: () => set({ activeLoginId: null, activeMembershipId: null, verifiedPins: {} }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "gk-identity",
      partialize: (s) => ({ activeLoginId: s.activeLoginId, activeMembershipId: s.activeMembershipId }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
