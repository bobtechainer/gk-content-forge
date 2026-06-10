# GK Content Studio v2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild GK Content Studio with 3 separate app shells (Creator/Organization/Admin), 9 material types, full responsive design, verification system with AI suggestions, and differentiated settings/dashboard/channel per account type.

**Architecture:** TanStack Router file-based routing with 3 independent layout routes (`_creator`, `_org`, `_admin`). Each layout has its own sidebar, navigation, and page set. Shared components (FileIcon, StatusBadge, VerifiedBadge, UI primitives) live in `components/shared/`. Account-specific components live in `components/creator/`, `components/org/`, `components/admin/`.

**Tech Stack:** React 19, TanStack Router, shadcn/ui, Recharts, Tailwind-free vanilla CSS (existing `styles.css`), Lucide icons + SVG icons from gkebook.

**Spec:** `docs/superpowers/specs/2026-06-10-content-studio-v2-design.md`

---

## Phase 1: Foundation — Types, Data, Shared Components

### Task 1: Update Type System

**Files:**

- Modify: `src/lib/types.ts`

- [ ] **Step 1: Rewrite types.ts with new account and material type system**

```typescript
// src/lib/types.ts
export type AccountType = "personal" | "organization" | "admin";
export type VerificationStatus = "none" | "pending" | "verified" | "rejected";

export type MaterialType =
  | "course"
  | "book"
  | "quiz"
  | "lesson"
  | "document"
  | "video"
  | "image"
  | "audio"
  | "3d_vr"
  | "scorm"
  | "advanced";

export type ContentStatus = "draft" | "published" | "pending" | "rejected";
export type Platform = "national" | "ebooks";
export type OrgRole = "owner" | "manager" | "editor";

export interface Account {
  id: string;
  name: string;
  shortName: string;
  accountType: AccountType;
  verified: VerificationStatus;
  avatarColor: string;
  bio: string;
  followers: number;
  managers?: OrgMember[];
  businessLicense?: string;
  website?: string;
  email?: string;
}

export interface OrgMember {
  email: string;
  name: string;
  role: OrgRole;
  joinedAt: string;
}

export interface ContentItem {
  id: string;
  title: string;
  materialType: MaterialType;
  status: ContentStatus;
  ownerId: string;
  ownerName?: string;
  createdAt: string;
  views: number;
  likes: number;
  shares: number;
  thumbnailColor: string;
  subject: string;
  grade: string;
  platforms: Platform[];
  tags: string[];
  description: string;
  fileExtension?: string;
  fileName?: string;
}

export interface VerificationChecklist {
  credentials: boolean;
  minMaterials: boolean;
  minViews: boolean;
  profileComplete: boolean;
  businessLicense?: boolean;
  domainEmail?: boolean;
}

export interface VerificationRequest {
  id: string;
  applicantId: string;
  accountType: AccountType;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt?: string;
  documents: string[];
  reason?: string;
}

export type QuestionType =
  | "multiple_choice"
  | "essay"
  | "matching"
  | "dropbox"
  | "drag_drop"
  | "ordering"
  | "video"
  | "audio"
  | "recognition"
  | "marker";

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: { id: string; text: string }[];
  correctOptionId?: string;
  essayAnswer?: string;
  pairs?: { id: string; left: string; right: string }[];
  duration: number;
  points: number;
  required: boolean;
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "refactor: update type system for 3 app shells and 9 material types"
```

### Task 2: Update Mock Data

**Files:**

- Modify: `src/lib/mock-data.ts`

- [ ] **Step 1: Rewrite mock-data.ts with new account structure and diverse material types**

Update `ACCOUNTS` to use new `AccountType` values ("personal"/"organization"/"admin"). Add mock content items covering all 11 material types. Add sample OrgMembers for the publisher account. Keep ANALYTICS and CONTENT_DISTRIBUTION data. Update CONTENT_DISTRIBUTION to reflect 11 types.

- [ ] **Step 2: Verify no TypeScript errors**
- [ ] **Step 3: Commit**

### Task 3: Copy Icons from gkebook

**Files:**

- Create: `public/book/*.svg` (copy from gkebook-school-frontend)
- Create: `src/components/shared/file-icon.tsx`

- [ ] **Step 1: Copy SVG icon files**

```powershell
Copy-Item -Path "c:\Trường học số - source code\gkebook-school-frontend\public\book\*" -Destination "c:\Trường học số - source code\gk-content-forge\public\book\" -Recurse -Force
```

- [ ] **Step 2: Create FileIcon component**

Port `FileIcon` from gkebook-school-frontend, adapting imports for the new project structure. Same logic: map file extension to SVG icon path.

- [ ] **Step 3: Create MaterialTypeIcon component**

New component that maps `MaterialType` to an appropriate icon from the copied SVG set:

- course → course icon
- book → book icon
- quiz → exam icon (or create simple SVG)
- lesson → doc.svg
- document → document.svg
- video → mp4.svg
- image → image.svg
- audio → audio.svg
- 3d_vr → use a 3D-related icon
- scorm → code.svg
- advanced → html.svg

- [ ] **Step 4: Commit**

### Task 4: Shared UI Components

**Files:**

- Keep existing: `src/components/ui/*` (shadcn primitives)
- Move: `src/components/status-badge.tsx` → `src/components/shared/status-badge.tsx`
- Move: `src/components/verified-badge.tsx` → `src/components/shared/verified-badge.tsx`
- Move: `src/components/stat-card.tsx` → `src/components/shared/stat-card.tsx`
- Move: `src/components/content-table.tsx` → `src/components/shared/content-table.tsx`
- Move: `src/components/page-skeleton.tsx` → `src/components/shared/page-skeleton.tsx`
- Create: `src/components/shared/logo-loader.tsx`

- [ ] **Step 1: Create shared/ directory and move existing shared components**
- [ ] **Step 2: Update all import paths across the codebase**
- [ ] **Step 3: Create LogoLoader component** — Trường học số logo with pulse animation for skeleton loading
- [ ] **Step 4: Update PageSkeleton to use LogoLoader**
- [ ] **Step 5: Verify no errors, commit**

---

## Phase 2: Three App Shell Layouts

### Task 5: Creator Layout & Sidebar

**Files:**

- Create: `src/routes/_creator.tsx`
- Create: `src/components/creator/creator-sidebar.tsx`
- Create: `src/components/creator/creator-header.tsx`
- Create: `src/components/creator/creator-bottom-nav.tsx`

- [ ] **Step 1: Create CreatorSidebar component**

Navigation items: Trang chủ, Thư viện của tôi, Tạo mới (primary button style), Kênh của tôi, Xác minh tài khoản, Cài đặt. Use Lucide icons. Collapsible on desktop, hidden on mobile.

- [ ] **Step 2: Create CreatorBottomNav component**

Mobile only (< 768px). 5 items: Trang chủ, Thư viện, Tạo mới (center prominent), Kênh, Thêm (dropdown menu with Xác minh + Cài đặt).

- [ ] **Step 3: Create CreatorHeader component**

Search bar (desktop inline, mobile icon→overlay), notification bell, user avatar + name + verified badge, role switcher (dev only).

- [ ] **Step 4: Create \_creator.tsx layout route**

Wraps CreatorSidebar + CreatorHeader + CreatorBottomNav + `<Outlet />`. Auto-collapse sidebar on builder routes.

- [ ] **Step 5: Verify layout renders, commit**

### Task 6: Organization Layout & Sidebar

**Files:**

- Create: `src/routes/_org.tsx`
- Create: `src/components/org/org-sidebar.tsx`
- Create: `src/components/org/org-header.tsx`
- Create: `src/components/org/org-bottom-nav.tsx`

- [ ] **Step 1-4: Same pattern as Task 5** but with Organization nav items:

Trang chủ, Thư viện tổ chức, Tạo mới, Kênh tổ chức, Quản lý thành viên, Xác minh tổ chức, Cài đặt.

Bottom nav: Trang chủ, Thư viện, Tạo mới, Kênh, Thêm (Thành viên, Xác minh, Cài đặt).

- [ ] **Step 5: Commit**

### Task 7: Admin Layout & Sidebar

**Files:**

- Create: `src/routes/_admin.tsx`
- Create: `src/components/admin/admin-sidebar.tsx`
- Create: `src/components/admin/admin-header.tsx`

- [ ] **Step 1-3: Create AdminSidebar, AdminHeader**

Nav items: Tổng quan, Quản lý người dùng, Duyệt nội dung (badge count), Duyệt xác minh (badge count), Báo cáo vi phạm (badge count), Cấu hình hệ thống.

No bottom nav — admin uses hamburger drawer on mobile/tablet.

- [ ] **Step 4: Create \_admin.tsx layout route**
- [ ] **Step 5: Commit**

### Task 8: Update Login & Routing

**Files:**

- Modify: `src/routes/login.tsx`
- Modify: `src/routes/index.tsx`
- Remove: `src/routes/_app.tsx` (old shared layout)
- Remove: `src/routes/_app.*.tsx` (all old route files)
- Modify: `src/stores/session.ts`

- [ ] **Step 1: Update session store** — add accountType to session state
- [ ] **Step 2: Update login page** — after login, redirect based on accountType:
  - personal → `/creator/dashboard`
  - organization → `/org/dashboard`
  - admin → `/admin/dashboard`
- [ ] **Step 3: Update role switcher** — when switching role, navigate to correct app shell
- [ ] **Step 4: Remove all old `_app.*` route files** (they'll be replaced by new routes)
- [ ] **Step 5: Verify login flow works, commit**

---

## Phase 3: Creator Pages

### Task 9: Creator Dashboard

**Files:**

- Create: `src/routes/_creator.dashboard.tsx`
- Create: `src/components/creator/ai-assistant-card.tsx`
- Create: `src/components/creator/analytics-chart.tsx`

- [ ] **Step 1: Create AIAssistantCard** — gradient background, sparkle icon, typing animation for suggestions, 3 rotating AI tips
- [ ] **Step 2: Create AnalyticsChart** — Recharts line chart with 7/30/90 day toggle, entrance animation
- [ ] **Step 3: Create CreatorDashboard page** — Layout order: AI Card → Stat Cards (4-grid) → Line Chart → Donut Chart (9 material types) → Top Content table → Activity Timeline
- [ ] **Step 4: Add skeleton loading state with LogoLoader**
- [ ] **Step 5: Test responsive: desktop 4-col grid → mobile 2x2 stack**
- [ ] **Step 6: Commit**

### Task 10: Creator Library

**Files:**

- Create: `src/routes/_creator.library.tsx`
- Create: `src/components/shared/material-tabs.tsx`
- Create: `src/components/shared/status-filter-chips.tsx`
- Create: `src/components/shared/content-card.tsx`

- [ ] **Step 1: Create MaterialTabs** — Segmented control for 3 main zones (Sản phẩm, Tương tác, Tệp đính kèm). Within each zone, show horizontal scrollable tabs for specific material types (e.g., Sách | Khóa học).
- [ ] **Step 2: Create StatusFilterChips** — toggle chips: Nháp, Chờ duyệt, Đã xuất bản, Bị từ chối
- [ ] **Step 3: Create ContentCard** — FileIcon + title + status badge + date + views + likes + action menu (⋮)
- [ ] **Step 4: Create CreatorLibrary page** — MaterialTabs + StatusFilterChips + ContentCard grid. Filter by zone -> materialType + status.
- [ ] **Step 5: Skeleton loading, responsive test**
- [ ] **Step 6: Commit**

### Task 11: Creator Studio (Tạo mới)

**Files:**

- Create: `src/routes/_creator.studio.new.tsx`
- Create: `src/components/shared/material-type-picker.tsx`
- Create: `src/components/shared/material-upload-form.tsx`

- [ ] **Step 1: Create MaterialTypePicker Hub** — Large Modal/Sheet grouped into 3 sections (Sản phẩm xuất bản [Book, Course], Học liệu tương tác, Tệp đính kèm). Navigate to specific builders (Book Builder, Course Builder, Quiz Builder) or form upload.
- [ ] **Step 2: Create MaterialUploadForm** — Dropdown format selector (file types vary by material type), drag-drop file zone, metadata fields (title, description, subject dropdown, grade dropdown, tags multi-select), action bar: [Lưu nháp] [Xem trước ↗] [Xuất bản]
- [ ] **Step 3: Create the Studio New page** — shows MaterialTypePicker Hub on load
- [ ] **Step 4: Wire quiz/book/course selection to their builder routes**
- [ ] **Step 5: Responsive test, commit**

### Task 12: Creator Channel

**Files:**

- Create: `src/routes/_creator.channel.tsx` (public view)
- Create: `src/routes/_creator.channel.edit.tsx` (edit mode)
- Create: `src/components/shared/channel-public-view.tsx`
- Create: `src/components/shared/channel-edit-form.tsx`

- [ ] **Step 1: Create ChannelPublicView** — Banner, avatar overlay, name + badge, bio, follower count, follow button, tab bar (Học liệu | Bộ đề | Giới thiệu), content grid
- [ ] **Step 2: Create ChannelEditForm** — Upload/crop banner, upload/crop avatar, name input, bio textarea, website URL input, pinned content selector, action bar [Hủy] [Xem trước ↗] [Lưu]
- [ ] **Step 3: Wire routes, test navigation between view/edit modes**
- [ ] **Step 4: Responsive test, commit**

### Task 13: Creator Verification

**Files:**

- Create: `src/routes/_creator.verification.tsx`
- Create: `src/components/shared/verification-checklist.tsx`

- [ ] **Step 1: Create VerificationChecklist** — Progress bar at top showing X/4 complete. 4 criteria rows, each with: icon (✅/❌), label, current value vs threshold, CTA button or AI suggestion text. When 4/4 → "Gửi đơn xin xác minh" button activates.
- [ ] **Step 2: Create CreatorVerification page** — uses VerificationChecklist with personal thresholds (5 materials, 500 views, credentials, profile)
- [ ] **Step 3: Responsive test, commit**

### Task 14: Creator Settings

**Files:**

- Create: `src/routes/_creator.settings.tsx`

- [ ] **Step 1: Create CreatorSettings page** — Tabbed or section-based layout:
  - Hồ sơ cá nhân (name, bio, avatar, cover, website links)
  - Bảo mật (password, 2FA)
  - Giao diện (language, theme)
  - Thông báo (email, push toggles)
  - Quyền riêng tư (hide channel, allow citations)
- [ ] **Step 2: Responsive test, commit**

### Task 15: Creator Quiz Builder (migrate existing)

**Files:**

- Create: `src/routes/_creator.builder.quiz.$id.tsx`
- Keep: `src/components/quiz/*` (palette, question-card, rich-editor, ai-panel)

- [ ] **Step 1: Create new route file** — copy logic from old `_app.builder.quiz.$id.tsx`, update imports to use new shared components and creator layout
- [ ] **Step 2: Add Preview button** next to Save Draft — opens new tab with public view
- [ ] **Step 3: Verify quiz builder works within creator layout, sidebar auto-collapses**
- [ ] **Step 4: Commit**

### Task 15.5: Unified Book & Course Builders

**Files:**

- Create: `src/routes/_creator.builder.book.$id.tsx`
- Create: `src/routes/_creator.builder.course.$id.tsx`

- [ ] **Step 1: Port Book Studio UI** — migrate the logic from `prj-gkebook-shadcn-frontend/src/components/studio` but wrap it in the new unified builder layout (Top action bar with Preview/Save, auto-collapsing sidebar).
- [ ] **Step 2: Scaffolding Course Builder** — create empty state shell for Course Builder using the same unified layout.
- [ ] **Step 3: Commit**

### Task 16: Creator Material Builder (form upload)

**Files:**

- Create: `src/routes/_creator.builder.material.$id.tsx`

- [ ] **Step 1: Create route** — reuses MaterialUploadForm from Task 11 with pre-filled data for editing existing materials
- [ ] **Step 2: Add Preview button**
- [ ] **Step 3: Responsive test, commit**

---

## Phase 4: Organization Pages

### Task 17: Organization Dashboard

**Files:**

- Create: `src/routes/_org.dashboard.tsx`

- [ ] **Step 1: Create OrgDashboard** — Same structure as CreatorDashboard but adds: member contribution bar chart, active members list with avatars
- [ ] **Step 2: Responsive test, commit**

### Task 18: Organization Library

**Files:**

- Create: `src/routes/_org.library.tsx`

- [ ] **Step 1: Create OrgLibrary** — Reuses MaterialTabs + StatusFilterChips + ContentCard from Task 10. Additional "Người tạo" column in content cards to show which member created each item.
- [ ] **Step 2: Commit**

### Task 19: Organization Members

**Files:**

- Create: `src/routes/_org.members.tsx`
- Create: `src/components/org/member-management.tsx`

- [ ] **Step 1: Create MemberManagement** — Member list table (avatar, name, email, role badge, joined date, actions). Invite form (email input + role dropdown). Role change dropdown (Owner/Manager/Editor). Remove member button with confirmation dialog.
- [ ] **Step 2: Create OrgMembers page**
- [ ] **Step 3: Responsive test, commit**

### Task 20: Organization Channel, Verification, Settings, Builders

**Files:**

- Create: `src/routes/_org.channel.tsx`
- Create: `src/routes/_org.channel.edit.tsx`
- Create: `src/routes/_org.verification.tsx`
- Create: `src/routes/_org.settings.tsx`
- Create: `src/routes/_org.studio.new.tsx`
- Create: `src/routes/_org.builder.quiz.$id.tsx`
- Create: `src/routes/_org.builder.book.$id.tsx`
- Create: `src/routes/_org.builder.course.$id.tsx`
- Create: `src/routes/_org.builder.material.$id.tsx`

- [ ] **Step 1: Org Channel** — Reuse ChannelPublicView/ChannelEditForm. Edit mode adds link to member management.
- [ ] **Step 2: Org Verification** — Reuse VerificationChecklist with org thresholds (10 materials, 2000 views, business license, domain email)
- [ ] **Step 3: Org Settings** — Sections: Hồ sơ tổ chức, Quản lý thành viên (link), Nền tảng phân phối, Bảo mật, Giao diện, Thông báo
- [ ] **Step 4: Org Studio/Builders** — Same as creator versions, wrapped in org layout
- [ ] **Step 5: Commit**

---

## Phase 5: Admin Pages

### Task 21: Admin Dashboard

**Files:**

- Create: `src/routes/_admin.dashboard.tsx`

- [ ] **Step 1: Create AdminDashboard** — Stat cards (total users, pending content, pending verifications, reports). System growth line chart. Account type distribution pie chart. Processing queue (latest pending items + "Duyệt ngay" CTA).
- [ ] **Step 2: Responsive test, commit**

### Task 22: Admin Users

**Files:**

- Create: `src/routes/_admin.users.tsx`

- [ ] **Step 1: Create AdminUsers** — User table (avatar, name, type badge, verified badge, status, joined date, actions). Search/filter bar. Lock/unlock account toggle. View user detail modal.
- [ ] **Step 2: Commit**

### Task 23: Admin Content Review

**Files:**

- Create: `src/routes/_admin.content-review.tsx`

- [ ] **Step 1: Create AdminContentReview** — Pending content queue (title, type, author, submitted date). Click to expand → preview content + metadata. Action buttons: [Phê duyệt] [Từ chối + lý do input].
- [ ] **Step 2: Commit**

### Task 24: Admin Verification Requests

**Files:**

- Create: `src/routes/_admin.verification-requests.tsx`

- [ ] **Step 1: Create AdminVerificationRequests** — Pending requests list. Click to expand → uploaded documents viewer, applicant stats (materials count, views, account age), checklist review. Actions: [Phê duyệt] [Từ chối + lý do].
- [ ] **Step 2: Commit**

### Task 25: Admin Reports & Settings

**Files:**

- Create: `src/routes/_admin.reports.tsx`
- Create: `src/routes/_admin.settings.tsx`

- [ ] **Step 1: Admin Reports** — Reported content list with reason, reporter, date. Actions: Remove content, Dismiss report, Warn user.
- [ ] **Step 2: Admin Settings** — System config: verification thresholds (editable numbers), subject/grade/tag management (CRUD lists), banned keywords config.
- [ ] **Step 3: Commit**

---

## Phase 6: Responsive Polish & Cleanup

### Task 26: Responsive Audit

**Files:**

- Modify: `src/styles.css`
- Modify: various component files

- [ ] **Step 1: Define breakpoint CSS custom properties** — `--bp-mobile: 768px`, `--bp-tablet: 1024px`
- [ ] **Step 2: Audit all pages at 375px, 768px, 1024px, 1440px** — Fix text overflow, hidden content, touch target sizes (min 44x44px)
- [ ] **Step 3: Ensure tab bar scroll-x works with fade edge indicators on mobile**
- [ ] **Step 4: Verify quiz builder 3-panel → mobile tab-switch layout**
- [ ] **Step 5: Test form upload layout: desktop 2-col → mobile 1-col stack**
- [ ] **Step 6: Commit**

### Task 27: Skeleton Loading

**Files:**

- Modify: all page route files

- [ ] **Step 1: Add skeleton loading state to every page** — Logo pulse animation → card/chart skeleton fade-in
- [ ] **Step 2: Verify skeleton appears on route transitions**
- [ ] **Step 3: Commit**

### Task 28: Cleanup Old Files

**Files:**

- Remove: `src/routes/_app.tsx`
- Remove: `src/routes/_app.dashboard.tsx`
- Remove: `src/routes/_app.library.tsx`
- Remove: `src/routes/_app.channel.tsx`
- Remove: `src/routes/_app.settings.tsx`
- Remove: `src/routes/_app.verification.tsx`
- Remove: `src/routes/_app.admin.tsx`
- Remove: `src/routes/_app.builder.quiz.$id.tsx`
- Remove: `src/routes/_app.builder.material.$id.tsx`
- Remove: `src/components/app-sidebar.tsx`
- Remove: `src/components/nav-data.ts`

- [ ] **Step 1: Delete all old route and component files**
- [ ] **Step 2: Verify no broken imports**
- [ ] **Step 3: Run dev server, navigate all routes**
- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete GK Content Studio v2 rebuild with 3 app shells"
```
