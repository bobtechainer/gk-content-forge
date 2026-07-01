import { create } from "zustand";

/* Điều khiển panel "Chèn storyboard" (dock độc lập bên phải builder).
   Store nhỏ, KHÔNG persist — chỉ là trạng thái mở/đóng nhất thời để cả
   nút trên thanh công cụ builder LẪN trợ lý AI đều mở được cùng một panel
   (AI chỉ là một cách mở ra, không còn "đính kèm" storyboard). */

interface InsertStoryboardState {
  open: boolean;
  openPanel: () => void;
  closePanel: () => void;
  toggle: () => void;
}

export const useInsertStoryboard = create<InsertStoryboardState>((set, get) => ({
  open: false,
  openPanel: () => set({ open: true }),
  closePanel: () => set({ open: false }),
  toggle: () => set({ open: !get().open }),
}));
