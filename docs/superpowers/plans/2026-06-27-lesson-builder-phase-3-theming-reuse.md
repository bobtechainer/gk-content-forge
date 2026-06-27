# Lesson Builder — Phase 3 (Theming + Reuse + Analytics) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Cá nhân hóa per-course (theme gallery + custom editor kiểu Claude-design) chạy thật trên nền token Phase 0; + tái sử dụng nội dung (Question Library, linked material live-resolve); + thumbnail/cert từ theme; + analytics event-capture thật (thay mock tĩnh). Tất cả client-first.

**Architecture:** `getResolvedThemeVars(theme)` (Phase 0 stub) trở thành thật: từ authored-intent (accentSeed + fontPair + radius/density + mode) → map CSS var `--course-*`, derive ramp + contrast bằng `src/lib/theme/color.ts` (pure, tested). Map được áp **inline style** lên root `[data-course-theme]` (chỉ bọc canvas/preview/learn — KHÔNG chạm app chrome). `useCourseTheme` (persist) giữ theme per-course.

**Tech Stack:** React 19, Zustand v5 persist, Tailwind v4 tokens, recharts, Vitest.

## Global Constraints
- MobiFone Untitled UI tokens only in component code (no hex/palette/`bg-[#...]`). Theme override = đổi giá trị `--course-*` qua **inline style trên root scope**, KHÔNG hardcode màu trong component. Hex CHỈ được xuất hiện như giá trị trong theme data / color-util output (authored-intent seed), không trong className.
- Scope cứng: `--course-*` chỉ áp trong `[data-course-theme]` wrapper (canvas + preview + student-learn). KHÔNG để rò sang sidebar/header/app chrome.
- Persist mới optional+additive, migrate không hủy. `useCourseTheme` default rỗng `{}` (không seed → không stale-seed).
- Accessibility: body-ink luôn đạt AA (≥4.5:1) — guardrail không cho tạo theme chữ khó đọc. Tôn trọng `prefers-reduced-motion`.
- AI "gợi ý theme" (nếu có) qua `aiClient` mock (Phase 2) — không API.
- Gate: tsc + vitest + build. Commit local `feat/lesson-builder-phase-0`, no push/merge, Vietnamese msg, no attribution.

## File Structure
**Tạo mới:**
- `src/lib/theme/color.ts` + `.test.ts` — pure color util: `parseHex`, `relativeLuminance`, `contrastRatio`, `mix(hex, hex, t)`, `accessibleInk(bg)` (pick ink/white ≥AA), `ramp(seed)` (soft/accent/strong).
- `src/lib/theme/system-themes.ts` — 6 preset `CourseTheme` (MobiFone Default, Toán/STEM, Văn/Humanities, Mầm non, Trung học clean, Dark) + font-pair allow-list.
- `src/stores/course-theme.ts` + `.test.ts` — `useCourseTheme` (persist `gk-course-theme`).
- `src/components/course/theme-panel.tsx` — "Giao diện" surface: gallery cards (live mini-preview) + "Tùy chỉnh" → editor.
- `src/stores/question-library.ts` + `.test.ts` — `useQuestionLibrary` (persist).
- `src/lib/analytics/events.ts` + `src/stores/analytics-events.ts` + tests — local event capture.

**Sửa:**
- `src/lib/theme/resolve.ts` — real `getResolvedThemeVars` + full `CourseTheme` type.
- `src/styles/untitled/course.css` — keep tokens; ensure `[data-course-theme]` consumes inline-set vars (it already does via fallback chain).
- `src/components/course/page-canvas.tsx` + `src/components/student/student-learn.tsx` — apply `style={getResolvedThemeVars(theme)}` on the `data-course-theme` root (+ add the wrapper to student-learn which currently lacks it).
- `src/components/blocks/block-views.tsx` (EmbedView) — live-resolve `embedMaterialId` from `useContent`.
- `src/components/partner/partner-analytics.tsx` / `analytics-line-chart.tsx` — blend captured events with mock.

---

## Task 1: Theme engine — color util + real resolve + `useCourseTheme` + apply scoped vars + 6 presets

**Files:** Create `src/lib/theme/color.ts`+test, `src/lib/theme/system-themes.ts`, `src/stores/course-theme.ts`+test; Modify `src/lib/theme/resolve.ts`, `page-canvas.tsx`, `student-learn.tsx`. Extend `ThemeRepository` in `src/lib/repositories/types.ts`+`local.ts`.
**Interfaces:**
```ts
// resolve.ts (replaces stub)
export interface CourseTheme {
  schemaVersion: 1; base: string /* SystemThemeId | "custom" */;
  accentSeed: string /* hex */; fontPairId: string; radiusStep: number /* px */;
  density: "compact" | "cozy" | "spacious"; mode: "light" | "dark" | "auto";
}
export type CourseThemeVars = Record<string, string>;
export function getResolvedThemeVars(theme?: CourseTheme): CourseThemeVars; // {} when undefined
```
- [ ] **color.ts (TDD):** `parseHex("#237BD3")`→{r,g,b}; `relativeLuminance`; `contrastRatio(a,b)` (WCAG, returns ≥1); `mix("#fff","#000",0.5)`; `accessibleInk(bg)` returns `"#..."` (white or near-black) with contrast ≥4.5; `ramp(seed)` → `{ accent, soft, strong, ink }`. Tests: contrast of black-on-white ≈ 21; accessibleInk on a light bg returns a dark ink (contrast≥4.5); ramp deterministic.
- [ ] **resolve.ts (TDD):** `getResolvedThemeVars(undefined)` → `{}` (unchanged); given a theme, returns a map with keys `--course-accent`, `--course-accent-soft`, `--course-ink`, `--course-radius` (+ font vars) derived via color.ts; accent-fg meets AA. Keep the map keys aligned with the `--course-*` names already in `course.css`.
- [ ] **system-themes.ts:** 6 presets as `CourseTheme` objects (accentSeed from brand-ish but distinct per theme; fontPairId from an allow-list; radiusStep/density/mode). Export `SYSTEM_THEMES: Record<string, CourseTheme>` + `FONT_PAIRS`.
- [ ] **useCourseTheme (TDD, jsdom):** state `{ byCourse: Record<string, CourseTheme> }`; actions `setTheme(courseId, theme)`, `getTheme(courseId)`, `clear(courseId)`. Persist `gk-course-theme` v1 default `{byCourse:{}}`, partialize, non-destructive migrate. On course clone, copy theme (wire if duplicateItem path is reachable — else note).
- [ ] **Apply:** in `page-canvas.tsx` preview root and `student-learn.tsx` (ADD a `data-course-theme` wrapper around the lesson content), set `style={getResolvedThemeVars(useCourseTheme.getState().getTheme(courseId))}`. Confirm app chrome (outside the wrapper) is unaffected — the vars only resolve inside the scoped root. `ThemeRepository` interface + local adapter (get/set/list system themes).
- [ ] Gate + commit `feat: theme engine (color util + resolve thật + useCourseTheme + áp scoped vars + 6 preset)`.

## Task 2: Theme gallery picker + custom editor (contrast guardrail, fonts, radius/density, dark)

**Files:** Create `src/components/course/theme-panel.tsx`; Modify `course-builder.tsx` (mount a "Giao diện" entry — a Sheet/tab opening theme-panel).
- [ ] **Gallery:** grid of `Card`s, one per system theme, each a LIVE mini-preview: a small scaled box wrapped in `data-course-theme` with `style=getResolvedThemeVars(preset)` showing a heading + callout + button so the accent/radius/font show. Click "Áp dụng" → `setTheme(courseId, preset)`.
- [ ] **Custom editor:** accent color input (`<input type="color">` or hex field) → live `ramp` preview; a **contrast badge** (AA/AAA/fail) computed from `contrastRatio(accentInk, accent)` and body-ink vs surface — block "Áp dụng" or auto-nudge when body-ink fails AA. Font pair select (allow-list only). Radius slider (snap to token steps) + density select. Mode select (light/dark/auto). "Áp dụng" stores a `base:"custom"` CourseTheme.
- [ ] **Dark + reduced-motion:** when `mode:"dark"`, `getResolvedThemeVars` derives a dark surface/ink (use color.ts to darken surface + lighten ink, keep accent, keep AA). Respect `prefers-reduced-motion` in any preview transitions.
- [ ] Tokens only in the panel UI itself (the previews use scoped `--course-*` via inline style, which is allowed). Gate + commit `feat: theme gallery + custom editor (contrast guardrail, font/radius/density, dark)`.

## Task 3: Question Library + linked-material live-resolve + Files repo

**Files:** Create `src/stores/question-library.ts`+test; Modify `block-views.tsx` (EmbedView), the quiz builder (save/insert from library).
- [ ] **useQuestionLibrary (TDD, jsdom):** state `{ questions: Question[] }` (global bank, tagged by subject/grade); actions `add(q)`, `remove(id)`, `list(filter?)`. Persist `gk-question-library` v1 default `{questions:[]}`, non-destructive migrate. In the quiz builder, add "Lưu vào thư viện" (save a question) + "Chèn từ thư viện" (pick → insert via `useQuiz`).
- [ ] **Linked-material live-resolve:** `EmbedView` — when `block.embedMaterialId` is set, look up the material live from `useContent` (title/type) instead of only the denormalized `embedTitle`; if not found, show a "Học liệu không còn tồn tại" stale-state. (master-propagation = edits to the source material reflect because we resolve live.) Keep `embedUrl` iframe path unchanged.
- [ ] **Files repo:** formalize the existing material-as-file concept behind the repository interface (light — a `MaterialRepository.findById` used by EmbedView). Optional if time-boxed; at minimum live-resolve via `localContentRepository.findById`.
- [ ] Gate + commit `feat: Question Library + linked material live-resolve`.

## Task 4: Thumbnail-from-theme + lite certificate

**Files:** Modify thumbnail rendering (where `thumbnailColor` is consumed — `content-table.tsx` etc.) to prefer the course theme accent when a theme exists; Create `src/components/student/certificate.tsx` (+ print).
- [ ] **Thumbnail:** when a course has a theme, derive its thumbnail accent from `theme.accentSeed` (fallback to `thumbnailColor`). Keep it a small, contained change at the thumbnail render sites.
- [ ] **Certificate (lite):** a printable certificate component (learner name placeholder + course title + date) styled with the course theme (`data-course-theme` + getResolvedThemeVars), shown on lesson completion in `student-learn` with an "In chứng nhận" button (`window.print()` + a `@media print` scope reusing Phase 1 print.css `.print-content`/`.no-print`). No backend.
- [ ] Gate + commit `feat: thumbnail theo theme + chứng nhận (in được)`.

## Task 5: Analytics event capture (local) → real chart

**Files:** Create `src/lib/analytics/events.ts`, `src/stores/analytics-events.ts`+test; Modify `student-learn.tsx` (emit events), `analytics-line-chart.tsx` / `partner-analytics.tsx` (blend captured events).
- [ ] **Event store (TDD, jsdom):** `useAnalyticsEvents` — `record(event: { type: "lesson_open"|"quiz_answer"|"lesson_complete"; courseId; at: number; correct?: boolean })`, `byCourse(courseId)`, `summary()` (counts). Persist `gk-analytics-events` v1 default `{events:[]}`, non-destructive migrate, cap stored events (e.g. last 2000).
- [ ] **Emit:** in `student-learn.tsx`, record `lesson_open` on mount, `quiz_answer` on quiz result (already records attempts — add an analytics event too), `lesson_complete` on finishing. (`Date.now()` in app code OK.)
- [ ] **Surface real data:** in the analytics line chart (or a new "Hoạt động học thật" card), show captured events (e.g. opens/day) ALONGSIDE the existing mock; label mock clearly as "demo". Don't delete the mock (it fills the dashboard) — add a real-events panel.
- [ ] Gate + commit `feat: thu thập sự kiện học tập (local) + biểu đồ hoạt động thật`.

---

## Self-Review
- Spec §Phase 3 (3.1–3.5) → Tasks 1–5. ✓ Theming on Phase 0 token foundation; scoped to `data-course-theme`; client-first; AA guardrail.
- Type consistency: `CourseTheme`, `getResolvedThemeVars`, `useCourseTheme`, `ramp`, `accessibleInk`, `useQuestionLibrary`, `useAnalyticsEvents` consistent.
- Risks (from grounding): scoped-var leakage (apply only inside wrapper), student-learn missing wrapper (add it), dark derive (color util), linked-material stale (live-resolve + stale state), analytics without backend (local store + clear "demo" labels). Persist version bumps non-destructive.

## Execution: subagent-driven, local commits on `feat/lesson-builder-phase-0`, no push/merge.
