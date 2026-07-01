import { create } from "zustand";

/* Tiêu điểm khối vừa thêm (nhất thời, KHÔNG persist). Khi thêm khối — từ trợ lý
   AI hay thêm thủ công — set id vào đây; canvas sẽ tự cuộn tới khối đó và nháy
   viền nổi bật một nhịp, rồi tự xoá. Giúp "đưa vào bài" luôn thấy chỗ vừa thêm. */

interface BlockFocusState {
  focusedId: string | null;
  focus: (id: string) => void;
  clear: () => void;
}

export const useBlockFocus = create<BlockFocusState>((set) => ({
  focusedId: null,
  focus: (id) => set({ focusedId: id }),
  clear: () => set({ focusedId: null }),
}));
