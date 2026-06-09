# GK Content Studio — MVP Demo Plan

A fully mock, frontend-only demo to showcase the Content Studio workflow for the "Trường học số" ecosystem. No real backend, no real auth — all state lives in Zustand + localStorage.

## 1. Foundation & Design System

- Apply brand tokens to `src/styles.css` (Tailwind v4 `@theme inline`):
  - `--primary` #20447E, `--primary-hover` #1a3766, `--action` #2563EB
  - `--background` #F9FAFB, `--card` #FFFFFF, `--border` #E5E7EB
  - `--foreground` #111827, `--muted-foreground` #717680
  - `--success` #10B981, `--warning` #F59E0B, `--destructive` #EF4444
  - `--radius` 0.5rem
- Load **Inter** via `<link>` in `__root.tsx`, register `--font-sans` in `@theme`.
- Install deps: `zustand`, `framer-motion`, `recharts`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `sonner` (already), `date-fns`.
- Light mode only.

## 2. State (Zustand + localStorage)

- `useSessionStore` — current role (`teacher | verified_teacher | publisher | admin`), switch role action.
- `useContentStore` — list of content items (quizzes + materials), CRUD, status transitions, pending approval queue.
- `useQuizStore` — current quiz draft (questions array, drag/sort/edit).
- Seed mock data on first load: 8–10 items across statuses; 2 pending-approval items; 4 mock accounts.

## 3. Routes (TanStack Start file-based)

```
src/routes/
  __root.tsx              shell + Inter font + Toaster
  index.tsx               → redirects to /login
  login.tsx               4 quick-demo role cards
  _app.tsx                authed layout (Header + Sidebar + Outlet)
  _app/dashboard.tsx
  _app/content.tsx        "Nội dung của tôi"
  _app/quizzes.tsx
  _app/materials.tsx
  _app/analytics.tsx
  _app/settings.tsx
  _app/channel.tsx        provider channel/profile
  _app/verification.tsx
  _app/admin.tsx          gated to admin role
  _app/builder.quiz.$id.tsx
  _app/builder.material.$id.tsx
```

`_app.tsx` guards: if no role in store → redirect to `/login`. Header includes "Đổi vai trò" popover to switch instantly.

## 4. Pages

### Login (`/login`)
4 large role cards (Giáo viên, Giảng viên uy tín ✅ L2, NXB Giáo dục ✅ L2, SuperAdmin 🛡️). Click → set role → navigate to `/dashboard`.

### Dashboard
- 4 summary stat cards (FileText, Globe, Clock, Eye) with mock counts.
- Tabs: Tất cả | Nháp | Đã xuất bản | Chờ duyệt | Bị từ chối.
- Table: thumbnail, title, type badge, status badge (color-coded), date, views, actions (Preview/Edit/Delete).
- Search input + filter selects (Loại, Trạng thái, Nền tảng).
- "Tạo mới" dropdown in header → creates draft and routes to builder.

### Quiz Builder (`/builder/quiz/:id`) — flagship screen
- Sticky header: back, inline-editable title (contentEditable), Preview / Settings / **Xuất bản** (primary).
- **Left sidebar (220px)** — Question type palette, grouped (Trắc nghiệm / Tương tác / Đa phương tiện / Nâng cao), 2-col grid of draggable cards with Lucide icons. Highlights (ring + scale) while dragging.
- **Center canvas** — drop zone with empty-state hint. Each question renders as a card by `type`:
  - `multiple_choice`: 4 options A/B/C/D, radio for correct answer, add/remove options.
  - `essay`: large textarea.
  - `drag_drop`: two columns (items ↔ targets), add pairs.
  - others (matching, ordering, video/audio/recognition/marker): minimal card with placeholder editor.
  - Per-card footer: thời gian (s), điểm, bắt buộc toggle, delete.
  - Drag handle to reorder within canvas.
- **Right panel (280px)** — "Tạo câu hỏi bằng AI ✨", input + Generate button → mock typing/shimmer ~1.5s → injects a generated question. Quick chips: Toán lớp 8, Vật lý 11, Lịch sử 10.
- **Drag-and-drop with @dnd-kit:**
  - `DndContext` wraps sidebar + canvas + right panel area.
  - Palette items use `useDraggable` with `data: { source: 'palette', type }`.
  - Canvas uses `useDroppable` and `SortableContext` (verticalListSortingStrategy) for existing questions.
  - Existing questions are `useSortable` items — reorder works inside canvas.
  - `onDragEnd`: if from palette → append new question of that type; if sortable → arrayMove.
  - `DragOverlay` with framer-motion spring for smooth follow.
- Seed 2–3 sample questions on new draft (1 multiple choice + 1 drag-drop + 1 essay).

### Material Builder (`/builder/material/:id`)
Same DnD shell, palette = content blocks (Text, Image, Video, PDF, Audio, Embed, Quiz block). Canvas renders blocks inline; right panel = AI writing assistant.

### Publish Flow (slide-over from right)
- Triggered by "Xuất bản" button. Uses `Sheet` (right side).
- Phase 1 (2s): shimmer skeleton + "AI đang phân tích…" with framer-motion pulse.
- Phase 2:
  - Editable tag chips (add/remove).
  - Editable description textarea.
  - **Circular** quality score 92/100 (SVG ring) — green.
  - 2 platform cards with checkboxes + mock logos: "Trường học số quốc gia" and "GK Ebooks".
  - 3 selects: Môn học / Khối lớp / Ngôn ngữ.
- Footer buttons: Lưu nháp | Xuất bản (loading spinner → success toast → close → status becomes "Chờ duyệt" or "Đã xuất bản" for L2/publisher).

### Channel Page
- Cover image (larger for business accounts, edit button if owner+business), avatar + name + verified badge.
- Bio, stats (materials / followers / views), Follow button.
- Tabs: Học liệu | Bộ đề | Giới thiệu | (Thành viên — business only).
- Grid of published content cards.

### Verification Roadmap
- Vertical timeline with 2 level cards.
- L1: checklist (Email, SĐT, CCCD/Giấy phép) — each row with progress bar + status icon (✅/⏳/❌).
- L2: checklist (L1 done, ≥10 published, ≥1000 views, ≥4.0 rating, admin approval) — progress bars showing current vs required (mock current teacher = 7/10 criteria met for L1 partially, L2 not yet eligible).
- "Nộp đơn xin tích xanh" button (disabled until eligible, with tooltip explaining why).

### Analytics
- Time-range tabs (7/30/90 ngày).
- Recharts: LineChart (views over time), BarChart (top 5 content).
- Stat cards: total views, followers, publish success rate.
- Detail table per content item.

### Admin Panel (admin role only)
- Tabs:
  - **Chờ duyệt** — list with Preview / Duyệt / Từ chối actions (updates content store).
  - **Quản lý tài khoản** — providers list with verified state toggle.
  - **Yêu cầu tích xanh L2** — applications list with Duyệt / Từ chối.

## 5. Shared Components

- `AppShell` (Sidebar + Header) — sidebar items conditional on role (admin sees extra "Quản lý người dùng" + "Duyệt nội dung").
- `RoleSwitcher` popover in header.
- `StatusBadge` (Nháp/Đã xuất bản/Chờ duyệt/Bị từ chối) with color mapping.
- `VerifiedBadge` (L2 blue check, Admin shield).
- `EmptyState`, `StatCard`, `ContentTable`.

## 6. Mock Data

Seeded in `src/lib/mock-data.ts`:
- 4 accounts (exactly as spec).
- 8–10 content items across all statuses, mix of quiz/material, with view counts, dates, owners.
- 2 items in pending-approval queue.
- 30/90-day chart data (slightly randomized but stable via seed).
- Sample questions for new quiz drafts.

## 7. Demo Flow Validation

After build: walk through the 6-step demo flow (login → create quiz → drag MCQ → publish → see in dashboard → switch to admin → approve) and confirm each step works.

---

## Technical notes

- TanStack Start template uses Tailwind v4 — tokens go into `src/styles.css` `@theme inline`, not `tailwind.config.ts`. The uploaded v3 config/globals are used as **reference for token names/values only**; the actual implementation will be v4-native.
- All routes are client-only mock state (Zustand persisted to localStorage). No server functions, no Supabase.
- `framer-motion` for spring animations on DnD overlay, publish slide-over, and page transitions.
- `sonner` for toasts (already in project).
- No dark mode, Vietnamese copy throughout, desktop + tablet only.

## Out of scope (per request)
Backend, real auth, real uploads, database, mobile responsive, dark mode, i18n.
