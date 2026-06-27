# Lesson Builder — Phase 2 (AI storyboard-first, mock-data) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Trải nghiệm AI soạn bài **storyboard-first** thật (intake → AI sinh storyboard duyệt được → agentic fill từng block → refine), nhưng dữ liệu do **`mockAiClient`** sinh ra (KHÔNG gọi API, không backend). Để sẵn interface `AiClient` cho `serverAiClient` tương lai. Thay 3 mock cũ (course AI panel, quiz AI panel, publish-sheet điểm giả 92%).

**Architecture:** UI gọi một `AiClient` (typed) — Phase 2 chỉ có `mockAiClient` (template theo môn/lớp/blockType, validate shape bằng Zod). `useStoryboard` (ephemeral) giữ plan. Orchestrator client duyệt storyboard, gọi `useCourse.addBlock/updateBlock` lần lượt (giả lập streaming bằng setTimeout). Client-first.

**Tech Stack:** React 19, Zustand v5, Zod, Vitest, TipTap (BubbleMenu từ Phase 1).

## Global Constraints
- AI = mock-data only. KHÔNG `fetch`/Anthropic/API key. Mọi nội dung AI gắn nhãn **"AI tạo (demo) — cần giáo viên kiểm duyệt"**; khi publish nội dung có AI, đẩy vào trạng thái review `pending` (đã có `ownerVerified` logic trong `content.publish`).
- MobiFone Untitled UI tokens only (no hex/palette/`bg-[#...]`); reuse `src/components/ui/`. Re-skin các panel mock cũ sang token trong cùng đợt (chúng đang vi phạm: `bg-blue-*` v.v. đã dọn ở Phase 0 cho course-ai-panel — kiểm lại quiz/ai-panel + publish-sheet).
- Persist mới: optional+additive, migrate không hủy. `useStoryboard` mặc định rỗng (không seed).
- `blockType` AI sinh phải ∈ tập CourseBlockType thật; mock map đúng field `defaultBlock`. Validate Zod + bỏ item lỗi (mock không nên lỗi, nhưng giữ guard).
- Gate: tsc + vitest + build. Commit local `feat/lesson-builder-phase-0`, no push/merge, Vietnamese msg, no attribution.

## File Structure
**Tạo mới:**
- `src/lib/ai/types.ts` — `AiClient` interface + DTO types (`StoryboardRequest`, `Storyboard`, `StoryboardItem`, `FillRequest`, `CompanionRequest`, `QuizFromContentRequest`, `PublishAnalysis`).
- `src/lib/ai/mock-client.ts` + `.test.ts` — `mockAiClient: AiClient` (deterministic templates).
- `src/lib/ai/index.ts` — `export const aiClient = mockAiClient` (single swap point for future server client).
- `src/stores/storyboard.ts` + `.test.ts` — `useStoryboard`.
- `src/lib/ai/fill-orchestrator.ts` + `.test.ts` — pure-ish planner that maps a StoryboardItem → a `Partial<CourseBlock>` patch (used by the fill loop; testable without React).
- `src/lib/publish/analyze.ts` + `.test.ts` — `analyzeContent(blocks): PublishAnalysis` pure rubric (replaces fake 92%).

**Sửa:**
- `src/components/course/course-ai-panel.tsx` — rebuild thành storyboard surface (intake → storyboard list → "Tạo nội dung" agentic fill).
- `src/components/quiz/ai-panel.tsx` — dùng `aiClient.quizFromContent` (mock) thay mock cũ.
- `src/components/publish-sheet.tsx` — dùng `analyzeContent` (real rubric) thay điểm giả 92% + auto tags/description từ mock.
- `src/components/blocks/bubble-toolbar.tsx` — thêm cụm "AI" (rút gọn/mở rộng/đổi giọng) gọi `aiClient.companionEdit`.

---

## Task 1: `AiClient` interface + `mockAiClient` + Zod validation

**Files:** Create `src/lib/ai/types.ts`, `src/lib/ai/mock-client.ts`, `src/lib/ai/index.ts`, `src/lib/ai/mock-client.test.ts`.
**Interfaces:**
```ts
export interface StoryboardItem { id: string; blockType: CourseBlockType; intent: string; learningGoal: string }
export interface StoryboardSection { id: string; title: string; items: StoryboardItem[] }
export interface Storyboard { sections: StoryboardSection[] }
export interface StoryboardRequest { subject: string; grade: string; topic: string; objectives?: string; durationMin?: number }
export interface FillRequest { item: StoryboardItem; subject: string; grade: string; topic: string }
export interface CompanionRequest { text: string; action: "shorten" | "lengthen" | "tone-friendly" | "tone-formal" | "fix" }
export interface QuizFromContentRequest { sourceText: string; count: number }
export interface PublishAnalysis { score: number; tags: string[]; description: string; notes: string[] }
export interface AiClient {
  generateStoryboard(req: StoryboardRequest): Promise<Storyboard>;
  fillBlock(req: FillRequest): Promise<Partial<CourseBlock>>;   // patch incl. type + content + type-specific fields
  companionEdit(req: CompanionRequest): Promise<{ text: string }>;
  quizFromContent(req: QuizFromContentRequest): Promise<{ content: string; quizOptions: string[]; quizCorrect: number; quizExplanation: string }[]>;
}
```
- [ ] **Step 1-2:** TDD `mock-client.test.ts`: `generateStoryboard({subject:"Toán",grade:"Lớp 8",topic:"Phân số"})` returns ≥1 section, every item.blockType ∈ a known set, ids unique; `fillBlock` for a `text` item returns `{ type:"text", content: <non-empty html> }`; for a `quiz` item returns quiz fields (quizOptions length≥2, quizCorrect in range); `companionEdit({text:"abc",action:"shorten"})` returns shorter-or-equal text; `quizFromContent({sourceText, count:2})` returns 2 questions with valid shape. (Deterministic — no Date/random in returned DATA; if you need variety, derive from input hash, not random.)
- [ ] **Step 3:** Implement `mockAiClient`: template generators per subject/blockType. Storyboard = a sensible K-12 lesson arc (intro text → section marker → explanation text → callout tip → quiz → summary), parameterized by topic. `fillBlock` switches on `item.blockType` and returns a `Partial<CourseBlock>` whose fields match `defaultBlock(type)` shape (text→content html; callout→content+calloutVariant; quiz→quizOptions/quizCorrect/quizExplanation; flashcards→flashcards[]; process→processSteps[]; accordion→accordionItems[]; etc.), with Vietnamese template text mentioning the topic. Validate the produced object with a Zod schema before returning (guard). `index.ts`: `export const aiClient: AiClient = mockAiClient`.
- [ ] **Step 4:** PASS + gate + commit `feat: AiClient interface + mockAiClient (storyboard/fill/companion/quiz, mock-data)`.

## Task 2: `useStoryboard` store + CourseAiPanel storyboard surface

**Files:** Create `src/stores/storyboard.ts`+test; Modify `src/components/course/course-ai-panel.tsx`.
**Interfaces:** `useStoryboard`: state `{ byLesson: Record<string, Storyboard | undefined>; status: Record<string,"idle"|"planning"|"ready"|"filling"|"done"> }`; actions `setStoryboard(lessonId, sb)`, `updateItem(lessonId, sectionId, itemId, patch)`, `removeItem`, `moveItem`, `setStatus`, `clear(lessonId)`. Persist `gk-storyboard` v1 default `{byLesson:{},status:{}}`, partialize both, non-destructive migrate.
- [ ] TDD store (jsdom): setStoryboard→get; updateItem patches intent; removeItem; persisted under gk-storyboard.
- [ ] Rebuild `course-ai-panel.tsx`: an **Intake** form (chủ đề, mục tiêu — môn/lớp prefilled from the ContentItem) → "Tạo dàn ý" calls `aiClient.generateStoryboard` → store. Render the storyboard as an editable list (section titles + items showing blockType chip + intent text input + remove). A "Tạo nội dung từ dàn ý" button (enabled when storyboard ready) triggers Task 3's fill. Tokens only; reuse ui Input/Button/Card. Keep it within the existing right-panel/Sheet.
- [ ] Gate + commit `feat: useStoryboard + CourseAiPanel storyboard-first (intake → dàn ý sửa được)`.

## Task 3: Agentic fill orchestrator + Content-Companion in BubbleMenu

**Files:** Create `src/lib/ai/fill-orchestrator.ts`+test; Modify `course-ai-panel.tsx` (wire fill), `bubble-toolbar.tsx` (AI actions).
**Interfaces:** `async function fillStoryboard(args: { lessonId, courseId, storyboard, meta, addBlock, updateBlock, onProgress })` — for each item: call `aiClient.fillBlock`, `addBlock(courseId, lessonId, item.blockType)` → get blockId, `updateBlock(courseId, lessonId, blockId, { ...patch, aiGenerated: true })`, `onProgress(i)`. Sequential (await each) so block N+1 could use prior context later. (Add optional `aiGenerated?: boolean` to CourseBlock — additive — to tag AI content.)
- [ ] Add `aiGenerated?: boolean` to `CourseBlock` (course.ts, optional/additive). Render a small "AI (demo)" badge on AI blocks in edit mode (block-card) using a token chip.
- [ ] TDD orchestrator (mock addBlock/updateBlock as vi.fn): given a 2-item storyboard, it calls addBlock twice and updateBlock twice with `aiGenerated:true` and the filled patch; reports progress. (Pure logic — inject addBlock/updateBlock.)
- [ ] Wire "Tạo nội dung" in course-ai-panel to call `fillStoryboard` with `useCourse` actions; show progress; set status "filling"→"done". Use a small delay between items for UX (setTimeout/await) — optional.
- [ ] BubbleMenu AI group: add buttons "Rút gọn / Mở rộng / Thân thiện / Trang trọng / Sửa lỗi" that take the current selection text, call `aiClient.companionEdit`, and replace the selection via `editor.chain().focus().insertContent(result.text).run()` (or replace range). Tokens only; aria-labels.
- [ ] Gate + commit `feat: agentic fill storyboard + Content Companion AI (mock) trong BubbleMenu`.

## Task 4: Quiz-from-content + publish rubric (replace fake 92%)

**Files:** Create `src/lib/publish/analyze.ts`+test; Modify `src/components/quiz/ai-panel.tsx`, `src/components/publish-sheet.tsx`.
**Interfaces:** `analyzeContent(blocks: CourseBlock[]): PublishAnalysis` — REAL rubric computed from content: score from (block count, presence of quiz, has callout/tip, total text length, has section structure) → 0-100 deterministic; tags derived from subject/grade + block types present; description = a short auto summary; notes = improvement hints (e.g. "Chưa có câu hỏi kiểm tra"). NO fake constant.
- [ ] TDD `analyze.test.ts`: empty blocks → low score + note "thêm nội dung"; rich lesson (text+quiz+callout+section) → higher score; tags include detected types; deterministic (same input→same score).
- [ ] `quiz/ai-panel.tsx`: replace the mock with `aiClient.quizFromContent({ sourceText, count })` → insert generated questions into the quiz (via `useQuiz` addQuestion/updateQuestion or the panel's existing insert path). Re-skin to tokens if any raw colors remain.
- [ ] `publish-sheet.tsx`: replace the fake `92%` + fake tags/description with `analyzeContent(snapshotBlocks or courseData blocks)`; show the real score, the derived tags/description (editable), and notes. Keep the publish flow.
- [ ] Gate + commit `feat: quiz-from-content (mock) + điểm chất lượng thật khi xuất bản (thay 92% giả)`.

## Task 5 (SHOULD): paste-text → storyboard intake

**Files:** Modify `course-ai-panel.tsx` + `mock-client.ts`.
- [ ] Add a "Dán văn bản" textarea in intake; `aiClient.generateStoryboard` accepts optional `sourceText` and the mock derives a storyboard outline from the pasted text (split into sections by blank lines/headings → items). TDD the mock branch. Gate + commit `feat: dán văn bản → dàn ý (mock document import)`.

---

## Self-Review
- Spec §Phase 2 (2.1–2.5) → Tasks 1–5. ✓ AI mock-only (no API) honored throughout; `aiClient` single swap point for future server impl.
- Type consistency: `AiClient`, `Storyboard*`, `fillStoryboard`, `analyzeContent`, `useStoryboard`, `aiGenerated` used consistently.
- Safety: all AI output tagged + routed to `pending` review; deterministic mock (no random in returned data).

## Execution: subagent-driven, local commits on `feat/lesson-builder-phase-0`, no push/merge.
