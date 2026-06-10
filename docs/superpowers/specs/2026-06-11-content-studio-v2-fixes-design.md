# Content Studio v2 — Fixes (Quiz Studio kho học liệu + Org workspace identity)

**Date:** 2026-06-11
**Scope:** gk-content-forge
**Status:** Approved design — pending implementation

Three independent fixes on top of the existing Content Studio v2 build. Builds on
`2026-06-10-content-studio-v2-design.md`. No architectural change to the shell/route model
(see project memory `content-studio-v2-architecture`).

---

## Fix 1 — Quiz Studio: replace material-TYPES tab with a real material library + attach material to question

### 1.1 Problem
In the quiz builder left rail (menu #2 "Học liệu"), `MaterialsPanel` shows a grid of material
**categories** (Bộ đề / Bài giảng / Hình ảnh / Video / Âm thanh / 3D / Học liệu nâng cao). These
are types, not real items, and cannot be inserted. The question canvas shows a static
"Kéo thả ảnh / video vào đây" box that does nothing.

### 1.2 Target behavior
- Menu #2 becomes a **kho học liệu** panel: searchable, filterable list of **real** material items,
  each draggable into / clickable to attach to the active question.
- Dropping (or clicking) a material **visually attaches** it to the currently-selected question:
  toast + an attachment chip rendered in the question card, removable.
- The canvas placeholder text changes from "Kéo thả ảnh / video vào đây" to
  "Kéo thả học liệu vào đây".

### 1.3 Panel content & scope
- Source: `useContent().items` + `useSession().roleId`.
- Filter: `category === "learning_material"` **AND** (`ownerId === roleId` **OR** `status === "published"`),
  deduped by id — i.e. **"của tôi + đã xuất bản"**.
- UI (in `src/components/quiz/palette.tsx`, panel widened 220px → ~260px):
  - Search input (matches title / subject / tags).
  - Horizontal type-filter chips: "Tất cả" + only the `LearningMaterialSubtype`s present in the
    filtered set. Labels reuse `MATERIAL_TYPE_LABELS` from `src/lib/taxonomy.ts`; icons reuse
    `material-type-icon.tsx`.
  - Scrollable list rows: colored thumbnail block (`thumbnailColor`) with the type icon + title
    (truncate) + meta line (`loại • môn`). Each row is `useDraggable` (`id: material-<itemId>`,
    `data: { source: "material", item }`) and `onClick` → attach to active question.
  - Hint footer: "✦ Kéo học liệu vào đề bài".
- Books/courses are intentionally excluded (not "học liệu" for a quiz question).

### 1.4 Data model — question attachments (multiple)
Extend `Question` in `src/lib/types.ts`:
```ts
export interface QuestionAttachment {
  materialId: string;
  title: string;
  type: MaterialType;
  thumbnailColor: string;
  fileExtension?: string;
}
// Question gains (a question may hold MANY materials):
attachments?: QuestionAttachment[];
```
Attach/detach reuses the existing `useQuiz().updateQuestion(quizId, qid, patch)` (immutable patch).
No new store action needed; attach = append (deduped by `materialId`), detach =
`updateQuestion(..., { attachments: attachments.filter(a => a.materialId !== id) })`.
(`useQuiz` is in-memory only — no persistence/migration.)

### 1.5 Drop handling (`creator.builder.quiz.$id.tsx` `onDragEnd`)
- Replace the current `data.source === "material"` toast-only branch:
  - Resolve current question = `questions[activeIndex]`.
  - If it exists and is **not** blank → append to `current.attachments` (skip + info toast if the
    `materialId` is already attached) and success toast `Đã chèn học liệu "<title>" (tổng N)`.
  - Else → info toast "Hãy chọn hoặc tạo câu hỏi trước khi chèn học liệu".
- Material click in the panel goes through a new `onAttachMaterial(item)` callback (same logic as drop).
- `DragOverlay` shows the material title while dragging a material (today it only renders question types).

### 1.6 Question card (`question-card.tsx`)
Replace the static dashed "Kéo thả ảnh / video vào đây" block:
- If `question.attachments` is empty → dashed placeholder with text **"Kéo thả học liệu vào đây"**
  (`Paperclip` icon).
- Else → a **horizontal thumbnail grid** (`flex flex-wrap gap-2`): each attachment is an ~84px tile
  (type-icon accent block + title truncated to one line) with a hover `✕` remove button (filters that
  `materialId` out), followed by a trailing dashed **"+ Thêm"** tile (hint toast pointing to the
  left "Học liệu" tab).

---

## Fix 2 — Quiz Studio: remove duplicate "Thiết lập" rail tab (menu #3)

### 2.1 Problem
The left rail has 4 tabs: Câu hỏi / Học liệu / **Thiết lập** / AI OCR. "Thiết lập" duplicates the
"Thiết lập" button already in the builder header.

### 2.2 Change (`palette.tsx`)
- Remove the `settings` entry from `RAIL_TABS`, the `settings` branch in `handleTabClick`, drop
  `"settings"` from the `RailTab` union, and remove the now-unused `onOpenSettings` prop from
  `QuizSidebar`.
- `creator.builder.quiz.$id.tsx` stops passing `onOpenSettings` to `QuizSidebar` (it keeps
  `settingsOpen` state for the header button + `QuizSettingsDialog`).
- Rail ends with 3 icons: **Câu hỏi • Học liệu • AI OCR**.

---

## Fix 3 — Org workspace shows personal identity & content (bug)

### 3.1 Problem
When a personal account (e.g. `teacher` = Nguyễn Văn A) switches workspace to the org (NXBGD):
- Every org-scope view resolves identity via `ACCOUNTS[roleId]` → shows the **person**, not the org.
- `useScopedContent("org")` filters `ownerId === "publisher" || ownerId === roleId` → **leaks personal
  content** into the org channel/library.

Affected views: `ChannelView`, `ChannelEditView` (channel-view.tsx), `DashboardView`,
`SettingsView`, `VerificationView`.

### 3.2 New helper — `src/lib/use-active-account.ts`
```ts
// resolveActiveOrgId lives in use-scoped-content.ts to avoid an import cycle.
export function resolveActiveAccount(roleId: RoleId, scope: StudioScope): Account {
  if (scope === "org" && roleId !== "admin") return ACCOUNTS[resolveActiveOrgId(roleId)];
  return ACCOUNTS[roleId];
}
export function useActiveAccount(scope: StudioScope): Account | null {
  const roleId = useSession((s) => s.roleId);
  return roleId ? resolveActiveAccount(roleId, scope) : null;
}
```
In `src/lib/use-scoped-content.ts`:
```ts
export function resolveActiveOrgId(roleId: RoleId): RoleId {
  if (roleId === "publisher") return "publisher";
  return (ACCOUNTS[roleId]?.orgMemberships?.[0]?.orgId ?? "publisher") as RoleId;
}
```

### 3.3 Content scoping (`use-scoped-content.ts`)
```ts
if (scope === "admin" || roleId === "admin") return items;
if (scope === "org") {
  const orgId = resolveActiveOrgId(roleId);
  return items.filter((item) => item.ownerId === orgId);   // was: ownerId === "publisher" || ownerId === roleId
}
return items.filter((item) => item.ownerId === roleId);
```

### 3.4 View updates
In the 5 affected views, replace `const account = roleId ? ACCOUNTS[roleId] : null;` with
`const account = useActiveAccount(scope);`. No other logic changes (followers, bio, verified,
edit forms all read from `account`).

### 3.5 Associated correctness fix — create ownership in org workspace
In `content-studio-shell.tsx` `handleCreateCategory` / `handleCreateMaterial`, when `scope === "org"`
pass `resolveActiveOrgId(roleId)` as the `ownerId` to `createDraft` (instead of `roleId`). Without this,
content created in the org workspace would be owned by the person and disappear from the org library
after 3.3.

### 3.6 Explicitly unchanged
The top-right header avatar/name in the shell (`content-studio-shell.tsx` line ~151) **stays** as the
logged-in person (`ACCOUNTS[roleId]`) — per product decision, the corner identity = who you are logged
in as; the workspace switcher + all page bodies reflect the active workspace.

---

## Testing
- `npx tsc --noEmit`, `npm test`, `npm run build` all pass.
- New `src/lib/use-active-account.test.ts`:
  - personal (`teacher`) + scope `org` → account is `publisher`; scope `creator` → `teacher`.
  - `publisher` + scope `org` → `publisher`.
  - `resolveActiveOrgId("teacher") === "publisher"`.
- `use-scoped-content` org filter: returns only `ownerId === publisher` items for a personal account in
  org scope (no personal items leak).
- Manual (dev `http://localhost:8080`):
  1. Login as teacher → switch workspace to NXBGD → `/org/channel`, `/org/dashboard`, `/org/library`,
     `/org/settings` show NXBGD identity and only NXBGD content; top-right avatar still Nguyễn Văn A.
  2. Quiz builder menu #2 → kho học liệu list, search/filter work, drag & click attach a material to a
     question; chip shows + removable; placeholder text reads "Kéo thả học liệu vào đây".
  3. Quiz builder rail shows 3 tabs (no "Thiết lập"); header "Thiết lập" still opens settings dialog.

## Implementation note (discovered during build)
`org.builder.quiz.$id.tsx` was a full (drifting) copy of the creator quiz builder, so Fix 1/2 would
otherwise only land in the creator scope. Resolved by extracting the builder into a single shared
`src/components/quiz/quiz-builder.tsx` (`QuizBuilder({ quizId, backTo })`); both route files are now
thin wrappers — matching the repo's "thin route → shared view" pattern.

## Out of scope
- Real backend/persistence for attachments (demo-level only).
- Reworking verification request data per-org (identity display only).
- Multi-org membership selection (mock data has a single org; `orgMemberships[0]` is sufficient).
