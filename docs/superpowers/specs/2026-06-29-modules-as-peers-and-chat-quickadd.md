# Storyboard & UI System — module độc lập ngang hàng học liệu + nút "+" nổi trên chat

Ngày: 2026-06-29 · Nhánh: `feat/lesson-builder-phase-0`

## Vấn đề

Người dùng nhấn mạnh **module độc lập** = module đứng được mà **không phụ thuộc module khác**.
Hiện tại Storyboard và UI System tuy có store riêng + trang trình tạo + tab kho, nhưng **trang trình
tạo lại bị khoá vào một khoá học**: route `$id` là `courseId`, trang gọi `useCourse.init(courseId)`,
chọn bài trong khoá, nút quay lại là "Quay lại bài", và **không có lối tạo từ nút "Tạo mới" ở trang
chủ**. Vì vậy chúng vẫn bị cảm nhận là phụ kiện của khoá học, không phải module ngang hàng học liệu.

Ngoài ra, ở trợ lý AI của khoá học, hai mục "Thêm Storyboard / Thêm Giao diện" bị giấu trong menu
dấu "+", người dùng không biết là có thể đính kèm.

## Quyết định (đã chốt)

- **Câu 1 = A:** Module có **kho riêng** (`storyboard-library`, `ui-system-library`), **trang tạo
  riêng**, **không** đưa vào vòng đời duyệt của học liệu (không thêm `CreationCategory`, không thành
  `ContentItem`). Chúng là *khuôn mẫu/bộ giao diện dùng lại*. Khoá học chỉ là nơi **dùng** chúng.
- **Câu 2 = A:** Hai nút `⊕ Storyboard` / `⊕ Giao diện` là **chip luôn hiện ngay trên ô nhập** của
  trợ lý AI; bỏ khỏi menu "+".

## Phần A — Module ngang hàng học liệu

### A1. Hub "Tạo mới"
`MaterialTypeGrid` (dùng chung cho modal "Tạo mới" ở header và trang Studio) thêm vùng thứ 4
**"Module dùng lại"** với 2 nút `ProductButton`: *Tạo Storyboard* (icon `LayoutList`) và *Tạo Giao
diện (UI System)* (icon `Palette`). Thêm callback bắt buộc `onPickModule(module)` bên cạnh
`onPickCategory` / `onPickMaterial`. **Không** thêm `CreationCategory`.

### A2. Mở trình tạo standalone
- `useCreateContent` thêm `createModule(module)`: sinh id nháp tiền tố `mod_…` rồi `navigate` sang
  route trình tạo tương ứng (trong app, cùng tab — vì đang ở trang Studio).
- `content-studio-shell` thêm `handleCreateModule(module)`: sinh id `mod_…` rồi `window.open(...)`
  mở tab mới (giống luồng học liệu/khoá học từ modal).
- **Phát hiện standalone bằng tiền tố id** `mod_` (route component tính `standalone={id.startsWith("mod_")}`),
  không cần search param hay route mới — cô lập, ít rủi ro, không phụ thuộc trạng thái store.

### A3. Hai chế độ của trang trình tạo
`StoryboardPage` / `UiSystemPage` nhận thêm prop `standalone?: boolean`.

- **standalone** (mở từ "Tạo mới"): không gọi `useCourse.init`, không cần khoá học/bài. Storyboard
  soạn trên slot `useStoryboard.byLesson[<mod_id>]` (khoá theo chính id nháp, không gắn lesson);
  UI System sửa `CourseTheme` ở state cục bộ (vốn đã vậy). Header: tiêu đề "Trình tạo Storyboard"
  / "Trình tạo Giao diện", nút quay lại "← Thư viện" về `/{scope}/library`, **ẩn** bộ chọn bài và
  nút "Áp dụng vào bài/khoá". Hành động chính = **"Lưu vào kho"**.
- **course** (mở từ trong khoá học — đường cũ): giữ nguyên 100%.

### A4. Đóng vòng lặp
"Lưu vào kho" → toast xác nhận, ở lại trang để tiếp tục/lưu thêm; "← Thư viện" đưa về kho. Banner
tab kho (`ModuleGallery`) "Tạo mới" và footer `LibraryPicker` ("Mở kho →") đã trỏ qua lại — rà khớp.

## Phần B — 2 nút "+" nổi trên thanh chat

- Thêm **hàng quick-add ngay trên ô nhập** trong `ai-assistant-panel`: pill `⊕ Storyboard` và
  `⊕ Giao diện`, **luôn hiện**, style token (viền `border-border`, hover `border-primary`).
- Bấm chip → mở `LibraryPicker` 2 tab như cũ → **chỉ gắn thẻ** (tag-then-send giữ nguyên, không đụng
  `handleSend`).
- **Bỏ** 2 mục "Thêm Storyboard / Thêm Giao diện" khỏi menu "+"; menu "+" còn: *Chèn học liệu từ
  kho*, *Tải tệp lên*, *Tạo học liệu mới*.

## Ràng buộc & gates
- Không backend, không đụng `aiClient` swap-point. Mock-data như hệ thống thật, không nhãn "Demo".
- MobiFone Untitled UI: token-only (không hex literal trong JSX/className), sentence case, xưng "bạn",
  không emoji trong UI.
- Gates phải xanh: `npx tsc --noEmit`, `npm run test` (vitest 271), `npm run build`; SSR 200 cho
  4 route builder storyboard/ui-system + `/creator/library`.
