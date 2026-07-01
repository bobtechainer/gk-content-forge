# Storyboard độc lập + panel "Chèn storyboard" (tách khỏi AI)

Ngày: 2026-07-01 · Nhánh `feat/lesson-builder-phase-0` · Brainstorm (skill) → Hướng 1 được duyệt.

## Bối cảnh & vấn đề
Hiện Storyboard bị nhúng vào panel AI như **1 trong 5 loại đính kèm** (`ai-assistant-panel.tsx`
L77–82), và chỉ áp được vào **thân bài** (khối) qua `fillStoryboard`. Không có khái niệm
"dàn ý khoá học", không có panel chèn độc lập, không có bước chọn phạm vi áp.

Yêu cầu: Storyboard là **module độc lập**, chèn giống panel "Tables" (chèn bảng có sẵn) của
Google Sheets. **AI chỉ là một cách mở panel ra**, không còn chứa/đính kèm storyboard.

## Quyết định đã chốt (từ brainstorm)
1. **Một loại storyboard duy nhất**; **chọn cách áp khi chèn** (không gắn nhãn loại sẵn).
   Một `Storyboard` (`sections` + `items`) được **chiếu** thành mục lục khoá *hoặc* dàn ý bài.
2. **Panel dock bên phải** trong builder, tên **"Chèn storyboard"**.
3. Khi áp làm dàn ý bài: chọn phạm vi **Bài này / Toàn khoá**.
4. "Đưa vào mục lục của bài" = tạo **khối mục + khối nội dung** (tái dùng `fillStoryboard`).

## Kiến trúc

### Thành phần mới
- `src/components/course/insert-storyboard-panel.tsx` — dock phải "Chèn storyboard".
  - Header: tiêu đề + nút đóng (✕).
  - Thân: ô tìm kiếm; danh sách kho nhóm theo môn/nguồn (Nổi bật = preset hệ thống, rồi mục
    của người dùng). Mỗi mục: tên, mô tả ngắn, số khung, nút mở xem trước.
  - Bấm một mục → mở `PreviewConfirmDialog` với nội dung xem trước + ô chọn "Áp dụng như".
- `src/lib/storyboard/apply-storyboard.ts` — bộ định tuyến áp dụng (thuần logic, testable):
  - `applyStoryboardAsCourseOutline(sb, api)` — dựng cây khoá.
  - `applyStoryboardAsLessonOutline(sb, { scope, lessonIds, fill })` — lấp bài (1 hoặc N bài).
- `src/stores/insert-storyboard.ts` — store nhỏ (Zustand, **không persist**):
  - State: `open: boolean`, `context: "course" | "lesson"`.
  - Actions: `openPanel(context)`, `closePanel()`.
  - Dùng chung cho nút toolbar builder **và** nút trong panel AI (đây là cách "AI chỉ mở ra").

### Tái dùng nguyên trạng
- `src/components/course/preview-confirm-dialog.tsx` — `PreviewConfirmDialog` (đã dùng cho 5 luồng).
- `src/lib/ai/fill-orchestrator.ts` — `fillStoryboard({ storyboard, meta, addBlock, updateBlock })`.
- `src/stores/course.ts` — `addPart`, `addChapterUnder`, `addLessonUnder`, `addBlock`, `updateBlock`.
- `src/stores/storyboard-library.ts` — `useStoryboardLibrary`, `allStoryboardItems`, 3 preset.
- `src/lib/storyboard/scene-art.ts` — ảnh khung cho thumbnail xem trước.

### Sửa đổi
- `src/components/course/ai-assistant-panel.tsx`:
  - Bỏ nhánh `storyboard` trong union `Attachment` (L77–82) và `PickerKind` (L83).
  - Xoá `onPickStoryboard` (L268–271), nhánh fill storyboard trong `handleSend` (L428–434),
    tham chiếu storyboard ở course mode (L394–402), `runCourseOutline(storyboard?)` → bỏ tham số.
  - Xoá nút QuickAttach storyboard + `StoryboardPreviewPane` + nhánh picker storyboard trong
    `LibraryPicker`. Giữ nguyên `ui/material/book/file`.
  - Thêm mục "Chèn storyboard" trong menu "+" → gọi `useInsertStoryboard.getState().openPanel("lesson")`.
  - Cập nhật copy placeholder (bỏ "đính kèm 1 storyboard").
- `src/components/course/ai-chat-types.ts`: giữ `lessonPlan`/`lessonFilled` nếu AI vẫn có thể
  tạo storyboard → nhưng entry chuyển sang mở panel. (Ưu tiên: giữ tối thiểu, không xoá type
  đang được test tham chiếu; chỉ ngừng tạo message loại này từ nhánh attachment.)
- Nơi mount toolbar builder (course builder + lesson editor shell): thêm nút "Chèn storyboard"
  và mount `<InsertStoryboardPanel>` (điều khiển bằng `useInsertStoryboard`).

## Luồng dữ liệu (chèn)
1. Người dùng bấm "Chèn storyboard" (toolbar builder hoặc menu "+" trong AI) → `openPanel(context)`.
2. Panel liệt kê kho từ `allStoryboardItems(userItems)`, nhóm Nổi bật/của bạn, lọc theo tìm kiếm.
3. Bấm một mục → `PreviewConfirmDialog`:
   - `children`: xem trước sections/items (thumbnail + tiêu đề + mô tả).
   - Ô chọn **"Áp dụng như"**:
     - ( ) **Mục lục khoá học**
     - ( ) **Dàn ý bài học** → hiện thêm phạm vi: ( ) Bài này  ( ) Toàn khoá
   - Mặc định: `context === "course"` → "Mục lục khoá"; `context === "lesson"` → "Dàn ý bài · Bài này".
4. Bấm **Áp dụng** → gọi router tương ứng → toast kết quả → `closePanel()`.

## Ánh xạ
- **Mục lục khoá học** (`applyStoryboardAsCourseOutline`):
  mỗi `StoryboardSection` → 1 Chương (`addChapterUnder(courseId, undefined, section.title)`),
  mỗi `StoryboardItem` trong section → 1 Bài (`addLessonUnder(courseId, chapterId, item.title ?? item.intent)`).
- **Dàn ý bài — Bài này** (`applyStoryboardAsLessonOutline`, scope=`"lesson"`):
  `fillStoryboard` cho bài đang mở → khối mục (section) + khối nội dung mẫu theo `blockType`.
- **Dàn ý bài — Toàn khoá** (scope=`"course"`):
  lặp mọi `lessonId` trong khoá, gọi `fillStoryboard` từng bài. Dialog hiển thị số bài sẽ áp.

## Xử lý lỗi & biên
- Áp "Dàn ý bài" khi chưa có bài đang chọn (context course, chưa mở bài) → khoá lựa chọn đó +
  chú thích "Hãy mở một bài trước".
- Storyboard rỗng (0 item) → nút Áp dụng bị vô hiệu.
- "Toàn khoá" mà khoá 0 bài → toast "Khoá chưa có bài nào".
- Áp mục lục khoá khi cây đã có nội dung → **thêm nối tiếp** (không xoá cây cũ); ghi rõ trong copy.

## Ràng buộc & gates
- Mock-only, không backend. MobiFone Untitled UI: **chỉ token**, không hex/màu tuỳ tiện,
  sentence case, xưng "bạn", không emoji trong UI. Tuân thủ skill `/mobifone-ui`.
- Component nhỏ, tách file; tái dùng primitive trong `src/components/ui/`.
- Gates: `npx tsc --noEmit`, `npm run test` (vitest — giữ bộ test xanh, cập nhật test AI panel
  liên quan storyboard attachment), `npm run build`, SSR 200.

## Kiểm thử
- Unit `apply-storyboard.test.ts`:
  - Mục lục khoá: với storyboard N sections × M items → gọi `addChapterUnder` N lần và
    `addLessonUnder` đúng tổng số item, đúng chương cha.
  - Dàn ý bài (bài này): gọi `fillStoryboard` đúng 1 lần với `lessonId` đang mở.
  - Dàn ý bài (toàn khoá): gọi `fillStoryboard` đúng số bài của khoá.
- Unit store `insert-storyboard`: `openPanel/closePanel` đổi `open`/`context`.
- Cập nhật `ai-assistant-panel` test: bỏ kỳ vọng liên quan storyboard attachment; thêm kỳ vọng
  nút "Chèn storyboard" gọi `openPanel`.

## Phạm vi KHÔNG làm (YAGNI)
- Không thêm mục lục con lồng thật trong từng bài (giữ mô hình block hiện tại).
- Không đổi trình soạn storyboard (`storyboard-page.tsx`) ngoài việc cần thiết để tương thích.
- Không thêm trường phân loại vào `Storyboard` (một loại, chiếu khi chèn).
