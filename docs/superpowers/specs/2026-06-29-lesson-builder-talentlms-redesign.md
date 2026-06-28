# Thiết kế — Lesson Builder kiểu TalentLMS + 2 trang AI riêng (Storyboard, UI System)

> Ngày: 2026-06-29 · Nhánh: `feat/lesson-builder-phase-0` · Brainstorm qua visual-companion (mockup trình duyệt).
> Quyết định do chủ dự án chốt trực tiếp (7 câu). Build tự động qua đêm, sáng xem output.

## 0. Mục tiêu

Làm lại **course/lesson builder** theo TalentLMS về cả bố cục lẫn cảm giác, + **AI trợ lý thật-sự-dùng-được** (mock), + **2 trang chuyên dụng** (Lesson Storyboard, Tạo UI System). Mọi thao tác phải ra **dữ liệu giả nhưng như hệ thống thật đang chạy** — không nhãn "Demo". Bám **MobiFone Untitled UI** (token, không hex thô). Giọng Việt **humanized**.

## 1. Quyết định đã chốt

1. **Đánh số + tác vụ block** = pill nổi cạnh phải mỗi block: `số thứ tự + ▲ + ▼ + nhân đôi + xoá + ⚙`, nhãn loại block ở cạnh trái. Hiện khi hover/chọn (TalentLMS).
2. **Bố cục**: menu **trái = cây Chương→Bài** (TalentLMS); thêm block bằng nút "+" / gõ "/" (popover palette); **bỏ thanh dưới**; menu **phải = AI**. Hai menu thu/mở có motion (hamburger ở header).
3. **Chế độ AI trong chat** (chạy trong bài): Tạo nội dung (mặc định) · Tạo cả bài theo dàn ý · Tạo câu hỏi · Tạo flashcards · **Tạo học liệu (9 loại)** · Soạn lại/cải thiện. + 2 nút mở trang riêng.
4. **Trang Storyboard** riêng — **Kanban** (Phần = cột, block = card), "Áp dụng vào bài" quay về builder & đổ nội dung.
5. **Trang UI System** riêng — **split kiểu Claude Design** (mô tả + token controls trái, preview component thật phải), "Áp dụng cho khoá học".
6. **AI chạy = hybrid**: việc lớn (cả bài, học liệu) → agentic đổ block lên canvas + nhật ký bước; việc nhỏ (1 đoạn, soạn lại) → typewriter trong chat → "Chèn".
7. **Motion = sống động**: shimmer "AI đang nghĩ", block nảy khi xuất hiện, pulse "xong". Tôn trọng `prefers-reduced-motion`.

## 2. Kiến trúc & module

### 2.1 AI mock (mở rộng, KHÔNG backend)
- `src/lib/ai/types.ts`: thêm DTO + method `generateMaterial(req)` (9 loại học liệu), `generateUiSystem(req)` (theme), `chatReply(req)` (câu trả lời hội thoại ngắn). Giữ swap-point `src/lib/ai/index.ts`.
- `src/lib/ai/mock-client.ts`: hiện thực deterministic, Zod-validate, nội dung tiếng Việt hợp lý.
- `src/lib/ai/stream.ts`: helper `streamText(full, onChunk)` + `runSteps(steps, onStep)` mô phỏng độ trễ → tạo cảm giác "đang chạy".
- `src/lib/ai/materials.ts`: bản đồ 9 loại học liệu → nội dung mẫu (tiêu đề, mô tả, preview) + ánh xạ sang `ContentItem` để lưu vào kho (`useContent.createDraft` + cập nhật).

### 2.2 Lesson builder (full-screen)
- `course-builder.tsx`: khung mới — header (hamburger trái/phải, Preview/Soạn, Giao diện, Xuất bản), thân = `LessonTree | Canvas | AiAssistantPanel`. Giữ DnD hiện có. Bỏ `LessonStrip` ở dưới.
- `lesson-tree.tsx` (mới): cây Chương→Bài thu/mở (framer-motion), chọn/đổi tên/thêm/xoá bài, badge xuất bản, kéo sắp xếp bài (tái dùng `reorderLessons`). Có nút mở `StructureDrawer` cũ cho thao tác nâng cao.
- `block-inserter.tsx` (mới): popover palette (tái dùng `BLOCK_TYPES`) cho nút "+" giữa block và lệnh "/". Giữ kéo-thả từ popover.
- Canvas: bổ sung **BlockControls pill** (số + ▲▼ + nhân đôi + xoá + ⚙) + nhãn loại ở `block-card.tsx`/`page-canvas.tsx`. Số thứ tự = vị trí trong danh sách block.
- `ai-assistant-panel.tsx` (mới, thay `course-ai-panel.tsx`): luồng chat (bong bóng user/assistant), dropdown chế độ, chip gợi ý, command bar; hybrid streaming; 2 link mở trang riêng; agentic fill dùng `fill-orchestrator`.

### 2.3 Trang Storyboard (Kanban) — `storyboard-page.tsx`
- Route: `/{creator,org}/builder/storyboard/$id` (full-screen vì chứa `/builder/`).
- Header: tên khoá + chọn bài đang dựng + "Áp dụng vào bài →".
- Intake gọn (chủ đề/mục tiêu/dán văn bản) → `aiClient.generateStoryboard` (đã có) → board: mỗi `section` = cột, mỗi `item` = card (chip loại + intent sửa được). Thêm/xoá/di chuyển card & cột; kéo-thả (dnd-kit). Lưu vào `useStoryboard.byLesson[lessonId]`.
- "Áp dụng vào bài" → `fillStoryboard` đổ block → quay lại builder.

### 2.4 Trang UI System (split) — `ui-system-page.tsx`
- Route: `/{creator,org}/builder/ui-system/$id`.
- Trái: textarea mô tả + chip phong cách + accent swatches (guardrail AA từ `theme/color.ts`) + cặp font (`FONT_PAIRS`) + bo góc + mật độ + dark; nút "✦ Sinh giao diện" (`aiClient.generateUiSystem` chọn preset gần nhất + biến thể).
- Phải: preview component thật (tiêu đề chương, văn bản, callout, nút, quiz, flashcard) áp `getResolvedThemeVars` scoped.
- "Áp dụng cho khoá học" → `useCourseTheme.setTheme(courseId, …)`.
- Tái dùng tối đa: `system-themes.ts`, `course-theme.ts`, `theme/color.ts`, `theme/resolve.ts`, `theme-panel.tsx` (tách phần controls dùng chung nếu hợp lý).

### 2.5 Điều hướng giữa các trang
- `src/lib/builder-url.ts`: thêm `storyboardHref(scope,id)`, `uiSystemHref(scope,id)`.
- AI panel có nút "Mở Storyboard →" / "Mở UI System →"; 2 trang có "← Quay lại bài".

## 3. Motion (sống động, có guardrail)
- `framer-motion`: panel trái/phải `slide + spring`; block mới `scale .6→1` (spring bounce); AI bubble fade-up; stagger 30–50ms khi đổ nhiều block.
- CSS: shimmer (AI đang nghĩ), pulse "xong" (`src/styles/untitled/course.css`, token-based). Bọc bằng `@media (prefers-reduced-motion: reduce)` để tắt.

## 4. Ràng buộc & gate
- Token-only (không `#hex`, không `bg-[...]` màu thô); tái dùng `src/components/ui/*`.
- Store migrate **không hủy**, field mới **optional/additive**.
- Gate: `npx tsc --noEmit` · `npm run test` · `npm run build` (build regen `routeTree.gen.ts`).
- Commit tiếng Việt, không attribution; không mass-format.

## 5. Ngoài phạm vi (giữ nguyên)
Backend/AI thật, đồng bộ đa thiết bị, chấm tự luận. AI vẫn **mock-only** qua swap-point.

## 6. Thứ tự thực thi
1) AI mock + stream + materials → 2) Lesson tree + khung builder → 3) Block pill + inserter → 4) AI panel → 5) Storyboard page + routes → 6) UI System page + routes → 7) Motion polish + dọn nhãn demo → 8) Gate + commit.
