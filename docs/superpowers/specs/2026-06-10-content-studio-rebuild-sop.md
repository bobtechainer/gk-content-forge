# GK Content Studio — SOP & Design Specification (v3)

> **Last Updated:** 2026-06-10T00:50:00+07:00  
> **Status:** ✅ All 8 requirements implemented & verified

## 1. Tổng quan dự án

**GK Content Studio** là nền tảng tạo và quản lý nội dung giáo dục cho hệ sinh thái Trường học số. Được rebuild từ đầu (không sử dụng UI Lovable cũ), chỉ giữ cấu trúc folder.

### 1.1. Tech Stack

- **Framework:** TanStack Start (Vite + React + file-based routing)
- **UI:** shadcn/ui + Tailwind CSS
- **Rich Text Editor:** TipTap (StarterKit + Underline + Placeholder)
- **State:** Zustand (persisted)
- **Icons:** Lucide React
- **Charts:** Recharts
- **DnD:** @dnd-kit (quiz builder — planned)

### 1.2. Reference Projects

- `gkebook-school-frontend` — design system, color tokens
- `prj-gkebook-shadcn-frontend` — shadcn sidebar pattern, globals.css

### 1.3. Reference Screenshots

- **Quiz Builder:** GKebook Studio (visual thumbnail palette 2 cột, rich text editor, AI panel phải)
- **Library:** YouTube Studio "Nội dung của kênh" (table với thumbnail, status columns)
- **Left Menu:** YouTube Studio sidebar (icon + text, auto-collapse)

---

## 2. Design System

### 2.1. Color Tokens (from `prj-gkebook-shadcn-frontend`)

| Token     | Value                             | Usage                                       |
| --------- | --------------------------------- | ------------------------------------------- |
| Primary   | `blue-900` (#1e3a8a)              | Active sidebar, primary buttons, "Xuất bản" |
| Active bg | `data-[active=true]:!bg-blue-900` | Sidebar menu active state                   |
| Accent    | `blue-600` (#2563EB)              | Links, AI highlights, secondary             |
| Body text | `#414651`                         | All nav text via `text-[#414651]`           |
| Nav text  | `font-semibold`                   | Sidebar menu labels                         |

### 2.2. Sidebar Pattern (shadcn)

```tsx
<Sidebar collapsible="icon" variant="floating">
  <SidebarHeader> // Logo + "Content Studio"
  <SidebarContent>
    // "Tạo mới" dropdown button (Creator only)
    // Nav sections with active state
    // Settings at bottom (mt-auto)
  </SidebarContent>
  <SidebarFooter> // User avatar + name + type
</Sidebar>
```

- **Auto-collapse:** `_app.tsx` detects `/builder/*` routes → key-based re-render with `defaultOpen={false}`

---

## 3. Navigation Structure

### 3.1. Creator Role

```
[GK Logo + "Content Studio"]
[Button: ➕ Tạo mới]  ← Dropdown: Bộ đề | Học liệu

── CHÍNH ──
🏠 Trang chủ          /dashboard
📚 Thư viện của tôi   /library
✅ Xác minh           /verification
🎨 Tuỳ chỉnh kênh    /channel

── Bottom ──
⚙️ Cài đặt            /settings
[User card]
```

### 3.2. Admin Role

```
── CHÍNH ──
🏠 Trang chủ          /dashboard
📋 Duyệt nội dung     /admin (badge count)
👥 Quản lý người dùng /admin
```

Admin: KHÔNG có Tạo mới, KHÔNG có Thư viện, KHÔNG có Kênh

---

## 4. Page Specifications (v3 — Gaps Fixed)

### 4.1. Quiz Builder (/builder/quiz/$id) — ⚠️ MAJOR REWORK v3

**Layout:** 3-panel (Palette | Canvas | AI Panel)

**Toolbar (matching GKebook reference):**

```
← [Avatar] "Tiêu đề của đề ✏️" · Tổng điểm: N · ⚙️[Tự động theo tổng từng câu] ··· [Xem trước] [Thiết lập] [Xuất bản]
```

**Left Panel — Palette:**

- Visual thumbnail cards in 2-column grid
- 10 question types: Trắc nghiệm, Tự luận, Ghép đôi, Hộp thả, Kéo thả, Sắp xếp, Trả lời bằng video, Trả lời bằng ghi âm, Nhận dạng, Điểm đánh dấu
- Each card: colored icon + label, hover animation
- "Kéo loại câu hỏi" zone at bottom

**Center — Canvas:**

- QuestionCard components with:
  - Top bar: media buttons (image, mic, video, settings) + points input
  - Rich text editor (TipTap: bold, italic, underline, strikethrough, math formula)
  - Answer section per type (multiple choice with correct marking, matching pairs, essay, video/audio)
  - Bottom: points display
- Background: `bg-gray-50/50` for depth
- Empty state: icon + text prompt

**Right Panel — AI:**

- Header: "Tạo câu hỏi bằng AI" with sparkle icon
- Quick action button
- Chat-style messages (user blue bubbles, AI gray bubbles)
- Input: Plus button + text field + sparkle send button

**Dialogs:**

- Preview: shows student-facing view with correct answers highlighted
- Settings: exam time, retries, shuffle questions/answers

### 4.2. Library (/library) — ⚠️ REWORK v3

**YouTube Studio-style content table:**

```
[H1: Thư viện của tôi]
[Type tabs: Tất cả | Bộ đề | Học liệu] — underline border-bottom style
[Status pills: Tất cả | Nháp | Chờ duyệt | Đã xuất bản | Bị từ chối]

┌──────┬─────────────────────────┬──────────┬──────────┬────────┬─────────┬──────────┬────┐
│  ☐   │ Nội dung (thumb+title)  │ Hiển thị │ Ngày tạo │ Xem    │ BL      │ Thích %  │ •••│
├──────┼─────────────────────────┼──────────┼──────────┼────────┼─────────┼──────────┼────┤
│  ☐   │ [■] Title + subject     │ Badge    │ 09/06    │ 1,234  │ 5       │ 92%      │ ✏️ │
└──────┴─────────────────────────┴──────────┴──────────┴────────┴─────────┴──────────┴────┘
[Pagination: Số hàng mỗi trang: 30  · 1 - N/N]
```

- Checkbox for bulk select
- Thumbnail (colored box + type icon) + title + subject
- StatusBadge component
- Draft items show "Sửa" button, others show ••• dropdown
- Pagination footer

### 4.3. Dashboard (/dashboard) — Kept v2 (already good)

**Creator:**

1. AI Insights banner (TOP, gradient, 2x2 grid)
2. Stat cards (4): Nội dung, Lượt xem, Lượt thích, Chờ duyệt
3. Area chart (views + likes) + Pie chart (distribution)
4. Activity feed + Top content (#1-3 with trend %)

**Admin:** Stat cards + Bar chart + Pending review list

### 4.4. Channel (/channel) — Kept v2

Dual mode:

- **Edit:** Form (name, bio, website, cover, avatar). Business: +managers, +license
- **Preview:** YouTube-style public view (header + content grid + tabs)

### 4.5. Verification (/verification) — Kept v2

Single badge, different requirements:

| Cá nhân              | Doanh nghiệp         |
| -------------------- | -------------------- |
| 5+ content published | 3+ content published |
| 500+ views           | Business license     |
| Complete profile     | Business info        |
| Certificates/degrees | Official website     |

Flow: Creator apply → Admin review → Grant/Reject badge

### 4.6. Admin (/admin) — Kept v2

Two tabs:

1. Content review (sub-tabs: pending/published/rejected)
2. Verification review (approve/reject badge applications)

### 4.7. Material Builder (/builder/material/$id) — Kept

Upload/link form + metadata + preview dialog

### 4.8. Settings (/settings) — Kept

Notifications + language + logout

---

## 5. Account Types

| Feature        | Cá nhân  | Doanh nghiệp  | Admin |
| -------------- | -------- | ------------- | ----- |
| Tạo nội dung   | ✅       | ✅            | ❌    |
| Duyệt nội dung | ❌       | ❌            | ✅    |
| Quản trị kênh  | Solo     | Multi-manager | ❌    |
| Xác minh       | Bằng cấp | Giấy phép KD  | —     |
| ĐKKD field     | ❌       | ✅            | —     |

---

## 6. Skeleton Loading System

| Component           | Usage                                       |
| ------------------- | ------------------------------------------- |
| `PageSkeleton`      | Generic: logo spin + "Đang tải..."          |
| `DashboardSkeleton` | AI banner + stat cards + chart placeholders |
| `LibrarySkeleton`   | Title + tabs + pills + table rows           |
| `BuilderSkeleton`   | Toolbar + 3-panel skeleton                  |
| `CardSkeleton`      | Generic card placeholder                    |

---

## 7. File Map (v3)

### Routes

```
routes/
├── __root.tsx
├── index.tsx              → redirect to /login
├── login.tsx              (role card selection)
├── _app.tsx               (layout: SidebarProvider + auto-collapse)
├── _app.dashboard.tsx     (AI top + charts + top content)
├── _app.library.tsx       (YouTube Studio-style table) ← v3 REWORK
├── _app.admin.tsx         (content + verification review tabs)
├── _app.verification.tsx  (single badge + requirements + apply)
├── _app.channel.tsx       (edit mode + public preview mode)
├── _app.settings.tsx      (notifications + language)
├── _app.builder.quiz.$id.tsx     ← v3 MAJOR REWORK
└── _app.builder.material.$id.tsx
```

### Components

```
components/
├── app-sidebar.tsx        (shadcn Sidebar)
├── nav-data.ts            (navigation config)
├── header.tsx
├── stat-card.tsx
├── content-table.tsx      (legacy, still used)
├── status-badge.tsx
├── role-switcher.tsx
├── verified-badge.tsx     (single: none/pending/verified)
├── page-skeleton.tsx      (skeleton loading system)
├── quiz/
│   ├── palette.tsx        ← v3 REWORK (visual thumbnail cards)
│   ├── question-card.tsx  ← v3 REWORK (rich editor + answer sections)
│   ├── ai-panel.tsx       ← v3 REWORK (chat-style AI)
│   └── rich-editor.tsx    ← v3 NEW (TipTap editor)
└── ui/                    (shadcn — keep as-is)
```

---

## 8. Checklist (v3)

- [x] Clean styles.css + TipTap CSS
- [x] Build app-sidebar.tsx with shadcn Sidebar
- [x] Build \_app.tsx layout (SidebarProvider + auto-collapse)
- [x] Login page — role cards
- [x] Dashboard — AI on top + stat cards + charts + top content
- [x] Library — **YouTube Studio-style table** (v3 rework)
- [x] Quiz Builder — **GKebook-matching UI** (v3 rework)
  - [x] Visual thumbnail palette (2-col grid)
  - [x] Toolbar: avatar + editable title + points + auto-scoring + Xem trước/Thiết lập/Xuất bản
  - [x] Rich text editor (TipTap)
  - [x] Answer sections per question type
  - [x] Settings dialog
- [x] Material Builder — form + preview + delete
- [x] Admin — content + verification review
- [x] Verification — single badge + personal/business requirements
- [x] Channel — edit mode + public preview mode
- [x] Settings — kept from v2
- [x] Skeleton loading components
- [x] TypeScript 0 errors
- [x] ESLint 0 errors
