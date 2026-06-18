# Bài học "wow" Tốc độ phản ứng + nâng cấp Course Builder

Ngày: 2026-06-18 · Nhánh: `feat/course-reaction-rate-wow`

## Mục tiêu

1. Mở **mọi builder** (course/book/quiz/material) ở **tab mới** với URL của builder đó.
2. Thay bài demo cũ (Hóa 10 — Bảng tuần hoàn) bằng bài **"Bài 19: Tốc độ phản ứng"** theo kịch bản hành trình 5 chặng, mỗi chặng có **widget HTML tương tác thật** (style glassmorphism, nhiều animation).
3. **Gỡ** block `reveal` (Hé lộ) và `slider` (Thanh trượt).
4. Thêm block **HTML nâng cao** (`html`) để nhúng HTML thô (mô phỏng, bảng tuần hoàn 3D…).
5. **Chia bài học theo phần** có cổng chặn: học hết 1 phần (trả lời đúng hết trắc nghiệm) mới được sang phần sau. Preview phản ánh đúng trải nghiệm thật.
6. **Sửa** bộ chọn animation để preview cuộn ra đúng hiệu ứng.
7. **Mở rộng** preview full-width cho cảm giác không gian học to hơn.
8. Toàn bộ nội dung bài học **100% tiếng Việt**, viết theo giọng giáo viên thật (skill `/humanized`).

## Hiện trạng (tham chiếu mã)

- Mô hình dữ liệu: `src/stores/course.ts` — bài học = mảng `blocks[]`; `CourseBlockType` gồm cả `reveal`, `slider`; có `BlockAnimation`.
- Palette: `src/components/course/course-palette.tsx` (`BLOCK_TYPES`).
- Editor block: `src/components/course/block-card.tsx` (`BLOCK_META`, các `*BlockEditor`, picker animation ở dòng ~155).
- Render/preview: `src/components/course/page-canvas.tsx` (`PreviewBlock`, `ScrollReveal`, preview cap `max-w-4xl`).
- Mở builder: `<Link to={builderTo(base,item)}>` trùng lặp trong `content-card.tsx`, `dashboard-view.tsx`, `content-table.tsx`; tạo mới qua `navigate()` trong `content-studio-shell.tsx`.

## Thiết kế chi tiết

### A. Mở builder ở tab mới
- File mới `src/lib/builder-url.ts`:
  - `builderHref(scope: "creator" | "org", item: ContentItem): string` → URL thật (vd `/creator/builder/course/<id>`). Gom 4 bản `builderTo` trùng lặp.
- `<Link>` mở builder thêm `target="_blank" rel="noopener"` (content-card ×2, dashboard-view ×1, content-table ×2).
- `content-studio-shell.tsx`: `handleCreateCategory` / `handleCreateMaterial` đổi `navigate(...)` → `window.open(builderHref(scope,{id,...}), "_blank", "noopener")`. zustand `persist` ghi localStorage đồng bộ nên tab mới đọc được draft.

### B. Mô hình dữ liệu (`course.ts`)
- `CourseBlockType`: **bỏ** `reveal`, `slider`; **thêm** `html`, `section`.
- `CourseBlock`: bỏ field reveal/slider (`revealPrompt`, slider*). Thêm (tùy chọn) không cần field mới — `html` dùng `content`; `section` dùng `content` làm tiêu đề phần.
- Bỏ `SliderStop`.
- `defaultBlock`:
  - `html`: `{ content: "<!-- Dán HTML tương tác -->" , layout: "full" }`.
  - `section`: `{ content: "Phần mới" }`.
- `persist`: thêm `version: 1` + `migrate` đặt `courseData: {}`, `activeLessonId: null` để nạp lại bài demo mới (data demo cũ bị thay).
- Helper xuất khẩu `partitionSections(blocks)` → `{ title: string | null; blocks: CourseBlock[] }[]` (block `section` mở đầu một phần; block trước phần đầu tiên gộp vào phần "mở đầu" không tiêu đề). Dùng cho preview + test.

### C. Component `HtmlEmbed` (`src/components/course/html-embed.tsx`)
- Render `<iframe sandbox="allow-scripts" srcDoc={...}>`; origin null để cô lập.
- `srcDoc` = (script đo chiều cao + reset CSS) + HTML người dùng. Script dùng `ResizeObserver` `postMessage({type:"gk-embed-height",height})` lên parent.
- Parent lắng nghe `message`, đối chiếu `event.source === iframe.contentWindow`, set chiều cao (min 320px trước khi nhận tin đầu).
- Dùng ở: editor `html` (preview sống), canvas edit-card, preview thật.

### D. Section + preview có cổng chặn (`page-canvas.tsx`)
- **Edit mode**: block `section` render như divider có nhãn (tiêu đề sửa được trong block-card). Mọi block hiển thị bình thường để soạn.
- **Preview mode** (stepper, đúng trải nghiệm học):
  - Dùng `partitionSections(blocks)`.
  - State `unlockedUpTo` (số phần đã mở, mặc định 0) + `quizResults: Record<blockId, boolean>`.
  - Chỉ render các phần `0..unlockedUpTo`. Phần hiện tại có footer:
    - Nếu có quiz: nút **"Tiếp tục phần sau"** khóa đến khi mọi quiz trong phần đúng; phụ đề tiến độ "Đã trả lời đúng X/Y câu".
    - Nếu không có quiz: nút **"Tiếp tục"** luôn bật.
    - Phần cuối hoàn thành: thẻ "Hoàn thành bài học".
  - Bấm tiếp tục → `unlockedUpTo++`, cuộn tới phần mới (phần mới mount → `ScrollReveal` chạy hiệu ứng vào).
  - Không section nào → 1 phần duy nhất, không cổng chặn (giữ hành vi cũ nhưng rộng hơn).
- `QuizPreview` refactor: nhận `onResult(correct)`; báo kết quả lên stepper. Chỉ quiz **cấp cao nhất** tính vào cổng chặn (quiz trong `columns` không tính).

### E. Sửa animation
- Giữ `ANIM_OPTIONS` (fade-up / parallax / hiện dần / none).
- Preview: mỗi block bọc `ScrollReveal` với `animation` của block; khi phần mới mount, block mount mới → `useInView` kích hoạt → chạy đúng hiệu ứng. Bảo đảm `key` ổn định để re-trigger theo phần.
- Editor: bản demo một-nhịp khi đổi hiệu ứng chạy đúng từng kiểu (đã có `ANIM_PREVIEW`, kiểm tra mapping `progressive`).

### F. Preview rộng hơn
- Khung preview: bỏ cap `max-w-4xl`. Root `mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10 py-10`.
- `LayoutWrapper` trong preview: `centered` → `max-w-2xl` (giữ dễ đọc); `full` → `w-full` (tràn khung 6xl ≈ 1152px, rộng hơn hẳn ~672px cũ). Widget các chặng đặt layout `full`.

### G. Palette / block-card
- Palette `BLOCK_TYPES`: bỏ reveal/slider; thêm `html` ("HTML / Tương tác", icon `Code2`/`Boxes`), `section` ("Phần mới", icon `SplitSquareVertical`).
- block-card `BLOCK_META`: cập nhật tương ứng; bỏ `RevealBlockEditor`, `SliderBlockEditor`; thêm `HtmlBlockEditor` (textarea HTML + `HtmlEmbed` preview + nút "Chèn mẫu" chèn 1 trong 5 widget), `SectionBlockEditor` (ô nhập tiêu đề, hiển thị như dải phân cách phần).

### H. Nội dung bài học (100% tiếng Việt)
File `src/stores/course-sample.ts` (tách khỏi `course.ts`) dựng:
- **Chương 1 — "Bài 19: Tốc độ phản ứng"**
  - Bài học **"Hành trình: Khám phá tốc độ phản ứng"** — 5 phần (chặng) có cổng chặn:
    1. **Cảm nhận thời gian** — văn bản dẫn nhập + widget kéo-thả thẻ (pháo hoa/than/tiêu hoá/sắt gỉ/thạch nhũ) lên trục log thời gian (sai bật lại) + 1 quiz cổng.
    2. **Giải mã đồ thị H₂O₂** — bảng số liệu + widget đường cong với cửa sổ thời gian kéo được, tam giác ΔC/Δt, `v` nhảy số real-time + công thức KaTeX + 1 quiz.
    3. **Thuyết va chạm** — widget hộp phân tử động (số hạt = nồng độ, thể tích = áp suất) đếm va chạm hiệu quả + callout + 1 quiz.
    4. **Diện tích bề mặt & Van't Hoff** — widget chẻ khối Rubik (diện tích ×2) + nhiệt kế γ (×2/×4/×8) + 2 quiz.
    5. **Năng lượng hoạt hoá & xúc tác** — widget đẩy đá vượt núi Eₐ, thêm MnO₂ mở đường hầm + callout chốt + 1 quiz.
- **Chương 2 — "Vận dụng & Ghi nhớ"**
  - Bài học **"Tốc độ phản ứng quanh ta"** — ứng dụng (hàn xì oxygen, tủ lạnh bảo quản, dưa muối) + 2–3 quiz tổng kết. (Giữ 2 chương/nhiều bài để test cross-chapter còn hiệu lực.)

5 widget đặt trong `src/lib/widgets/` (mỗi widget 1 file `.ts` export chuỗi HTML hoàn chỉnh: DOCTYPE + CSS glassmorphism + JS vanilla, requestAnimationFrame cho mô phỏng động). Toàn bộ nhãn/chữ trong widget bằng tiếng Việt.

### I. Kiểm thử (`course.test.ts` + mới)
- Giữ test cũ (sample vẫn 2 chương, lesson ở mỗi chương).
- Thêm: `partitionSections` chia đúng theo mốc `section`; `builderHref` sinh URL đúng cho 4 loại × 2 scope.

## Bất biến / xử lý lỗi
- Cập nhật bất biến (spread), không mutate.
- iframe `sandbox="allow-scripts"` cô lập; HTML lỗi chỉ hỏng trong iframe.
- KaTeX đã guard `throwOnError:false`.
- File giữ nhỏ: tách `course-sample.ts`, `widgets/*`, `html-embed.tsx`.

## Ngoài phạm vi (YAGNI)
- Không làm ô trả lời tự luận / luồng "Duyệt bài" lên dashboard (đã chốt: chỉ trắc nghiệm).
- Không refactor cấu trúc section theo Cách B/C.
