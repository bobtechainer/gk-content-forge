# Lesson Builder — Phase 1 (Builder hoàn chỉnh + màn học thật) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Đóng vòng tác giả→người học: một `<BlockRenderer mode>` duy nhất render cho edit/preview/learn; publish snapshot blocks thật; màn học render nội dung thật (xoá `SECTIONS` hardcode); thêm WYSIWYG, chấm điểm, block tương tác, per-lesson publish, export.

**Architecture:** Trích renderer dùng chung qua block registry (1 nguồn). Publish ghi snapshot blocks vào `ContentItem`. Màn học đọc snapshot → render qua BlockRenderer. Client-first (Zustand+localStorage), không backend.

**Tech Stack:** React 19, TanStack Router, Tailwind v4 tokens, shadcn/ui, Zustand v5 (persist), TipTap, Vitest.

## Global Constraints
- MobiFone Untitled UI: KHÔNG hex/màu Tailwind thô/`bg-[#...]` trong component; token-driven; tái dùng `src/components/ui/`. Dùng token Phase 0 (`bg-callout-*`, `bg-code-surface`, `bg-success`, `bg-destructive`, `text-primary-foreground`).
- State persist mới: optional + additive; migrate KHÔNG hủy (theo pattern Phase 0: `courseMigrate`/`mergeContentItems`).
- Mọi block type render qua **một** `<BlockRenderer>` — không tạo path render thứ tư.
- Gate mỗi task: `npx tsc --noEmit` · `npm run test` · `npm run build`. Test persist/DOM cần `// @vitest-environment jsdom`.
- Commit local trên nhánh `feat/lesson-builder-phase-0` (KHÔNG push, KHÔNG merge main). Vietnamese msg, no attribution. Không mass-format.

---

## File Structure
**Tạo mới:**
- `src/components/blocks/block-renderer.tsx` — `<BlockRenderer block mode onUpdate? interactive? />` dùng chung. Render read-only (preview/learn) cho mọi block type; mode="edit" delegate sang editor.
- `src/components/blocks/block-views.tsx` — các view read-only thuần (text/callout/code/math/quiz/columns/embed/video/image/divider/section) trích từ `PreviewBlock`.
- `src/lib/assessment/grade.ts` + `.test.ts` — `gradeQuestion()` pure.
- `src/stores/attempts.ts` + `.test.ts` — `useAttempts` (persist).
- `src/lib/publish/snapshot.ts` + `.test.ts` — `snapshotCourse()` + `hashBlocks()` pure.
- `src/components/blocks/bubble-toolbar.tsx` — TipTap BubbleMenu (format).

**Sửa:**
- `src/stores/course.ts` — `CourseLesson.publishedAt/publishedHash`; `publishLesson`/`getLessonPublishState`; thêm block types mới + `defaultBlock` + `cloneBlockDeep`.
- `src/stores/content.ts` — `publish()` ghi `publishedSnapshot` (course data) + `publishedAt`.
- `src/lib/types.ts` — `ContentItem.publishedSnapshot?: PublishedCourse`.
- `src/components/course/page-canvas.tsx` — dùng `<BlockRenderer mode="preview">` thay `PreviewBlock`.
- `src/components/course/block-card.tsx` — TextBlockEditor thêm BubbleMenu; thêm editor cho block mới.
- `src/components/student/student-learn.tsx` — render snapshot thật qua `<BlockRenderer mode="learn">`; xoá `SECTIONS`/`LearnQuestion`.

---

## Task 1: Shared `<BlockRenderer>` + read-only block views (KEYSTONE)

**Files:**
- Create: `src/components/blocks/block-views.tsx`, `src/components/blocks/block-renderer.tsx`
- Test: `src/components/blocks/block-renderer.test.tsx`
- Modify: `src/components/course/page-canvas.tsx` (dùng renderer mới ở preview)

**Interfaces:**
- Produces: `function BlockRenderer({ block, mode, onQuizResult }: { block: CourseBlock; mode: "preview" | "learn"; onQuizResult?: (correct: boolean) => void }): JSX.Element | null` — render read-only mọi block type. (mode "edit" KHÔNG thuộc renderer này — editor vẫn ở block-card; renderer thống nhất hai path read-only preview+learn, vốn là nguồn drift chính.)
- `block-views.tsx` exports các view thuần: `TextView`, `CalloutView`, `CodeView` (dùng `CodeHighlight`), `MathView`, `QuizView` (interactive, nhận `onResult`), `ColumnsView` (đệ quy `BlockRenderer`), `EmbedView`, `VideoView`, `ImageView`. Tái dùng các component sẵn có (`VideoEmbed`, `CodeHighlight`, `MathPreview`, `HtmlEmbed`) từ page-canvas (trích ra hoặc import).

- [ ] **Step 1: Viết test thất bại** — `src/components/blocks/block-renderer.test.tsx`
```tsx
// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BlockRenderer } from "./block-renderer";
import type { CourseBlock } from "@/stores/course";

const blk = (b: Partial<CourseBlock>): CourseBlock => ({ id: "b1", type: "text", content: "", ...b }) as CourseBlock;

describe("BlockRenderer (read-only)", () => {
  it("renders text HTML content", () => {
    render(<BlockRenderer block={blk({ type: "text", content: "<p>Xin chào</p>" })} mode="preview" />);
    expect(screen.getByText("Xin chào")).toBeInTheDocument();
  });
  it("renders a callout with its text", () => {
    render(<BlockRenderer block={blk({ type: "callout", content: "Ghi nhớ", calloutVariant: "tip" })} mode="learn" />);
    expect(screen.getByText("Ghi nhớ")).toBeInTheDocument();
  });
  it("returns null for a section marker", () => {
    const { container } = render(<BlockRenderer block={blk({ type: "section", content: "Phần 2" })} mode="preview" />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy test — FAIL** · `npm run test -- src/components/blocks/block-renderer.test.tsx` (module not found). Cần `@testing-library/react` + `@testing-library/jest-dom` (đã có trong devDeps). Nếu `toBeInTheDocument` lỗi, thêm `import "@testing-library/jest-dom";` đầu file test.

- [ ] **Step 3: Trích read-only views** — `src/components/blocks/block-views.tsx`. Copy NGUYÊN logic render từ `page-canvas.tsx` `PreviewBlock` (lines 113-190) + `QuizPreview` (60-108) + helpers (`VideoEmbed`, `CodeHighlight`, `MathPreview`, `HtmlEmbed`, `LayoutWrapper`) — move chúng vào đây và export. Giữ y nguyên className token (đã sạch sau Phase 0). Columns view gọi `BlockRenderer` đệ quy (import từ block-renderer).

- [ ] **Step 4: Viết `block-renderer.tsx`** — switch theo `block.type` trả view tương ứng; `section` → null; `divider` → `<hr>`; bọc `LayoutWrapper`. Truyền `onQuizResult` xuống `QuizView`. Mode "learn" vs "preview" khác biệt nhỏ: ở learn có thể tắt animation; Phase 1 cho 2 mode dùng chung view, `mode` chỉ ảnh hưởng wrapper (no-op khác biệt giờ — giữ tham số cho tương lai).

- [ ] **Step 5: Chạy test — PASS**

- [ ] **Step 6: Thay `PreviewBlock` trong `page-canvas.tsx`** bằng `<BlockRenderer mode="preview" .../>`. Xoá `PreviewBlock`/`QuizPreview` cũ (giờ ở block-views) — import từ block-views/renderer. Giữ `PreviewJourney`/`partitionSections`/gating nguyên (chỉ đổi phần render mỗi block). Verify preview builder vẫn chạy (`npm run dev` sanity).

- [ ] **Step 7: Gate + commit** — `tsc`/`test`/`build` PASS. Self-check grep màu thô trên 3 file mới + page-canvas = rỗng. Commit `feat: trích BlockRenderer dùng chung cho preview/learn`.

---

## Task 2: Publish snapshot + màn học render nội dung thật (KEYSTONE)

**Files:**
- Create: `src/lib/publish/snapshot.ts`, `src/lib/publish/snapshot.test.ts`
- Modify: `src/lib/types.ts` (`ContentItem.publishedSnapshot?`), `src/stores/content.ts` (`publish` ghi snapshot), `src/stores/course.ts` (helper lấy courseData), `src/components/student/student-learn.tsx` (render thật), `src/components/publish-sheet.tsx` (truyền courseData khi publish)

**Interfaces:**
- Produces: `interface PublishedCourse { lessons: { id: string; title: string; blocks: CourseBlock[] }[]; publishedAt: number }`; `snapshotCourse(data: CourseData): PublishedCourse` (deep-clone blocks via `cloneBlockDeep` để snapshot không đổi khi tác giả sửa tiếp); `ContentItem.publishedSnapshot?: PublishedCourse`. `publish(id, args, snapshot?: PublishedCourse)`.

- [ ] **Step 1: Test thất bại** — `snapshot.test.ts`: `snapshotCourse` trả lessons với blocks deep-cloned (sửa block gốc sau snapshot KHÔNG ảnh hưởng snapshot); `publishedAt` là số truyền vào (truyền timestamp từ caller — KHÔNG dùng Date.now trong hàm thuần để test ổn định: chữ ký `snapshotCourse(data, now: number)`).
```ts
import { describe, expect, it } from "vitest";
import { snapshotCourse } from "./snapshot";
import type { CourseData } from "@/stores/course";
const data: CourseData = { chapters: [], lessons: [{ id: "l1", title: "Bài 1", chapterId: "c", blocks: [{ id: "b", type: "text", content: "X" } as any] }] };
describe("snapshotCourse", () => {
  it("deep-clones blocks so later edits don't mutate the snapshot", () => {
    const snap = snapshotCourse(data, 1000);
    data.lessons[0].blocks[0].content = "CHANGED";
    expect(snap.lessons[0].blocks[0].content).toBe("X");
    expect(snap.publishedAt).toBe(1000);
  });
});
```
- [ ] **Step 2: FAIL** · **Step 3:** implement `snapshot.ts` (map lessons, `blocks: blocks.map(cloneBlockDeep)` — import `cloneBlockDeep` from course store; note cloneBlockDeep makes fresh ids — for a snapshot that's fine). **Step 4: PASS.**
- [ ] **Step 5:** `src/lib/types.ts` — add `publishedSnapshot?: PublishedCourse` to `ContentItem` (import type). **Step 6:** `content.ts` `publish` — accept optional `snapshot` arg, set `publishedSnapshot: snapshot, ` and (reuse existing fields). Keep migrate non-destructive (no version bump needed — additive optional field).
- [ ] **Step 7:** `publish-sheet.tsx` — when calling `publish(...)`, pass `snapshotCourse(useCourse.getState().courseData[courseId], performance.now()|Date.now())`. (Date.now allowed in app code, not in tests.)
- [ ] **Step 8 (KEYSTONE):** `student-learn.tsx` — DELETE `SECTIONS`, `LearnQuestion`, `LearnSection` and the hardcoded render. Read `const item = useContent(s => s.items.find(i => i.id === contentId))`; render `item.publishedSnapshot.lessons` blocks via `<BlockRenderer mode="learn">`. Keep the progress/localStorage + section-gating UX but drive it from real blocks (reuse `partitionSections` on the snapshot blocks). If no snapshot (older items), show an empty state "Nội dung chưa được xuất bản".
- [ ] **Step 9:** Test (jsdom) student-learn renders a snapshot block. Gate + commit `feat: publish snapshot + màn học render nội dung thật (xoá SECTIONS hardcode)`.

---

## Task 3: WYSIWYG — TipTap BubbleMenu (format)

**Files:** Create `src/components/blocks/bubble-toolbar.tsx`; Modify `src/components/course/block-card.tsx` (TextBlockEditor).
**Interfaces:** `function BubbleToolbar({ editor }: { editor: Editor }): JSX.Element` — floating toolbar: B/I/U, H2/H3, bullet/ordered list, link, inline code. Uses `BubbleMenu` from `@tiptap/react`.

- [ ] **Step 1-2:** Test (jsdom) renders TextBlockEditor, assert a bold button with `aria-label="Đậm"` appears (BubbleMenu renders in DOM). (If BubbleMenu portal makes assertion hard, assert `BubbleToolbar` renders given a mock editor with `isActive`/`chain` stubs — pure-ish component test.)
- [ ] **Step 3:** Implement `bubble-toolbar.tsx` using shadcn `ToggleGroup`/`Button` icon buttons (lucide Bold/Italic/Underline/Heading2/Heading3/List/ListOrdered/Link/Code), each `editor.chain().focus().toggleX().run()`, active state via `editor.isActive(...)`. Tokens only.
- [ ] **Step 4:** Wire into `TextBlockEditor`: add `<BubbleToolbar editor={editor} />` inside the editor render (BubbleMenu handles positioning). Keep existing config.
- [ ] **Step 5:** PASS + gate + commit `feat: thanh định dạng nổi (BubbleMenu) cho block văn bản`.

---

## Task 4: Chấm điểm `gradeQuestion` + `useAttempts` (persist)

**Files:** Create `src/lib/assessment/grade.ts`+test, `src/stores/attempts.ts`+test. Modify `student-learn.tsx` (record attempts) + the quiz block in BlockRenderer/QuizView (report result).
**Interfaces:**
- `type GradeResult = { correct: boolean; score: number; max: number }`; `gradeQuestion(q: { quizOptions?: string[]; quizCorrect?: number }, answer: number | null): GradeResult` — MC: correct if `answer === quizCorrect`, score 1/0. (Phase 1 = MC-family only per spec decision #4.)
- `useAttempts`: `record(lessonId, blockId, result)`, `getByLesson(lessonId)`, persisted `"gk-attempts"` v1, default `{}`, non-destructive migrate.

- [ ] **Step 1-4 (grade):** TDD `gradeQuestion` — tests: correct answer → `{correct:true,score:1,max:1}`; wrong → `{correct:false,score:0,max:1}`; null answer → `{correct:false,score:0,max:1}`. Implement pure.
- [ ] **Step 5-8 (attempts):** TDD `useAttempts` (jsdom): `record` then `getByLesson` returns it; persisted under `gk-attempts`; partialize the record map. Non-destructive migrate (identity).
- [ ] **Step 9:** Wire: in `student-learn`, when a quiz block reports a result, call `useAttempts.record(...)` and use `gradeQuestion` for scoring/summary. Gate + commit `feat: engine chấm điểm MC + store lưu lượt làm (useAttempts)`.

---

## Task 5: Block tương tác mới — accordion, process, flashcards, PDF viewer

**Files:** Modify `src/stores/course.ts` (types + `defaultBlock` + `cloneBlockDeep`), `block-views.tsx` (read-only views), `block-card.tsx` (editors), `course-palette.tsx` + `BLOCK_META`/`BLOCK_TYPES` (palette entries).
**Interfaces:** extend `CourseBlock` (all optional, additive — no migrate):
```ts
accordionItems?: { id: string; title: string; body: string }[];
processSteps?: { id: string; title: string; body: string }[];
flashcards?: { id: string; front: string; back: string }[];
embedUrl?: string; embedAspect?: "16:9" | "4:3" | "auto";   // PDF/web viewer via existing `embed` type extension
```
- [ ] For EACH new type (`accordion`, `process`, `flashcards`) wire ALL 6 spots: `CourseBlockType` union, `BLOCK_TYPES`, `BLOCK_META` (icon+label+color token), `defaultBlock`, editor in block-card, read-only view in block-views (+ register in BlockRenderer switch). `cloneBlockDeep` must deep-copy the new arrays.
- [ ] PDF viewer: extend `embed` view to render an `<iframe>` when `embedUrl` is a PDF/URL (sandboxed), aspect via token sizes.
- [ ] TDD: `cloneBlockDeep` deep-copies `accordionItems`/`processSteps`/`flashcards` (fresh arrays, edits don't alias). Add to course.test.ts.
- [ ] One commit per block type (or one cohesive commit): `feat: block accordion/process/flashcards + PDF viewer`. Gate each.

---

## Task 6: Per-lesson publish state + badge

**Files:** Modify `src/stores/course.ts` (`CourseLesson.publishedAt?/publishedHash?`, `publishLesson`, `getLessonPublishState`), `src/lib/publish/snapshot.ts` (`hashBlocks`), `lesson-strip.tsx`/`structure-drawer.tsx` (badge), `course-builder.tsx` ("Xuất bản thay đổi").
**Interfaces:** `hashBlocks(blocks: CourseBlock[]): string` (stable JSON hash); `getLessonPublishState(courseId, lessonId): "never" | "published" | "dirty"`.
- [ ] TDD `hashBlocks` (same blocks → same hash; changed → different) + `getLessonPublishState` logic. Badge: xám=never, `bg-success`=published-clean, `bg-warning`=dirty. Gate + commit.

---

## Task 7: Export PDF / in (print)

**Files:** Create `src/lib/export/print.css` (print stylesheet) + a "In / Xuất PDF" button in the learner/preview view that calls `window.print()` after rendering blocks via BlockRenderer in a print-friendly container.
- [ ] Add print stylesheet (hide chrome, show content). Button triggers `window.print()`. Manual/visual verify. Gate + commit `feat: in / xuất PDF bài học qua print-stylesheet`.

---

## Self-Review
- Spec §Phase 1 (1.1–1.7) → Tasks 1–7. ✓
- Keystone (author→learner loop) = Tasks 1+2; everything else builds on the shared renderer.
- Type consistency: `BlockRenderer`, `snapshotCourse`, `PublishedCourse`, `gradeQuestion`, `useAttempts`, `hashBlocks` used consistently.
- Risk: deleting `SECTIONS` must not break the student route — Task 2 Step 8 replaces render fully + empty-state fallback.

## Execution: subagent-driven, local commits on `feat/lesson-builder-phase-0`, no push/merge.
