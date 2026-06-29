# Thiết kế v2 — Cấu trúc Phần/Chương/Bài + Module hoá Storyboard/UI System + Chat AI rộng

> Ngày: 2026-06-29 · Nhánh `feat/lesson-builder-phase-0` · Tiếp nối commit `13ddf17`.
> Brainstorm qua visual-companion (6 câu). Chủ dự án đã duyệt; build tự động qua đêm.

## 0. Sáu quyết định đã chốt

1. **Cấu trúc = folder linh hoạt**: Phần ⊃ (Chương *hoặc* Bài); Chương ⊃ Bài; Bài = lá. Mọi cấp có thể độc lập ở gốc; Bài/Chương xen kẽ cùng cấp theo thứ tự.
2. **Thao tác cây**: thanh **＋ Phần / ＋ Chương / ＋ Bài** ở đầu cây (thêm vào mục đang chọn hoặc gốc); hover dòng → đổi tên/xoá; **kéo-thả** chuyển cấp & sắp xếp; thu/mở folder. **Bỏ hẳn "Cấu trúc nâng cao"** (StructureDrawer).
3. **Module trong Thư viện**: Storyboard & UI System là 2 loại mới trong "Thư viện của tôi" (preset hệ thống + của người dùng). Trong builder chỉ **chọn cái có sẵn** qua nút **"+"**.
4. **Chat AI**: panel phải **rộng ~420px + nút bung ⤢** ra khung lớn căn giữa (kiểu Claude); **ô nhập to** (textarea nhiều dòng, tự giãn); menu **"+"** (Thêm Storyboard · Thêm Giao diện · Chèn học liệu từ kho · Tải tệp · Tạo học liệu mới) → chip ngữ cảnh.
5. **Xuất bản**: "Xuất bản bài này" + trạng thái về **thanh ngữ cảnh của bài** trên canvas; header chỉ một CTA **"Xuất bản khoá"**.
6. **Gợi ý tiếp theo**: sau mỗi câu trả lời AI, hiện **2–3 chip** bám ngữ cảnh, **bấm chạy ngay** (mock).

## 1. Kiến trúc dữ liệu cấu trúc (bổ sung, KHÔNG phá)

Giữ nguyên `chapters[]`, `lessons[]`, `lesson.chapterId` (để `reorderLessons` + test + snapshot không đổi). **Thêm**:
- `CoursePart { id, title, order }` → mảng mới `parts?: CoursePart[]`.
- `CourseChapter.partId?: string | null` · `CourseChapter.order?: number`.
- `CourseLesson.partId?: string | null` · `CourseLesson.order?: number` (Bài thẳng trong Phần: `chapterId=null, partId=<phần>`).

**Cây dẫn xuất** `buildCourseTree(data)`:
- Cha của: lesson → `chapterId` nếu có, else `partId`, else gốc. chapter → `partId` nếu có, else gốc. part → gốc.
- Con của Part = các chapter `partId===p.id` + lesson `partId===p.id && !chapterId`; của Chapter = lesson `chapterId===c.id`. Gốc = parts + chapter `!partId` + lesson `!chapterId && !partId`. Sắp theo `order` (fallback vị trí mảng).

**Actions mới** (giữ actions cũ nguyên vẹn cho test):
- `addPart(courseId, title?)`, `addChapter` thêm tham số tuỳ chọn `partId`, `addLessonUnder(courseId, parent:{id,type})`.
- `moveNode(courseId, nodeId, nodeType, newParent:{id,type}|null, beforeId?)` → đặt lại `partId/chapterId` + đánh số lại `order` của anh em.
- `renameNode/deleteNode` định tuyến theo type (tái dùng rename/delete sẵn có).
- `migrate` thêm `parts: []` mặc định; field mới optional ⇒ dữ liệu cũ giữ nguyên.
- **snapshot giữ nguyên** (thứ tự mảng `lessons`) — học sinh không phụ thuộc Phần/Chương.

## 2. LessonTree (viết lại) + Publish theo ngữ cảnh
- `lesson-tree.tsx`: render cây 3 cấp (chip màu Phần/Chương/Bài), thanh ＋ đầu cây, hover đổi tên/xoá, kéo-thả reparent (dnd-kit), thu/mở. Badge xuất bản ở Bài.
- Bỏ import `StructureDrawer` khỏi builder (xoá file hoặc để mồ côi).
- **Thanh ngữ cảnh bài** (mới, trên canvas, chỉ chế độ Soạn): tên bài + chip trạng thái (Bản nháp/Đã xuất bản/Có thay đổi) + nút **"Xuất bản bài này"**. Header bỏ nút "Xuất bản bài", giữ "Xuất bản khoá".

## 3. Module hoá (Thư viện) — mock, store riêng
- **Store kho**: `useStoryboardLibrary` (item = `{ id, name, source: 'system'|'user', storyboard }`) + `useUiSystemLibrary` (item = `{ id, name, source, theme: CourseTheme }`). Seed vài **preset hệ thống**.
- **Trình tạo**: trang Kanban (storyboard) & trang split (ui-system) đã có — bổ sung nút **"Lưu vào kho"** (đặt tên → tạo item `source:'user'`). Mở ở chế độ tạo-item-thư-viện.
- **Thư viện của tôi**: thêm 2 bộ lọc/loại "Storyboard", "Giao diện"; "Tạo mới" (MaterialTypePicker) thêm 2 mục mở trình tạo. (Hiển thị đọc từ 2 store kho; không nhét vào `useContent` để khỏi đụng pipeline xuất bản.)
- **Builder "+" picker**: chọn item từ kho → Storyboard: `fillStoryboard` vào bài hiện tại; UI System: `useCourseTheme.setTheme`.

## 4. Chat AI rộng + "+" + gợi ý (nâng cấp `ai-assistant-panel.tsx`)
- **Khung**: mặc định panel ~420px; nút **⤢** bật chế độ "bung" → overlay căn giữa rộng (≈ 760px) nền mờ, nút thu lại. Cùng một component, đổi container.
- **Ô nhập**: textarea tự giãn 1→6 dòng, to rõ.
- **Menu "+"**: popover 5 mục. "Thêm Storyboard/Giao diện" mở picker (đọc kho) → gắn **chip ngữ cảnh** phía trên input + áp dụng. "Chèn học liệu từ kho" → picker học liệu (tái dùng). "Tải tệp" → input file (mock, chỉ hiện chip tên tệp). "Tạo học liệu mới" → mode material sẵn có.
- **Gợi ý tiếp theo**: sau mỗi message assistant hoàn tất, sinh 2–3 gợi ý theo `mode`/topic (hàm mock `followups()`); bấm → chạy ngay `runMode`.
- Trong builder: Storyboard/UI System chỉ **chọn** (không có trình tạo inline); muốn tạo mới thì mở module trong Thư viện.

## 5. Ràng buộc
Token MobiFone (không hex/màu palette thô), reuse `ui/*`; mock-only; migrate không hủy; field mới optional/additive. Gate: `tsc`, `vitest`, `vite build` phải xanh.

## 6. Thứ tự thực thi (2 GĐ, commit riêng)
- **GĐ1**: model cấu trúc (course store) → LessonTree mới → bỏ drawer → thanh xuất bản theo bài. Gate + commit.
- **GĐ2**: store kho + trình tạo "Lưu vào kho" → Thư viện + picker → chat rộng/⤢/ô nhập to/"+"/gợi ý. Gate + commit.
