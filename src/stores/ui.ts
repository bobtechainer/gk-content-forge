import { create } from "zustand";

type LibraryViewMode = "table" | "grid";

interface UiState {
  /** Query typed in the header search, consumed by the Library page. */
  librarySearch: string;
  setLibrarySearch: (value: string) => void;
  /** Toggle between table and grid view in library. */
  libraryViewMode: LibraryViewMode;
  setLibraryViewMode: (mode: LibraryViewMode) => void;
}

export const useUi = create<UiState>((set) => ({
  librarySearch: "",
  setLibrarySearch: (value) => set({ librarySearch: value }),
  libraryViewMode: "table",
  setLibraryViewMode: (mode) => set({ libraryViewMode: mode }),
}));
