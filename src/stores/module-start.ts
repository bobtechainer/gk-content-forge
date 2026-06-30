import { create } from "zustand";
import type { BuilderScope } from "@/lib/builder-url";

export type StartModule = "storyboard" | "ui_system";

interface ModuleStartState {
  open: boolean;
  module: StartModule | null;
  scope: BuilderScope;
  newTab: boolean;
  request: (req: { module: StartModule; scope: BuilderScope; newTab?: boolean }) => void;
  close: () => void;
}

/** Điều khiển dialog "Tạo module" dùng chung (mount 1 lần ở content-studio-shell). */
export const useModuleStart = create<ModuleStartState>((set) => ({
  open: false,
  module: null,
  scope: "creator",
  newTab: true,
  request: ({ module, scope, newTab = true }) => set({ open: true, module, scope, newTab }),
  close: () => set({ open: false }),
}));
