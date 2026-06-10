# Unified Studio UI Refactor — Design Spec

**Date:** 2026-06-10
**Status:** Approved

## Summary

Refactor GK Content Studio to unify the 3-shell architecture into a single role-based interface, redesign Library with YouTube Studio-inspired table view, restructure Channel tabs, differentiate Verification states, and update Login branding.

---

## 1. Unified Shell — Single Sidebar Per Role

### Current State
- 3 separate shells: Creator Studio, Org Studio, Admin Console
- Each has its own sidebar, route prefix, bottom nav
- Users switch between shells via a switcher component

### New Design
- **One `ContentStudioShell`** with a single sidebar
- Sidebar sections based on role (section headers divide navigation groups):
  - **Cá nhân:** Trang chủ, Thư viện của tôi, Kênh của tôi, Xác minh tài khoản
  - **Tổ chức** (publisher/admin only): Thư viện tổ chức, Kênh tổ chức, Quản lý thành viên, Xác minh tổ chức
  - **Quản trị** (admin only): Tổng quan, Quản lý người dùng, Duyệt nội dung, Duyệt xác minh, Báo cáo vi phạm
  - **Footer:** Cài đặt
- Header: Remove shell title/eyebrow, keep logo + search + create + notifications + avatar
- Mobile bottom nav: Trang chủ, Thư viện, [+], Kênh, Thêm (overflow includes org/admin items when available)
- Route prefixes (`/creator`, `/org`, `/admin`) remain for data scoping, but shell is unified

### Role → Nav Mapping
| Role | Cá nhân | Tổ chức | Quản trị |
|------|---------|---------|----------|
| teacher | ✓ | — | — |
| verified_teacher | ✓ | — | — |
| publisher | ✓ | ✓ | — |
| admin | ✓ | ✓ | ✓ |

---

## 2. Library — Tabs by Creator Type + Table/Grid Toggle

### Current State
- 3-zone segmented control (Sản phẩm xuất bản / Học liệu tương tác / Tệp đính kèm)
- Card grid only
- Subtype filter chips within each zone

### New Design
- **4 horizontal tabs** (YouTube Studio style): `Bộ sách` · `Khóa học` · `Học liệu tương tác` · `Tệp đính kèm`
- Each tab maps to one creation type from the "Tạo mới" dialog
- Within each tab: subtype filter chips (e.g. Học liệu tương tác → Quiz / Bài giảng / Nâng cao / SCORM)
- **Table/Grid toggle** at top-right, default = table
- **Table view:** YouTube Studio-inspired — checkbox, thumbnail+title, type label, status badge, date, views, actions (edit/delete)
- **Grid view:** Current card layout
- Status filter chips remain (Nháp / Chờ duyệt / Đã xuất bản / Bị từ chối)
- Applied to both "Thư viện của tôi" and "Thư viện tổ chức"

### Tab → Types Mapping
| Tab | MaterialType filter |
|-----|-------------------|
| Bộ sách | `book` |
| Khóa học | `course` |
| Học liệu tương tác | `quiz`, `lesson`, `advanced`, `scorm` |
| Tệp đính kèm | `document`, `video`, `image`, `audio`, `3d_vr` |

---

## 3. Channel — Card Grid + 2 Tabs + Filter Chips

### Current State
- 3 tabs: Học liệu / Bộ đề / Giới thiệu
- Responsive issues

### New Design
- **2 tabs:** `Nội dung` + `Giới thiệu`
- Tab "Nội dung": default show all published content, with horizontal **filter chips** (Tất cả · Sách · Khóa học · Quiz · Video · Tài liệu · ...)
- Keep **card grid** display (public-facing page)
- Add more demo data for richer channel appearance
- Fix responsive: banner, avatar, bio, tabs must work well on mobile
- Fix routing for "Chỉnh sửa kênh" link

---

## 4. Verification — Differentiated States

### Current State
- Same UI (checklist + progress) for all accounts regardless of verification status

### New Design
- **Unverified accounts:** Keep current checklist UI (criteria list, progress bar, submit button)
- **Verified accounts** (L2 or verified): Show success state:
  - Large ✓ badge with subtle animation
  - Verification date, level (L1/L2)
  - Benefits list: auto-publish, priority display, blue badge on channel
  - "Xem chính sách duy trì xác minh" link

---

## 5. Login — Real Logo

- Replace the `GK` square placeholder in login header with `/assets/logo/Logomark.svg`
- Keep existing layout and animations unchanged
