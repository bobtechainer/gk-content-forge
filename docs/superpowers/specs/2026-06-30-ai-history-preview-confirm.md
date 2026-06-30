# AI panel (lịch sử + xem trước) · popup bắt đầu module · giao diện toàn khoá · preview-confirm

Ngày: 2026-06-30 (tối) · Nhánh `feat/lesson-builder-phase-0` · Brainstorm qua visual companion.

## Quyết định đã chốt
1. **Popup bắt đầu module**: bỏ màn `ModuleStartChoice` tách riêng — dùng **dialog** kiểu `CourseStartDialog`
   (Tiếp tục bản nháp mẫu / Tạo mới hoàn toàn), tái dùng ở mọi nơi tạo module.
2. **Kho**: Sửa Storyboard & UI System đầy đủ tính năng như lúc tạo (đã có CardActions → đảm bảo nạp đủ).
3. **AI "Tạo học liệu"**: thêm nút **"Đưa vào bài giảng"** cạnh "Lưu vào kho".
4. **Xem trước trước khi áp dụng**: mọi thao tác thêm vào bài / đổi giao diện → **popup preview + Xác nhận**.
5. **Bỏ đính kèm Giao diện** trong panel AI (giao diện là của cả khoá).
6. **Nút Giao diện** rời header → đặt **trên cây nội dung khoá học** (cột trái), mở popup chọn UI System
   (có **preview + xác nhận** mới đổi).
7. **AI tạo gì cũng có bước xem trước**: output là **thẻ xem trước** trong panel + **⤢ Xem to** (popup lớn);
   action **Đưa vào bài** (qua popup xác nhận) / **Lưu vào kho**. KHÔNG có nút "Bỏ".
8. **Lịch sử trò chuyện** cho trợ lý AI: thanh trên có **＋ (mới)** + **⟳ (lịch sử)** → danh sách cuộc trò
   chuyện (kiểu Antigravity), lưu lại được.

## Module start dialog (`module-start-dialog.tsx` + `stores/module-start.ts`)
- Store nhẹ (không persist): `request({ module, scope, newTab })` → mở dialog; chọn → mở builder với id
  `mods_…` (bản nháp mẫu, trang seed sẵn nội dung) hoặc `mod_…` (trắng). `<ModuleStartDialog/>` mount 1 lần
  trong `content-studio-shell`. builder-url thêm `newSeededModuleId()` + `isSeededModuleId()`.
- Mọi nơi "Tạo mới module" (ModuleGallery, hub MaterialTypeGrid, useCreateContent, LibraryPicker "+ Tạo mới")
  gọi `request(...)` thay vì mở builder trực tiếp.
- `storyboard-page` / `ui-system-page`: bỏ `ModuleStartChoice` gate; nếu id `mods_` → seed bản mẫu
  (storyboard: generateStoryboard; ui: SYSTEM_THEMES.stem → studio), id `mod_` → trắng (ui → intake).

## Giao diện toàn khoá (`course-builder.tsx`)
- Bỏ `CourseThemePicker` khỏi header; đặt một thanh **"Giao diện khoá học"** ngay **trên cây nội dung**
  (đầu cột trái / LessonTree). Bấm → popup chọn UI System → **preview theme trên mẫu + Xác nhận** mới
  `useCourseTheme.setTheme`.

## Preview-confirm (`preview-confirm-dialog.tsx`)
- Dialog dùng chung: tiêu đề + vùng preview (children) + "Huỷ" / "[nhãn xác nhận]". Dùng cho: đưa output AI
  vào bài, đổi giao diện khoá.

## Panel AI (`ai-assistant-panel.tsx`)
- Thanh trên: thêm **＋** (cuộc mới) và **⟳** (lịch sử) cạnh nút mở rộng.
- Output (content / quiz / material) = **thẻ xem trước** với **⤢ Xem to** (popup lớn) + **Đưa vào bài**
  (mở preview-confirm) + **Lưu vào kho** (material) — bỏ auto-insert quiz; bỏ nút "Bỏ".
- Bỏ `QuickAttach` Giao diện (chỉ còn Storyboard).
- Lịch sử: `stores/ai-chats.ts` (persist) lưu các cuộc theo courseId {id,title,messages,updatedAt}; panel nạp
  cuộc đang mở, ＋ tạo mới, ⟳ mở danh sách (Recent + xoá).

## Ràng buộc & gates
- Không backend, mock-only. MobiFone Untitled UI: token-only, sentence case, "bạn", không emoji UI (emoji chỉ
  trong nội dung chat mock). Gates: tsc, vitest 271, build, SSR 200.
