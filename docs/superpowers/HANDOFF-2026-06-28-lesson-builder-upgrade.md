# HANDOFF — Nâng cấp Lesson Builder (TalentLMS-parity) + 2 luồng tạo khóa học

> Tài liệu bàn giao để **tiếp tục ở một đoạn chat khác**. Tóm tắt toàn bộ việc đã làm, trạng thái git, quyết định đã chốt, vị trí mọi thứ, và điểm tiếp nối.
> Ngày: 2026-06-28 · Repo: `gk-content-forge` (TanStack Start + React 19 + Tailwind v4 + shadcn/ui + Zustand v5).

---

## 0. TL;DR

- Đã brainstorm (đối chiếu **TalentLMS 2026** qua NotebookLM) → spec 4 phase → **thực thi tự động toàn bộ 4 phase** + thêm tính năng **2 luồng tạo khóa học**.
- Tất cả nằm trên nhánh **`feat/lesson-builder-phase-0`** — **45 commit local**, **CHƯA push, CHƯA merge `main`** (`main` = `17fa550`, còn nguyên). HEAD = `06ea40b`.
- Gate xanh: `npx tsc --noEmit` ✅ · `npm run test` (vitest) **271 tests** ✅ · `npm run build` ✅.
- Mỗi task qua chu trình **subagent-driven**: implement → review (spec+quality) → fix → re-verify. 4 final-review cấp phase (opus).
- AI **mock-only** (không API/backend) — theo quyết định đã chốt.

---

## 1. Bối cảnh & nguồn

- **Mục tiêu:** nâng cấp lesson builder của "Trường học số" cả về **visual** lẫn **tính năng** theo hướng TalentLMS, + theming cá nhân hóa kiểu Claude-design + AI workflow storyboard-first.
- **Đối chiếu TalentLMS:** qua MCP NotebookLM, notebook *"TalentLMS 2026 Pricing Plans and LMS Platform Comparison"* (41 nguồn). Dữ liệu đã chắt lọc: `(scratchpad)/talentlms-distilled.md` (tạm; nếu mất cứ hỏi lại NotebookLM).
- **Artifact trình bày brainstorm:** https://claude.ai/code/artifact/b1b8f544-81a8-4066-93d8-3b0f5737c5df
- **Spec thiết kế (4 phase):** `docs/superpowers/specs/2026-06-27-lesson-builder-upgrade-design.md`
- **Plans triển khai:** `docs/superpowers/plans/2026-06-27-lesson-builder-phase-0-foundation.md`, `…-phase-1-builder-learner-loop.md`, `…-phase-2-ai-mock-storyboard.md`, `…-phase-3-theming-reuse.md`
- **Ledger thực thi (resume map):** `.superpowers/sdd/progress.md` (ghi từng task: commit range + review clean + minor deferred). Lưu ý: thư mục `.superpowers/` là scratch git-ignored — đừng `git clean -fdx`.
- **Memory dự án:** `lesson-builder-upgrade-plan` (đã cập nhật trạng thái tất cả phase).

---

## 2. Quyết định đã chốt (ĐỊNH HÌNH MỌI THỨ — giữ nguyên khi tiếp tục)

1. **Ưu tiên publish-loop + builder trước**, AI sau.
2. **AI CHỈ mock-data, KHÔNG dùng API/backend.** Giữ interface `AiClient` (1 swap-point `src/lib/ai/index.ts` → `aiClient = mockAiClient`) để tương lai cắm `serverAiClient` chỉ đổi 1 dòng. ⇒ **toàn bộ client-first, không có backend nào.**
3. **Theming per-course tách đôi:** token foundation (Phase 0) → gallery + custom editor (Phase 3).
4. **Chấm điểm:** MC-family auto (pure `gradeQuestion`) trước; free-text/essay để sau (Phase 4).
5. **Git:** làm trên nhánh, **commit local từng task**, **KHÔNG push, KHÔNG merge main** (preference local-first của chủ dự án). Muốn gộp thành 1 diff chưa-commit: `git reset --soft main`.

---

## 3. 3 lỗi gốc rễ đã sửa (phát hiện khi đọc code)

1. **Vòng tác giả→người học bị ĐỨT:** màn học `student-learn.tsx` render hằng số `SECTIONS` hardcode ("Mệnh đề"), `publish()` không snapshot blocks. → **Đã sửa (Phase 1):** publish snapshot + render nội dung thật.
2. **Persist phá dữ liệu:** `useQuiz` không persist; `useCourse`/`useContent` có `migrate: () => wipe`. → **Đã sửa (Phase 0):** persist + migrate không hủy (`mergeContentItems`, `courseMigrate`).
3. **Design-system drift:** màu Tailwind thô trong builder. → **Đã dọn (Phase 0/1):** tokenize.

---

## 4. Đã xây gì — theo phase

### Phase 0 — Nền tảng & quick-win (HEAD lúc đó `4d7358c`)
- Persist `useQuiz` (`partialize`, bỏ `Set` khỏi persist).
- Migrate **không hủy** cho content (`src/lib/stores/merge-content.ts` `mergeContentItems`) + course (`courseMigrate` trong `src/stores/course.ts`).
- Lớp token `src/styles/untitled/course.css`: `--callout-*`, `--code-surface/-ink`, `--course-*` (fallback về token global) + expose qua `@theme inline` trong `src/styles.css`.
- De-hardcode `block-card.tsx`/`page-canvas.tsx`/`course-ai-panel.tsx` → token.
- Preview đa thiết bị: `src/lib/preview/viewport.ts` + segmented control (desktop/tablet/mobile) trong `course-builder.tsx`.
- Repository interface: `src/lib/repositories/types.ts` + `local.ts` (`ContentRepository`/`CourseRepository`/`ThemeRepository`). Theme-resolve stub `src/lib/theme/resolve.ts`. Bọc `data-course-theme` trên root canvas.

### Phase 1 — Builder hoàn chỉnh + màn học thật ⭐ (HEAD `7e8d362`)
- **`<BlockRenderer mode="preview"|"learn">` dùng chung** (`src/components/blocks/block-renderer.tsx` + `block-views.tsx`) — gom 2 path read-only về một nguồn (trích từ `PageCanvas`).
- **Publish snapshot:** `src/lib/publish/snapshot.ts` (`snapshotCourse` deep-clone, `hashBlocks`); `ContentItem.publishedSnapshot?`; `content.publish(id, args, snapshot?)`; `publish-sheet` truyền snapshot.
- **Màn học render thật:** `student-learn.tsx` xoá `SECTIONS`/`LearnQuestion`, render `publishedSnapshot` qua `<BlockRenderer mode="learn">` + section gating.
- **WYSIWYG:** `src/components/blocks/bubble-toolbar.tsx` (TipTap `BubbleMenu` từ `@tiptap/react/menus`) trong TextBlockEditor.
- **Chấm điểm:** `src/lib/assessment/grade.ts` (`gradeQuestion` MC) + `src/stores/attempts.ts` (`useAttempts` persist).
- **Block tương tác mới:** accordion, process, flashcards + PDF viewer (mở rộng `embed`) — wiring đủ 6 chỗ; `cloneBlockDeep` deep-copy.
- **Per-lesson publish:** `CourseLesson.publishedAt/publishedHash`, `publishLesson`/`getLessonPublishState`, badge trong lesson-strip/structure-drawer.
- **Export PDF/in:** `src/styles/print.css` + nút "In / Xuất PDF".

### Phase 2 — AI storyboard-first (MOCK-only) (HEAD `cf308fe`)
- `src/lib/ai/types.ts` (`AiClient` + DTO) + `src/lib/ai/mock-client.ts` (`mockAiClient` deterministic, Zod-validate) + `src/lib/ai/index.ts` (`aiClient` swap-point).
- `src/stores/storyboard.ts` (`useStoryboard`) + `CourseAiPanel` rebuild thành storyboard surface (intake → dàn ý sửa/kéo-thả được).
- Agentic fill: `src/lib/ai/fill-orchestrator.ts` (`fillStoryboard` → `addBlock`/`updateBlock`, block gắn `aiGenerated:true`); "AI (demo)" chip.
- Content Companion (rút gọn/mở rộng/đổi giọng/sửa) trong BubbleMenu.
- Điểm chất lượng thật: `src/lib/publish/analyze.ts` (`analyzeContent`) thay 92% giả; quiz-from-content (mock) trong `quiz/ai-panel.tsx`; dán văn bản → dàn ý.

### Phase 3 — Theming + reuse + analytics (HEAD `5bd55f3`)
- **Theme engine:** `src/lib/theme/color.ts` (WCAG: contrast/accessibleInk/ramp/mix), `resolve.ts` thật (`getResolvedThemeVars` → map `--course-*` incl. font/surface/ink/accent-fg/soft-ink), `src/lib/theme/system-themes.ts` (6 preset + `FONT_PAIRS` CSP-safe), `src/stores/course-theme.ts` (`useCourseTheme` persist). Áp scoped vars inline style trên `data-course-theme` (canvas/preview/student-learn) — KHÔNG rò app chrome.
- **Gallery + custom editor:** `src/components/course/theme-panel.tsx` (live preview cards + accent picker với guardrail tương phản AA, font/radius/density, dark) — nút "Giao diện" trong builder header.
- **Reuse:** `src/stores/question-library.ts` (`useQuestionLibrary`) + UI "Lưu/Chèn từ thư viện" trong quiz builder; **linked-material live-resolve** trong `EmbedView` (đọc material hiện tại từ `useContent`, có stale-state).
- **Thumbnail-from-theme:** `src/lib/theme/thumbnail.ts`; **certificate** `src/components/student/certificate.tsx` (in được, theo theme).
- **Analytics thật:** `src/lib/analytics/events.ts` + `src/stores/analytics-events.ts` (`useAnalyticsEvents`, cap 2000) + `src/components/shared/real-activity-chart.tsx`; mock cũ gắn nhãn "demo".

### Bổ sung sau 4 phase — 2 luồng tạo khóa học (HEAD `06ea40b`)
- Bấm "Tạo Khóa học" → hộp thoại `src/components/shared/course-start-dialog.tsx` 2 nút:
  - **"Tiếp tục bài giảng đang dở"** → builder seeded (như cũ).
  - **"Tạo bài giảng mới hoàn toàn"** → `useCourse.init(id, { empty: true })` (1 chương + 1 bài trống, 0 block) → **canvas trắng**.
- `init` giờ nhận `options?: { empty?: boolean }`; `emptyCourse()` helper; `ensureSeeded` forward option. Wiring trong `content-studio-shell.tsx` (`handleContinueCourse`/`handleNewBlankCourse`). Chỉ áp cho category `course`; quiz/material/book giữ nguyên.

---

## 5. Module/API mới quan trọng (để tiếp tục)

| Khu vực | Đường dẫn | Ghi chú |
|---|---|---|
| Renderer dùng chung | `src/components/blocks/block-renderer.tsx`, `block-views.tsx` | mode `preview`/`learn`; thêm block type mới phải cập nhật ở đây + 5 chỗ khác |
| Block model | `src/stores/course.ts` (`CourseBlock`, `defaultBlock`, `cloneBlockDeep`, `init(courseId, {empty?})`) | field mới đều optional/additive |
| Publish snapshot | `src/lib/publish/snapshot.ts` (`snapshotCourse`, `hashBlocks`) | snapshot deep-clone |
| Chấm điểm / attempts | `src/lib/assessment/grade.ts`, `src/stores/attempts.ts` | MC-only hiện tại |
| AI (mock) | `src/lib/ai/{types,mock-client,index,fill-orchestrator}.ts` | **swap-point** `aiClient`; thêm `serverAiClient` ở đây khi có backend |
| Storyboard | `src/stores/storyboard.ts`, `src/components/course/course-ai-panel.tsx` | |
| Theme engine | `src/lib/theme/{color,resolve,system-themes,thumbnail}.ts`, `src/stores/course-theme.ts`, `src/components/course/theme-panel.tsx`, `src/styles/untitled/course.css` | scoped `data-course-theme` |
| Reuse | `src/stores/question-library.ts`, `EmbedView` trong `block-views.tsx` | |
| Analytics | `src/lib/analytics/events.ts`, `src/stores/analytics-events.ts`, `src/components/shared/real-activity-chart.tsx` | |

**Stores persisted (localStorage):** `gk-content`, `gk-course`, `gk-quiz`, `gk-attempts`, `gk-storyboard`, `gk-course-theme`, `gk-question-library`, `gk-analytics-events`, `gk-session`, `gk-identity`. Tất cả migrate **không hủy** + default rỗng (trừ content/course có seed). Khi thêm field → optional + additive, migrate giữ dữ liệu.

---

## 6. Chạy & kiểm thử

- **Dev:** `npm run dev` (đang chạy ở `http://localhost:8082/` trong phiên này; port 8080/8081 bận). `/` → `/login`.
- **Gate:** `npx tsc --noEmit` · `npm run test` (271 tests) · `npm run build`.
- **Thử nhanh:** dashboard creator → "Tạo mới" → "Tạo Khóa học" → chọn 1 trong 2 luồng. Trong builder: gõ `/`, bôi đen text (BubbleMenu + AI), nút "Giao diện" (theme), panel AI (storyboard). Màn học sinh `/student/learn/<id>` render nội dung publish thật + chứng nhận. `/org/analytics` có card "Hoạt động học thật".
- **Quy ước:** commit tiếng Việt, no attribution; không mass-format (repo không prettier-clean); **bắt buộc MobiFone Untitled UI** (không hex/màu Tailwind thô trong className; `var(--token)`/`var(--course-*)` inline-style OK). Chạy `/mobifone-ui` trước khi viết UI.

---

## 7. Việc đã CHỦ ĐỘNG HOÃN (minor, không chặn — gợi ý làm tiếp)

- DS-drift còn sót ở component **chưa đụng tới**: `lesson-strip.tsx` (amber), `block-render.tsx`/`block-media.tsx` (`bg-[#1e1e2e]`), `course-builder.tsx` (`text-white`, gradient `from-indigo-500 to-blue-600`), `structure-drawer.tsx`, `course-palette.tsx` (`hover:bg-emerald-50`). Nên gom dọn 1 đợt.
- `mode:"auto"` của theme tạm coi như light (chưa media-query `prefers-color-scheme`).
- Test regression store (content/course) gọi helper trực tiếp, chưa qua hydration thật — cân nhắc 1 integration test.
- `lesson_complete` analytics chỉ bắn khi hoàn thành cả khóa (không per-lesson) — quyết định sản phẩm.
- `opensPerDay` chia ngày theo UTC (lệch +7 cho VN buổi tối) — nhãn demo cục bộ, chấp nhận được.
- Cert learner-name là placeholder "Học sinh" (chưa có auth/profile thật).
- Files repo mới ở mức live-resolve; chưa formalize repository riêng.

## 8. Phase 4 (CHƯA làm — cần backend thật)
AI thật (`serverAiClient` qua `createServerFn` + key server-side — khung đã có ở `src/lib/api/example.functions.ts`, `config.server.ts`), đồng bộ đa thiết bị, analytics dashboard thật, manual grading + free-text/essay scoring, collaboration. Gated trên backend + auth thật (thay Netflix-profile mock).

---

## 9. Cách tiếp tục ở chat mới

1. Mở repo, `git checkout feat/lesson-builder-phase-0` (HEAD `06ea40b`), `npm install` nếu cần, `npm run dev`.
2. Đọc file này + `.superpowers/sdd/progress.md` (ledger) + spec/plans ở `docs/superpowers/`.
3. Giữ **5 quyết định ở §2** (đặc biệt: AI mock-only, không push/merge main).
4. Nếu muốn merge lên main: tự `git checkout main && git merge feat/lesson-builder-phase-0` (chưa làm tự động).
5. Việc tiếp theo gợi ý: dọn DS-drift §7, hoặc Phase 4 (backend + AI thật), hoặc tinh chỉnh 2 luồng tạo khóa học theo ý bạn.

---

*Tài liệu này do phiên làm việc tự động tạo. Mọi commit là local trên `feat/lesson-builder-phase-0`; `main` chưa bị đụng.*
