# Storyboard gọn + UI System studio (Claude Design) + AI inline + Lesson builder

Ngày: 2026-06-30 · Nhánh `feat/lesson-builder-phase-0` · Brainstorm qua visual companion.

## Quyết định đã chốt
- Storyboard frame: **chỉ ảnh + văn bản** (bỏ chọn loại khối).
- Tài liệu tham chiếu: **nhiều**, có **preview**, thêm nguồn **"Khung chung — chủ đề/chuyên đề"** (mock registry mọi môn).
- Đổi "Dán văn bản nguồn" → **"Hướng dẫn AI nên làm thế nào (tuỳ chọn)"**.
- Tạo module: luôn hỏi **"Tiếp tục bản nháp"** (mock fill sẵn) vs **"Tạo mới hoàn toàn"** (trắng). CRUD đầy đủ.
- UI System: sau Bước 1 → **AI hỏi đáp** (2–3 câu, có "Bỏ qua, dựng luôn") → **dựng có animation lộ dần** →
  **studio**: canvas dải component + panel phải (tab Chung/Thành phần) + **ô AI sửa nhanh ở đáy panel**.
- Lesson builder: bỏ nút **Dàn ý** ở header; nút **Giao diện** sang **trái header**, popup chọn UI System áp **toàn khoá**.
- Panel AI modes = **Tạo dàn ý khoá học · Tạo nội dung bài học · Tạo câu hỏi · Tạo học liệu**; **mặc định KHÔNG chọn mode**
  (chip "Chọn chế độ"). Bỏ "Tạo cả khoá học", "Tạo nội dung (đoạn)", "Soạn lại".
- 2 nút đính kèm Storyboard/Giao diện: **chọn xong chip "+" biến thành card**; bấm ✕ mới gỡ → về "+". Chỉ 1 mỗi loại.
- **AI inline** (BubbleToolbar đã có): bổ sung **cỡ chữ**, nút **"Soạn lại"**, ô **"Hỏi AI…"** (yêu cầu tự do cho đoạn bôi đen).

## Storyboard creator (`storyboard-page.tsx`)
- Bỏ dropdown loại khối ở mỗi khung; khung = ảnh (đổi được) + tiêu đề + văn bản. blockType giữ ngầm = "text".
- ReferencePicker: thêm tab **"Chủ đề chung"** đọc `src/lib/registry/topics.ts` (mock: môn → chuyên đề → chủ đề).
  Reference chip có **preview** (popover: nguồn, loại, môn/chuyên đề). refs vẫn nhiều.
- Đổi nhãn ô details → "Hướng dẫn AI nên làm thế nào (tuỳ chọn)".

## Mock registry chủ đề/chuyên đề (`src/lib/registry/topics.ts`)
- Cấu trúc: `Subject { id, name, strands: { id, name, topics: { id, name }[] }[] }`. Mock ~5 môn × vài chuyên đề × vài chủ đề.
- Helper `allTopics()` phẳng hoá để chọn/tìm. Dùng cho reference picker (và sau này định danh toàn hệ thống).

## Module start dialog (`module-start-dialog.tsx`)
- Dialog 2 lựa chọn dùng chung cho Storyboard & UI System, gọi từ ModuleGallery / hub / picker "+ Tạo mới".
- "Tiếp tục bản nháp" → mở id tiền tố `mods_` (trang seed mock fill sẵn nếu slot trống).
- "Tạo mới hoàn toàn" → mở id `mod_` (trắng). `isSeededModuleId(id)` trong builder-url.

## UI System studio (`ui-system-page.tsx`)
- Thêm step `brainstorm` giữa intake và studio: AI hỏi 2–3 câu (mock), chip trả lời nhanh + "Bỏ qua, dựng luôn".
- Step `generating`: animation lộ dần (stagger/shimmer) ~1–1.5s rồi vào studio.
- Studio: thay layout cũ bằng **canvas dải component** (nút, ô nhập, thẻ/nhãn, alert, tab, khối bài, quiz —
  render theo theme) + panel phải tab **Chung** (token cũ) / **Thành phần** (chỉnh riêng component đang chọn:
  bo góc nút, đổ bóng thẻ…) + **ô AI sửa nhanh** ở đáy (mock: ánh xạ lời → patch token).
- Course mode vào thẳng studio. CRUD giữ nguyên.

## Lesson builder (`course-builder.tsx` + `ai-assistant-panel.tsx`)
- Bỏ `<Link Dàn ý>`; chuyển nút Giao diện sang cụm trái header, mở **CourseThemePicker** (popup chọn UI System
  từ kho) → `useCourseTheme.setTheme(courseId, theme)`.
- MODES mới (4) + `mode: AiChatMode | null` mặc định null. "Tạo dàn ý khoá học" = generateCourseOutline + áp cây.
  "Tạo nội dung bài học" = fill bài đang chọn (như full-lesson cũ). Bỏ courseChoice 2-nút.
- Quick-add: render storyboard/ui dưới dạng **nút "+" ↔ card** (đã chọn → card có ✕).

## AI inline (`bubble-toolbar.tsx` + `companionEdit`)
- Thêm cỡ chữ (TipTap TextStyle/FontSize hoặc mark inline-style), nút "Soạn lại" (companion action mới `rewrite`),
  ô "Hỏi AI…" (companion `customPrompt`). Cập nhật mock-client tương ứng.

## Ràng buộc & gates
- Không backend, mock-only. MobiFone Untitled UI: token-only, không hex/màu tuỳ tiện, sentence case, "bạn", không emoji UI.
- Gates: tsc, vitest (giữ 271 xanh — `bubble-toolbar.test.tsx` phải còn pass), build, SSR 200.
