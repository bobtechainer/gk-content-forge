# Lesson Builder — Phase 0 (Nền tảng & quick-win) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chống mất dữ liệu, dọn design-system drift, và đặt nền tảng (repository interface + lớp token theme + preview đa thiết bị) để các Phase 1–3 xây tiếp an toàn.

**Architecture:** Toàn bộ client-side (Zustand + localStorage, không backend). Sửa persist không hủy dữ liệu; tách logic thuần (merge, viewport, theme-resolve) ra hàm test được; bọc UI sau repository interface để sau cắm backend bằng 1 adapter.

**Tech Stack:** TanStack Start, React 19, Tailwind v4 (`@theme inline` tokens), shadcn/ui, Zustand v5 (`persist`), Vitest (globals, `environment: node`, alias `@/`).

## Global Constraints

- **Design system BẮT BUỘC (MobiFone Untitled UI):** không hex literal (`#[0-9a-fA-F]`), không màu Tailwind mặc định (`bg-blue-*`, `text-emerald-*`, `bg-amber-*`, `bg-violet-*`, `bg-red-*`, `bg-[#...]`). Chỉ dùng token semantic (`bg-primary`, `text-success`, `border-border`, `bg-brand-50`…) hoặc token mới của plan này. Chạy `/mobifone-ui` trước khi sửa UI.
- **Immutable updates** trong store (spread, không mutate) — theo pattern hiện có.
- **State persist mới phải optional + additive; migrate KHÔNG được hủy dữ liệu người dùng.**
- **Gate mỗi task:** `npx tsc --noEmit` PASS · `npm run test` PASS · (khi đụng UI/CSS) `npm run build` PASS.
- **Commit local-first:** KHÔNG tự commit/push. Mỗi task kết thúc bằng "Checkpoint" (chạy gate). Người dùng tự commit khi sẵn sàng.
- **Không mass-format** — chỉ chạm dòng bạn sửa (repo không prettier-clean).
- Test runner: `vitest`, globals bật (không cần import `describe/it/expect` nếu theo file mẫu — nhưng các file hiện có VẪN import chúng; giữ nhất quán theo `src/stores/course.test.ts`).

---

## File Structure

**Tạo mới:**
- `src/lib/stores/merge-content.ts` — hàm thuần `mergeContentItems(persisted, seed)` (gộp seed mới + giữ item người dùng).
- `src/lib/stores/merge-content.test.ts` — test cho trên.
- `src/lib/repositories/types.ts` — interface `CourseRepository`, `ContentRepository`, `QuizRepository`.
- `src/lib/repositories/local.ts` — adapter dùng store Zustand hiện có.
- `src/lib/repositories/local.test.ts` — test adapter delegate đúng.
- `src/lib/preview/viewport.ts` — hàm thuần `viewportMaxWidth(vp)` + type `Viewport`.
- `src/lib/preview/viewport.test.ts` — test.
- `src/lib/theme/resolve.ts` — hàm thuần `getResolvedThemeVars(theme?)` (Phase 0: trả map rỗng/fallback) + types `CourseThemeVars`.
- `src/lib/theme/resolve.test.ts` — test.
- `src/styles/untitled/course.css` — token `--callout-*`, `--color-code-surface`, lớp `[data-course-theme]` với `--course-*` fallback về token global.

**Sửa:**
- `src/stores/content.ts` — persist migrate/merge không hủy.
- `src/stores/course.ts` — persist migrate không hủy.
- `src/stores/quiz.ts` — thêm `persist` (partialize `questionsByQuiz`).
- `src/styles.css` — `@import "./styles/untitled/course.css";` + expose token callout/code qua `@theme inline`.
- `src/components/course/block-card.tsx` — de-hardcode `CALLOUT_STYLES`, code/html surface, section marker, columns accent.
- `src/components/course/page-canvas.tsx` — de-hardcode callout/quiz/feedback/journey colors + bọc `data-course-theme` + áp `viewportMaxWidth`.
- `src/components/course/course-ai-panel.tsx` — de-hardcode blue/emerald.
- `src/components/course/course-builder.tsx` — thêm state `viewport` + segmented control (chỉ khi preview).

---

## Task 1: Persist `useQuiz` (không mất dữ liệu mỗi reload)

**Files:**
- Modify: `src/stores/quiz.ts`
- Test: `src/stores/quiz.test.ts` (create)

**Interfaces:**
- Consumes: `useQuiz` (hiện có), `persist` từ `zustand/middleware`.
- Produces: `useQuiz` giờ persist `questionsByQuiz` dưới key `"gk-quiz"`. `blankIds` (Set, transient) KHÔNG persist.

**Bối cảnh:** `src/stores/quiz.ts:63` hiện là `create<QuizState>((set, get) => ({...}))` — không có persist → mọi câu hỏi mất khi reload. `blankIds` là `Set<string>` không JSON-serialize được → loại khỏi persist bằng `partialize`.

- [ ] **Step 1: Viết test thất bại** — `src/stores/quiz.test.ts`

```typescript
import { beforeEach, describe, expect, it } from "vitest";
import { useQuiz } from "./quiz";

function reset() {
  useQuiz.setState({ questionsByQuiz: {}, blankIds: new Set<string>() });
  localStorage.clear();
}

describe("useQuiz persistence", () => {
  beforeEach(reset);

  it("persists questionsByQuiz to localStorage under gk-quiz", () => {
    useQuiz.getState().addQuestion("quizA", "multiple_choice");
    const raw = localStorage.getItem("gk-quiz");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string);
    expect(parsed.state.questionsByQuiz.quizA).toHaveLength(1);
  });

  it("does not persist blankIds (transient Set)", () => {
    useQuiz.getState().addBlank("quizA");
    const parsed = JSON.parse(localStorage.getItem("gk-quiz") as string);
    expect(parsed.state.blankIds).toBeUndefined();
  });
});
```

- [ ] **Step 2: Chạy test — kỳ vọng FAIL**

Run: `npm run test -- src/stores/quiz.test.ts`
Expected: FAIL. `environment: "node"` của vitest config hiện tại KHÔNG có `localStorage`. → Nếu báo `localStorage is not defined`, sang Step 3 (chuyển test này sang môi trường jsdom bằng pragma).

- [ ] **Step 3: Thêm pragma jsdom cho file test** (chỉ file này, không đổi config global)

Thêm dòng đầu file `src/stores/quiz.test.ts`:
```typescript
// @vitest-environment jsdom
```
Chạy lại Step 2; giờ phải FAIL vì store chưa persist (`raw` null), không phải vì thiếu localStorage.

- [ ] **Step 4: Thêm persist vào store** — `src/stores/quiz.ts`

Sửa import (dòng 1):
```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
```
Sửa khai báo store (dòng 63) bao `persist(...)` quanh creator hiện tại và thêm options:
```typescript
export const useQuiz = create<QuizState>()(
  persist(
    (set, get) => ({
      questionsByQuiz: {},
      blankIds: new Set<string>(),
      // ... GIỮ NGUYÊN toàn bộ method hiện có (init, addQuestion, ...) ...
    }),
    {
      name: "gk-quiz",
      version: 1,
      // blankIds là Set (transient editing state) → không persist
      partialize: (s) => ({ questionsByQuiz: s.questionsByQuiz }),
    },
  ),
);
```
Lưu ý: chỉ bọc `persist(...)` và thêm options; KHÔNG đổi nội dung các method.

- [ ] **Step 5: Chạy test — kỳ vọng PASS**

Run: `npm run test -- src/stores/quiz.test.ts`
Expected: PASS (2 test).

- [ ] **Step 6: Checkpoint** — `npx tsc --noEmit` PASS · `npm run test` PASS.

---

## Task 2: Migrate content store KHÔNG hủy dữ liệu người dùng

**Files:**
- Create: `src/lib/stores/merge-content.ts`, `src/lib/stores/merge-content.test.ts`
- Modify: `src/stores/content.ts:126-133` (persist options)

**Interfaces:**
- Produces: `mergeContentItems(persisted: ContentItem[], seed: ContentItem[]): ContentItem[]` — trả `[...itemNgườiDùng, ...seedMới]`, trong đó item người dùng = item persisted có id KHÔNG thuộc seed id set; seed luôn được làm mới.

**Bối cảnh:** `src/stores/content.ts:132` hiện là `migrate: () => ({ items: SEED_CONTENT })` → **xóa sạch** item người dùng mỗi lần bump version. `SEED_CONTENT` import từ `@/lib/mock-data` (dòng 12). Mục tiêu: refresh seed (giải quyết stale-seed dev≠build) NHƯNG giữ nội dung người dùng.

- [ ] **Step 1: Viết test thất bại** — `src/lib/stores/merge-content.test.ts`

```typescript
import { describe, expect, it } from "vitest";
import { mergeContentItems } from "./merge-content";
import type { ContentItem } from "@/lib/types";

const seedItem = (id: string): ContentItem =>
  ({ id, title: `seed ${id}` }) as ContentItem;
const userItem = (id: string): ContentItem =>
  ({ id, title: `user ${id}` }) as ContentItem;

describe("mergeContentItems", () => {
  it("keeps user items (ids not in seed) and refreshes seed", () => {
    const seed = [seedItem("s1"), seedItem("s2")];
    const persisted = [userItem("u1"), { ...seedItem("s1"), title: "stale" } as ContentItem];
    const out = mergeContentItems(persisted, seed);
    expect(out.find((i) => i.id === "u1")).toBeTruthy();          // giữ user
    expect(out.find((i) => i.id === "s1")?.title).toBe("seed s1"); // seed làm mới (không stale)
    expect(out.filter((i) => i.id === "s1")).toHaveLength(1);      // không nhân đôi
  });

  it("returns user items first, then fresh seed", () => {
    const out = mergeContentItems([userItem("u1")], [seedItem("s1")]);
    expect(out.map((i) => i.id)).toEqual(["u1", "s1"]);
  });

  it("handles empty persisted (fresh install) → just seed", () => {
    const seed = [seedItem("s1")];
    expect(mergeContentItems([], seed)).toEqual(seed);
  });
});
```

- [ ] **Step 2: Chạy test — kỳ vọng FAIL**

Run: `npm run test -- src/lib/stores/merge-content.test.ts`
Expected: FAIL ("mergeContentItems is not a function" / module not found).

- [ ] **Step 3: Viết implementation** — `src/lib/stores/merge-content.ts`

```typescript
import type { ContentItem } from "@/lib/types";

/**
 * Gộp content khi nạp lại / bump version:
 * - Giữ mọi item người dùng (id KHÔNG nằm trong seed) theo đúng thứ tự đã lưu.
 * - Thay thế các item seed bằng phiên bản seed MỚI (chống stale-seed dev≠build).
 * Không bao giờ làm mất nội dung người dùng.
 */
export function mergeContentItems(
  persisted: ContentItem[],
  seed: ContentItem[],
): ContentItem[] {
  const seedIds = new Set(seed.map((i) => i.id));
  const userItems = persisted.filter((i) => !seedIds.has(i.id));
  return [...userItems, ...seed];
}
```

- [ ] **Step 4: Chạy test — kỳ vọng PASS**

Run: `npm run test -- src/lib/stores/merge-content.test.ts`
Expected: PASS (3 test).

- [ ] **Step 5: Nối vào persist của content store** — `src/stores/content.ts`

Thêm import (cạnh import SEED_CONTENT):
```typescript
import { mergeContentItems } from "@/lib/stores/merge-content";
```
Thay khối options (dòng 126-133):
```typescript
    {
      name: "gk-content",
      version: 3,
      // Migrate KHÔNG hủy: giữ item người dùng, làm mới seed.
      migrate: (persisted) => {
        const items = (persisted as { items?: ContentItem[] } | undefined)?.items ?? [];
        return { items: mergeContentItems(items, SEED_CONTENT) };
      },
      // Khi nạp state cũ cùng version: vẫn refresh seed + giữ user item.
      merge: (persisted, current) => ({
        ...current,
        items: mergeContentItems(
          (persisted as { items?: ContentItem[] } | undefined)?.items ?? [],
          SEED_CONTENT,
        ),
      }),
    },
```
(Đảm bảo `ContentItem` đã được import trong file — nếu chưa, thêm `import type { ContentItem } from "@/lib/types";`.)

- [ ] **Step 6: Viết test regression cho store** — thêm vào `src/stores/content.test.ts` (tạo nếu chưa có, pragma jsdom)

```typescript
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { mergeContentItems } from "@/lib/stores/merge-content";
import { SEED_CONTENT } from "@/lib/mock-data";
import type { ContentItem } from "@/lib/types";

describe("content migrate is non-destructive", () => {
  beforeEach(() => localStorage.clear());

  it("preserves a user-created item across a simulated version bump", () => {
    const userDraft = { id: "user-draft-1", title: "Bài của tôi" } as ContentItem;
    const merged = mergeContentItems([userDraft, ...SEED_CONTENT], SEED_CONTENT);
    expect(merged.find((i) => i.id === "user-draft-1")).toBeTruthy();
  });
});
```

- [ ] **Step 7: Chạy test + Checkpoint**

Run: `npm run test -- src/stores/content.test.ts` → PASS
Run: `npx tsc --noEmit` → PASS

---

## Task 3: Migrate course store KHÔNG hủy dữ liệu người dùng

**Files:**
- Modify: `src/stores/course.ts:495-505` (persist options)
- Test: `src/stores/course.test.ts` (thêm test)

**Interfaces:**
- Produces: `useCourse` migrate giữ nguyên `courseData` đã lưu (không wipe). Khóa mở rộng tương lai (per-lesson publish ở Phase 1) sẽ thêm field optional an toàn.

**Bối cảnh:** `src/stores/course.ts:503` hiện là `migrate: () => ({ courseData: {}, activeLessonId: null }) as CourseState` → wipe mọi khóa học người dùng đã soạn. `courseData` keyed theo courseId, blocks do người dùng tạo sau khi seed → không thể tách "seed vs user" theo id. ⇒ Chiến lược an toàn nhất: **bảo toàn toàn bộ `courseData`** qua mọi version bump (không refresh demo nội bộ — chấp nhận đánh đổi để không mất dữ liệu).

- [ ] **Step 1: Viết test thất bại** — thêm vào `src/stores/course.test.ts`

```typescript
import { courseMigrate } from "./course"; // sẽ export ở Step 3

describe("course migrate is non-destructive", () => {
  it("preserves persisted courseData across a version bump", () => {
    const persisted = {
      courseData: { c1: { chapters: [], lessons: [{ id: "l1", title: "Của tôi", chapterId: "ch", blocks: [] }] } },
      activeLessonId: "l1",
    };
    const out = courseMigrate(persisted, 2);
    expect(out.courseData.c1.lessons[0].title).toBe("Của tôi");
    expect(out.activeLessonId).toBe("l1");
  });

  it("tolerates empty/undefined persisted (fresh install)", () => {
    const out = courseMigrate(undefined, 2);
    expect(out.courseData).toEqual({});
  });
});
```

- [ ] **Step 2: Chạy test — kỳ vọng FAIL**

Run: `npm run test -- src/stores/course.test.ts`
Expected: FAIL ("courseMigrate is not exported").

- [ ] **Step 3: Viết hàm migrate thuần + nối vào persist** — `src/stores/course.ts`

Thêm hàm export (gần cuối file, trước `export const useCourse`):
```typescript
/** Migrate KHÔNG hủy: giữ nguyên courseData người dùng đã soạn. */
export function courseMigrate(
  persisted: unknown,
  _version: number,
): Pick<CourseState, "courseData" | "activeLessonId"> {
  const p = (persisted ?? {}) as Partial<Pick<CourseState, "courseData" | "activeLessonId">>;
  return {
    courseData: p.courseData ?? {},
    activeLessonId: p.activeLessonId ?? null,
  };
}
```
Thay options (dòng 495-504):
```typescript
    {
      name: "gk-course",
      version: 3,
      migrate: (persisted, version) => courseMigrate(persisted, version) as CourseState,
    },
```

- [ ] **Step 4: Chạy test — kỳ vọng PASS**

Run: `npm run test -- src/stores/course.test.ts`
Expected: PASS (gồm cả test cũ).

- [ ] **Step 5: Checkpoint** — `npx tsc --noEmit` PASS · `npm run test` PASS.

---

## Task 4: Lớp token course (`src/styles/untitled/course.css`) + callout/code tokens

**Files:**
- Create: `src/styles/untitled/course.css`
- Modify: `src/styles.css` (thêm `@import` + expose token qua `@theme inline`)

**Interfaces:**
- Produces: utilities Tailwind v4 mới (strict-grep-clean, KHÔNG `bg-[`): `bg-callout-info` / `text-callout-info-fg` / `border-callout-info-line` (và tip/warn/danger), `bg-code-surface` / `text-code-ink`. Lớp `[data-course-theme]` khai báo `--course-*` fallback về token global (Phase 0 chỉ là MobiFone Default).

**Bối cảnh:** `src/styles.css:1-22` import các file token; `@theme inline` (dòng 35-147) map `--color-*` → biến `:root`. Ta thêm token mới theo đúng pattern đó để có utility thật, tránh hardcode màu trong component (Task 5/6).

- [ ] **Step 1: Tạo file token** — `src/styles/untitled/course.css`

```css
/* Token cho khối nội dung học liệu + lớp theme per-course (Phase 0: chỉ Default).
   Mọi --course-* fallback về token MobiFone global → an toàn khi chưa chọn theme. */
:root {
  /* Callout — ánh xạ sang ramp Untitled UI sẵn có */
  --callout-info-bg: var(--brand-50);
  --callout-info-fg: var(--text-brand);
  --callout-info-line: var(--brand-200, var(--border-brand));
  --callout-tip-bg: var(--success-50);
  --callout-tip-fg: var(--success-700);
  --callout-tip-line: var(--success-600);
  --callout-warn-bg: var(--warning-50);
  --callout-warn-fg: var(--warning-700);
  --callout-warn-line: var(--warning-600);
  --callout-danger-bg: var(--error-50);
  --callout-danger-fg: var(--error-700);
  --callout-danger-line: var(--error-600);

  /* Code/HTML surface (thay bg-[#1e1e2e]) */
  --code-surface: var(--colors-gray-900, #131c2c);
  --code-ink: var(--success-300, var(--colors-success-300));

  /* Lớp scope per-course — Phase 0 chỉ định nghĩa biến, default = global */
  --course-accent: var(--bg-brand-solid);
  --course-accent-soft: var(--bg-brand-primary);
  --course-surface: var(--bg-primary);
  --course-ink: var(--text-primary);
  --course-radius: var(--radius);
}

/* Scope theme per-course; Phase 3 sẽ override các biến này per courseId. */
[data-course-theme] {
  /* Phase 0: kế thừa, chưa override gì — placeholder cho Phase 3. */
}
```
*(Nếu một biến nguồn không tồn tại, fallback thứ hai trong `var(a, b)` sẽ dùng. Sau Step 4, kiểm bằng mắt ở `npm run dev` để chắc màu callout đúng.)*

- [ ] **Step 2: Import + expose qua @theme** — `src/styles.css`

Thêm vào cụm `@import` (sau dòng 13, sau `gradients.css`):
```css
@import "./styles/untitled/course.css";
```
Thêm vào trong khối `@theme inline { ... }` (cạnh các `--color-*` khác):
```css
  --color-callout-info: var(--callout-info-bg);
  --color-callout-info-fg: var(--callout-info-fg);
  --color-callout-info-line: var(--callout-info-line);
  --color-callout-tip: var(--callout-tip-bg);
  --color-callout-tip-fg: var(--callout-tip-fg);
  --color-callout-tip-line: var(--callout-tip-line);
  --color-callout-warn: var(--callout-warn-bg);
  --color-callout-warn-fg: var(--callout-warn-fg);
  --color-callout-warn-line: var(--callout-warn-line);
  --color-callout-danger: var(--callout-danger-bg);
  --color-callout-danger-fg: var(--callout-danger-fg);
  --color-callout-danger-line: var(--callout-danger-line);
  --color-code-surface: var(--code-surface);
  --color-code-ink: var(--code-ink);
```

- [ ] **Step 3: Build để Tailwind sinh utility**

Run: `npm run build`
Expected: PASS (không lỗi CSS). Utilities `bg-callout-info`, `text-callout-info-fg`, `border-callout-info-line`, `bg-code-surface`, `text-code-ink` giờ tồn tại.

- [ ] **Step 4: Kiểm bằng mắt** — `npm run dev`, mở builder, xác nhận chưa có gì vỡ (Task 5 mới dùng các token này). Checkpoint: `npx tsc --noEmit` PASS.

---

## Task 5: De-hardcode `block-card.tsx`, `page-canvas.tsx`, `course-ai-panel.tsx` → token

**Files:**
- Modify: `src/components/course/block-card.tsx`, `src/components/course/page-canvas.tsx`, `src/components/course/course-ai-panel.tsx`

**Interfaces:**
- Consumes: utilities token từ Task 4.
- Produces: 3 file không còn màu Tailwind mặc định / hex.

**Bối cảnh:** danh sách vi phạm chính xác (từ khảo sát code):
- `block-card.tsx:44-49` `CALLOUT_STYLES` (blue/emerald/amber/red), `:380` & `:479` `bg-[#1e1e2e] text-emerald-300/200`, `:493` `border-blue-light-500/...`, `:563/565/595/679-681` `violet-600`.
- `page-canvas.tsx:151-159` callout map, `:76-80` quiz state colors, `:95-96` feedback, `:266/281-282` journey emerald.
- `course-ai-panel.tsx:31/37/41/51/52/62/96` blue/emerald.

- [ ] **Step 1: Sửa `CALLOUT_STYLES` trong `block-card.tsx` (dòng 44-49)**

```typescript
const CALLOUT_STYLES: Record<CalloutVariant, { icon: typeof Info; bg: string; border: string; text: string; label: string }> = {
  info: { icon: Info, bg: "bg-callout-info", border: "border-callout-info-line", text: "text-callout-info-fg", label: "Thông tin" },
  tip: { icon: Lightbulb, bg: "bg-callout-tip", border: "border-callout-tip-line", text: "text-callout-tip-fg", label: "Mẹo" },
  warning: { icon: AlertTriangle, bg: "bg-callout-warn", border: "border-callout-warn-line", text: "text-callout-warn-fg", label: "Cảnh báo" },
  danger: { icon: ShieldAlert, bg: "bg-callout-danger", border: "border-callout-danger-line", text: "text-callout-danger-fg", label: "Nguy hiểm" },
};
```

- [ ] **Step 2: Sửa code/HTML surface trong `block-card.tsx` (dòng 380, 479)**

Dòng 380: thay `bg-[#1e1e2e] ... text-emerald-300` → `bg-code-surface ... text-code-ink`.
Dòng 479: thay `bg-[#1e1e2e] ... text-emerald-200` → `bg-code-surface ... text-code-ink`.
(Giữ nguyên các class khác trên cùng dòng.)

- [ ] **Step 3: Sửa section marker + columns accent trong `block-card.tsx`**

- Dòng 493: `border-blue-light-500/50 bg-blue-light-500/5` → `border-primary/40 bg-primary/5`.
- Dòng 563/565/595: `border-violet-600`, `bg-violet-600/10`, `border-violet-600/30 bg-violet-600/[0.02]` → dùng `border-primary`, `bg-primary/10`, `border-primary/30 bg-primary/[0.02]`. (Columns dùng accent = primary cho nhất quán; Phase 3 có thể tách token riêng.)
- Dòng 679-681: `bg-violet-600` → `bg-primary`.

- [ ] **Step 4: Sửa callout/quiz/feedback/journey trong `page-canvas.tsx`**

- Dòng 151-159 callout map → dùng `bg-callout-* / border-callout-*-line / text-callout-*-fg` (tương tự Step 1).
- Dòng 76-80 quiz state: `correct` → `border-callout-tip-line bg-callout-tip text-callout-tip-fg`; `wrong` → `border-callout-danger-line bg-callout-danger text-callout-danger-fg`; giữ `idle`/`muted` (đã dùng token `border-border`/`primary`/`accent`).
- Dòng 95-96 feedback: đúng → `border-callout-tip-line bg-callout-tip text-callout-tip-fg`; sai → `border-callout-warn-line bg-callout-warn text-callout-warn-fg`.
- Dòng 266 `text-emerald-600` → `text-callout-tip-fg`. Dòng 281-282 journey done box → `border-callout-tip-line bg-callout-tip` + `text-callout-tip-fg`.

- [ ] **Step 5: Sửa `course-ai-panel.tsx` (dòng 31,37,41,51,52,62,96)**

- `text-blue-600`/`text-blue-700` → `text-primary`; `bg-blue-50`/`hover:bg-blue-50` → `bg-brand-50`/`hover:bg-brand-50`.
- `text-emerald-700`/`hover:bg-emerald-50` → `text-callout-tip-fg`/`hover:bg-callout-tip`.
- `bg-blue-900 text-white` (bubble user) → `bg-primary text-primary-foreground`.
- `bg-blue-600 ... hover:bg-blue-700` (nút gửi) → `bg-primary ... hover:bg-primary-hover`.

- [ ] **Step 6: Verify self-check (grep) — kỳ vọng KHÔNG kết quả**

Run (Bash):
```bash
grep -rnE "bg-(blue|emerald|amber|red|violet)-|text-(blue|emerald|amber|red|violet)-|border-(blue|emerald|amber|red|violet)-|bg-\[#|text-\[#" src/components/course/block-card.tsx src/components/course/page-canvas.tsx src/components/course/course-ai-panel.tsx
```
Expected: không dòng nào (exit 1 / rỗng). Nếu còn, sửa nốt.

- [ ] **Step 7: Checkpoint** — `npx tsc --noEmit` PASS · `npm run build` PASS · kiểm mắt `npm run dev` (callout/code/AI panel đúng màu brand/success/warning/error).

---

## Task 6: Preview đa thiết bị (desktop / tablet / mobile)

**Files:**
- Create: `src/lib/preview/viewport.ts`, `src/lib/preview/viewport.test.ts`
- Modify: `src/components/course/course-builder.tsx` (state + segmented control), `src/components/course/page-canvas.tsx` (áp max-width khi preview)

**Interfaces:**
- Produces: `type Viewport = "desktop" | "tablet" | "mobile"`; `viewportMaxWidth(vp: Viewport): string` → class max-width. `PageCanvas` nhận thêm prop optional `viewport?: Viewport`.

- [ ] **Step 1: Viết test thất bại** — `src/lib/preview/viewport.test.ts`

```typescript
import { describe, expect, it } from "vitest";
import { viewportMaxWidth } from "./viewport";

describe("viewportMaxWidth", () => {
  it("maps each viewport to a max-width class", () => {
    expect(viewportMaxWidth("desktop")).toBe("max-w-none");
    expect(viewportMaxWidth("tablet")).toBe("max-w-[768px]");
    expect(viewportMaxWidth("mobile")).toBe("max-w-[390px]");
  });
});
```

- [ ] **Step 2: Chạy test — FAIL** · Run: `npm run test -- src/lib/preview/viewport.test.ts`

- [ ] **Step 3: Implementation** — `src/lib/preview/viewport.ts`

```typescript
export type Viewport = "desktop" | "tablet" | "mobile";

const MAX_WIDTH: Record<Viewport, string> = {
  desktop: "max-w-none",
  tablet: "max-w-[768px]",
  mobile: "max-w-[390px]",
};

export function viewportMaxWidth(vp: Viewport): string {
  return MAX_WIDTH[vp];
}
```
*(Ghi chú: `max-w-[768px]` là arbitrary-value cho KÍCH THƯỚC, không phải màu → không vi phạm self-check màu.)*

- [ ] **Step 4: Chạy test — PASS**

- [ ] **Step 5: Thêm state + segmented control vào `course-builder.tsx`**

Cạnh `const [previewMode, setPreviewMode] = useState(true);` (dòng 67) thêm:
```typescript
const [viewport, setViewport] = useState<Viewport>("desktop");
```
Thêm import: `import { type Viewport } from "@/lib/preview/viewport";` và icon `import { Monitor, Tablet, Smartphone } from "lucide-react";` (gộp vào import lucide hiện có).
Ngay sau cụm nút Preview/Soạn (sau dòng ~257), thêm (CHỈ hiện khi `previewMode`):
```tsx
{previewMode && (
  <div className="flex rounded-lg border p-0.5">
    {([["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone]] as const).map(([vp, Icon]) => (
      <button
        key={vp}
        onClick={() => setViewport(vp)}
        aria-label={`Xem ở ${vp}`}
        className={cn(
          "flex items-center rounded-md px-2 py-1 transition",
          viewport === vp ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </button>
    ))}
  </div>
)}
```
Truyền prop xuống PageCanvas (trong block render dòng ~289):
```tsx
viewport={viewport}
```

- [ ] **Step 6: Nhận + áp prop trong `page-canvas.tsx`**

Thêm `viewport?: Viewport` vào props interface (import type `Viewport`). Trong nhánh preview (root dòng 220), bọc nội dung bằng max-width động:
```tsx
import { viewportMaxWidth, type Viewport } from "@/lib/preview/viewport";
// ...
<div className="min-h-full bg-white">
  <div className={cn("mx-auto w-full px-4 py-10 sm:px-6 lg:px-10", viewport ? viewportMaxWidth(viewport) : "max-w-6xl")}>
    {/* ... giữ nguyên nội dung ... */}
  </div>
</div>
```
(Khi `viewport === "desktop"` → `max-w-none`; giữ `max-w-6xl` làm fallback khi prop không truyền.)

- [ ] **Step 7: Checkpoint** — `npx tsc --noEmit` PASS · `npm run test` PASS · `npm run build` PASS · kiểm mắt: bật Preview, bấm tablet/mobile → canvas thu đúng bề rộng.

---

## Task 7: Repository interface + adapter localStorage + bọc canvas `data-course-theme`

**Files:**
- Create: `src/lib/repositories/types.ts`, `src/lib/repositories/local.ts`, `src/lib/repositories/local.test.ts`
- Create: `src/lib/theme/resolve.ts`, `src/lib/theme/resolve.test.ts`
- Modify: `src/components/course/page-canvas.tsx` (bọc root bằng `data-course-theme` + áp `getResolvedThemeVars`)

**Interfaces:**
- Produces:
  - `CourseRepository` / `ContentRepository` / `QuizRepository` (types.ts) — chữ ký CRUD ánh xạ method store hiện có.
  - `localCourseRepository` / `localContentRepository` / `localQuizRepository` (local.ts) — adapter gọi vào store Zustand.
  - `getResolvedThemeVars(theme?: CourseTheme): CourseThemeVars` — Phase 0 trả `{}` (kế thừa global). `type CourseThemeVars = Record<string, string>`.

**Bối cảnh:** Đây là khớp nối cho backend tương lai (đổi adapter = 1 chỗ) và cho theming Phase 3 (biến `data-course-theme` đã sẵn sàng nhận `--course-*`). Phase 0 chỉ đặt khung, chưa đổi hành vi.

- [ ] **Step 1: Viết test thất bại — theme resolve** — `src/lib/theme/resolve.test.ts`

```typescript
import { describe, expect, it } from "vitest";
import { getResolvedThemeVars } from "./resolve";

describe("getResolvedThemeVars (Phase 0)", () => {
  it("returns an empty var map when no theme (inherits global tokens)", () => {
    expect(getResolvedThemeVars(undefined)).toEqual({});
  });
});
```

- [ ] **Step 2: Chạy — FAIL** · Run: `npm run test -- src/lib/theme/resolve.test.ts`

- [ ] **Step 3: Implementation theme resolve** — `src/lib/theme/resolve.ts`

```typescript
/** Phase 0 stub: chưa có theme per-course → kế thừa token global (map rỗng).
 *  Phase 3 sẽ trả map { "--course-accent": "...", ... } từ authored-intent. */
export type CourseThemeVars = Record<string, string>;

// Placeholder type; Phase 3 thay bằng interface đầy đủ trong spec.
export interface CourseTheme {
  base: string;
}

export function getResolvedThemeVars(_theme?: CourseTheme): CourseThemeVars {
  return {};
}
```

- [ ] **Step 4: Chạy — PASS**

- [ ] **Step 5: Viết test adapter** — `src/lib/repositories/local.test.ts`

```typescript
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { localContentRepository } from "./local";
import { useContent } from "@/stores/content";

describe("localContentRepository", () => {
  beforeEach(() => localStorage.clear());

  it("findAll() returns the store's items", () => {
    const items = localContentRepository.findAll();
    expect(Array.isArray(items)).toBe(true);
    expect(items).toBe(useContent.getState().items);
  });
});
```

- [ ] **Step 6: Chạy — FAIL** · Run: `npm run test -- src/lib/repositories/local.test.ts`

- [ ] **Step 7: Viết interface + adapter**

`src/lib/repositories/types.ts`:
```typescript
import type { ContentItem } from "@/lib/types";
import type { CourseData } from "@/stores/course";

export interface ContentRepository {
  findAll(): ContentItem[];
  findById(id: string): ContentItem | undefined;
}

export interface CourseRepository {
  get(courseId: string): CourseData | undefined;
  ensureSeeded(courseId: string): void;
}
```

`src/lib/repositories/local.ts`:
```typescript
import { useContent } from "@/stores/content";
import { useCourse } from "@/stores/course";
import type { ContentRepository, CourseRepository } from "./types";

export const localContentRepository: ContentRepository = {
  findAll: () => useContent.getState().items,
  findById: (id) => useContent.getState().items.find((i) => i.id === id),
};

export const localCourseRepository: CourseRepository = {
  get: (courseId) => useCourse.getState().courseData[courseId],
  ensureSeeded: (courseId) => useCourse.getState().init(courseId),
};
```
*(Giữ tối thiểu, đủ chứng minh pattern; Phase 1+ bổ sung method khi cần — không over-build.)*

- [ ] **Step 8: Chạy test — PASS** · Run: `npm run test -- src/lib/repositories/local.test.ts`

- [ ] **Step 9: Bọc canvas bằng `data-course-theme`** — `src/components/course/page-canvas.tsx`

Ở CẢ root preview (dòng 220) và root edit (dòng 444-451), thêm attribute `data-course-theme` (Phase 0 chưa áp style; chỉ đặt scope cho Phase 3). Ví dụ root preview:
```tsx
<div className="min-h-full bg-white" data-course-theme>
```
root edit:
```tsx
<div ref={setNodeRef} data-course-theme className={cn("relative flex min-h-full flex-1 flex-col transition", isOver && "bg-accent/30 ring-2 ring-inset ring-dashed ring-primary/20")}>
```
*(Không truyền style động trong Phase 0; `getResolvedThemeVars()` trả `{}`. Đây là điểm neo cho Phase 3.)*

- [ ] **Step 10: Checkpoint** — `npx tsc --noEmit` PASS · `npm run test` (toàn bộ) PASS · `npm run build` PASS.

---

## Self-Review (đã rà theo skill)

**1. Spec coverage (Phase 0 trong spec §5):**
- 0.1 persist `useQuiz` + migrate không hủy → Task 1 (quiz), Task 2 (content), Task 3 (course). ✓
- 0.2 de-hardcode DS drift + `--color-code-surface` → Task 4 (token, gồm `--color-code-surface`) + Task 5 (de-hardcode). ✓
- 0.3 repository interface + wrap store → Task 7. ✓
- 0.4 preview đa thiết bị → Task 6. ✓
- 0.5 lớp token `--course-*` + bọc `data-course-theme` + Default → Task 4 (token layer) + Task 7 Step 9 (bọc scope). ✓

**2. Placeholder scan:** không có TBD/"xử lý sau"; mọi step có code/command cụ thể. Các method store giữ nguyên được nêu rõ "GIỮ NGUYÊN", không phải placeholder.

**3. Type consistency:** `Viewport`, `viewportMaxWidth`, `mergeContentItems`, `courseMigrate`, `getResolvedThemeVars`, `CourseThemeVars`, `ContentRepository`/`CourseRepository` — tên dùng nhất quán giữa định nghĩa và nơi tiêu thụ. `data-course-theme` đặt ở cả 2 root canvas khớp scope Phase 3.

**Rủi ro thực thi cần lưu:** (a) vitest `environment: "node"` không có `localStorage` → các test chạm persist phải có pragma `// @vitest-environment jsdom` (đã ghi trong Task 1/2/7); (b) một số biến token nguồn (`--brand-200`, `--success-300`) có thể chưa tồn tại → đã dùng `var(a, b)` fallback, BẮT BUỘC kiểm mắt ở Task 5 Step 7.

---

## Execution Handoff

**Plan complete — saved to `docs/superpowers/plans/2026-06-27-lesson-builder-phase-0-foundation.md`. Hai cách thực thi:**

1. **Subagent-Driven (khuyến nghị)** — dispatch một subagent mới cho mỗi task, review giữa các task, lặp nhanh (REQUIRED SUB-SKILL: superpowers:subagent-driven-development).
2. **Inline Execution** — thực thi trong session này theo lô + checkpoint (REQUIRED SUB-SKILL: superpowers:executing-plans).

**Phase 1/2/3** sẽ là các plan riêng (theo hướng dẫn "một subsystem một plan"). Bạn muốn chọn cách thực thi nào, hay viết tiếp plan Phase 1?
