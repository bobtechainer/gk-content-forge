# Đại tu Storyboard + UI System + Trợ lý AI (lesson builder)

Ngày: 2026-06-29 · Nhánh: `feat/lesson-builder-phase-0` · Brainstorm qua visual companion.

Phản hồi: 2 module mới làm hời hợt (chỉ create, không CRUD), Storyboard khô khốc không ảnh,
UI System sơ sài, chữ cứng. Làm lại 3 mảng. Người dùng uỷ quyền build tự động ("code luôn").

## Quyết định đã chốt (qua mockup)
1. **Storyboard = lưới khung cảnh** (layout A): mỗi khung có **ảnh tự sinh sẵn** + số + tiêu đề + mô tả.
2. **UI System = luồng 2 bước kiểu Claude Design**: Bước 1 khai báo (tên/mô tả, màu, phông, ghi chú) →
   Bước 2 **trái chỉnh – phải xem trước trực tiếp** (split).
3. **Đính kèm trong AI = lưới thẻ xem trước, chọn 1** (preview-before-attach). Áp cho cả Storyboard & UI.
4. **"Tạo cả khoá học"**: 1 ô prompt (+ đính 1 Storyboard, 1 UI) → Gửi → **AI trả lời kèm 2 nút**
   "Tạo dàn ý" / "Tạo nội dung đầy đủ" → bấm mới chạy, đổ vào cây nội dung cột trái.
5. **"Chèn sách" = A**: chọn sách trong bộ sách → đính làm **ngữ cảnh cho AI** (thẻ đính kèm).
6. Bỏ mode **"Tạo thẻ ghi nhớ"**. Mode còn lại: Tạo nội dung · Tạo cả khoá học · Tạo cả bài theo dàn ý ·
   Tạo câu hỏi · Tạo học liệu · Soạn lại.
7. **Ảnh** = thư viện minh hoạ phẳng (SVG) đóng gói trong app, gán theo chủ đề cảnh. Không backend.
   Lớp asset tách riêng để sau thay ảnh nano-banana thật chỉ đổi 1 chỗ.
8. **CRUD đầy đủ** cho cả 2 module. **Mọi chữ viết lại bằng giọng /humanized**.
9. Nút "+ Tạo mới ↗" trong picker mở **tab mới**.

## Mô hình dữ liệu (ADDITIVE — không phá test)
- `StoryboardItem` thêm `image?: string` (khoá cảnh, vd "lab"/"reading") và `title?: string` (tên cảnh).
  Giữ nguyên `sections`, `blockType`, `intent`, `learningGoal` → `fill-orchestrator`, store, 3 file test
  vẫn chạy. Trình sửa hiển thị **lưới phẳng** = `sections.flatMap(items)`; storyboard tạo mới lưu trong
  **1 section** "Khung cảnh"; khi sửa preset nhiều section thì chuẩn hoá về 1 section.
- Thư viện ảnh: `src/lib/storyboard/scene-art.ts` — map `key → SVG illustration` + `resolveSceneArt(key)`
  + `pickSceneArt(text, blockType)` (chọn theo từ khoá). Render bằng `data:image/svg+xml`.
- `storyboard-library` & `ui-system-library`: thêm `update(id, patch)`; preset (system) không sửa/xoá.

## Mảng 2 — Trình tạo Storyboard (dựng lại)
- Bố cục: cột trái = khai báo (chủ đề, mục tiêu) + **"Tài liệu tham chiếu"** (thêm sách/học liệu, dùng
  lại bộ chọn của AI); khu chính = **lưới khung cảnh** có ảnh, kéo–thả đổi thứ tự, ô "+" thêm khung,
  mỗi khung sửa được tiêu đề/mô tả/loại khối, đổi ảnh; **animation**: khung bay vào lần lượt (stagger),
  ảnh lộ dần, hover nhấc nhẹ (tôn trọng prefers-reduced-motion).
- `generateStoryboard` (mock) trả về các khung kèm `image` + `title` theo chủ đề.
- CRUD: chế độ NEW (`mod_*` → trắng, lưu = add) · EDIT (id là item trong kho → nạp + lưu = update) ·
  course (mở từ khoá học, giữ luồng cũ). Preset = xem + "Nhân bản để chỉnh sửa".

## Mảng 3 — Trình tạo UI System (dựng lại theo Claude Design)
- Standalone: **Bước 1 intake** (tên & mô tả, màu thương hiệu, phông, vibe, ghi chú) → "Tiếp tục dựng"
  → **Bước 2 studio** (trái: nút chỉnh màu/phông/bo góc/mật độ/sáng-tối; phải: **xem trước trực tiếp**
  với nút/thẻ/input/badge/khối bài thật + dải màu + mẫu phông). Course mode vào thẳng Bước 2.
- CRUD như Mảng 2.

## Mảng 1 — Trợ lý AI (lesson builder)
- Bỏ `flashcards` khỏi `AiChatMode`/MODES/followups.
- Thêm mode `course` ("Tạo cả khoá học"): composer 1 ô prompt + khe đính 1 Storyboard & 1 UI (đính thêm
  thay cái cũ). Gửi → AI trả lời bong bóng kèm **2 nút hành động**; bấm → chạy:
  - *Tạo dàn ý*: sinh cây Phần/Chương/Bài (mock `generateCourseOutline`) đổ vào store course.
  - *Tạo nội dung đầy đủ*: sinh outline rồi đổ nội dung khối cho từng bài (mock, có step-log).
- Đính kèm: `LibraryPicker` → **lưới thẻ xem trước, chọn 1**; nút **"+ Tạo mới ↗"** mở tab mới.
- Storyboard/UI: tối đa **1** mỗi loại trong attachments (thêm cái mới thay cái cũ).
- Dấu "+": "Tạo học liệu mới" → **"Chèn sách"** (mở bộ chọn lọc sách → đính kèm kind `book`).
- Chữ viết lại bằng giọng /humanized.

## Ràng buộc & gates
- Không backend, mock-only (`aiClient`). MobiFone Untitled UI: token-only, không hex/màu tuỳ tiện,
  sentence case, "bạn", không emoji trong UI sản phẩm (emoji chỉ trong nội dung chat mock nếu hợp).
- Gates: `npx tsc --noEmit`, `npm run test`, `npm run build`, SSR 200. Giữ 3 file test cũ xanh.
