# GK Content Studio Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild entire GK Content Studio UI from scratch, matching reference projects' design system, with clear role separation.

**Architecture:** TanStack Start file-based routing with shadcn/ui Sidebar layout (SidebarProvider pattern from prj-gkebook-shadcn-frontend). Zustand for state. No framer-motion — CSS transitions only.

**Tech Stack:** TanStack Start, shadcn/ui, Tailwind CSS, Zustand, Recharts, Lucide React

---

## File Map

### Keep (no changes)

- `src/components/ui/*` — All 45 shadcn components
- `src/lib/types.ts` — Type definitions
- `src/lib/mock-data.ts` — Mock data + ACCOUNTS
- `src/stores/session.ts` — Session store
- `src/stores/content.ts` — Content store
- `src/lib/utils.ts` — cn() utility

### Delete (old Lovable UI)

- `src/components/app-shell.tsx` — Old sidebar
- `src/components/animated-counter.tsx`
- `src/components/content-table.tsx`
- `src/components/publish-sheet.tsx`
- `src/components/stat-card.tsx`
- `src/components/status-badge.tsx`
- `src/components/role-switcher.tsx`
- `src/components/verified-badge.tsx`
- `src/components/quiz/*`
- `src/lib/motion.ts`
- `src/routes/_app.analytics.tsx`
- `src/routes/_app.content.tsx`
- `src/routes/_app.materials.tsx`
- `src/routes/_app.quizzes.tsx`

### Create (new)

- `src/styles.css` — Clean tokens from reference
- `src/components/app-sidebar.tsx` — shadcn Sidebar
- `src/components/nav-data.ts` — Navigation config
- `src/components/header.tsx` — Header with SidebarTrigger
- `src/components/stat-card.tsx` — Clean stat cards
- `src/components/content-table.tsx` — Clean data table
- `src/components/status-badge.tsx` — Status chips
- `src/components/role-switcher.tsx` — Role switcher (header)
- `src/components/verified-badge.tsx` — Badge icon
- `src/components/quiz/palette.tsx`
- `src/components/quiz/question-card.tsx`
- `src/components/quiz/ai-panel.tsx`

### Rewrite (same path, new content)

- `src/routes/__root.tsx`
- `src/routes/_app.tsx`
- `src/routes/login.tsx`
- `src/routes/_app.dashboard.tsx`
- `src/routes/_app.library.tsx`
- `src/routes/_app.admin.tsx`
- `src/routes/_app.verification.tsx`
- `src/routes/_app.channel.tsx`
- `src/routes/_app.settings.tsx`
- `src/routes/_app.builder.quiz.$id.tsx`
- `src/routes/_app.builder.material.$id.tsx`

---

### Task 1: Clean Slate — Delete old files & reset CSS

**Files:**

- Delete: All files listed in "Delete" section above
- Rewrite: `src/styles.css`
- Delete: `src/lib/motion.ts`

- [ ] **Step 1: Delete old component files**

```bash
# Delete old components
Remove-Item "src/components/app-shell.tsx" -Force
Remove-Item "src/components/animated-counter.tsx" -Force
Remove-Item "src/components/content-table.tsx" -Force
Remove-Item "src/components/publish-sheet.tsx" -Force
Remove-Item "src/components/stat-card.tsx" -Force
Remove-Item "src/components/status-badge.tsx" -Force
Remove-Item "src/components/role-switcher.tsx" -Force
Remove-Item "src/components/verified-badge.tsx" -Force
Remove-Item "src/components/quiz" -Recurse -Force
Remove-Item "src/lib/motion.ts" -Force
# Delete old route files
Remove-Item "src/routes/_app.analytics.tsx" -Force
Remove-Item "src/routes/_app.content.tsx" -Force
Remove-Item "src/routes/_app.materials.tsx" -Force
Remove-Item "src/routes/_app.quizzes.tsx" -Force
```

- [ ] **Step 2: Rewrite styles.css with reference tokens**

Copy the CSS variables from `prj-gkebook-shadcn-frontend/globals.css` exactly.

### Task 2: Navigation Config + App Sidebar

**Files:**

- Create: `src/components/nav-data.ts`
- Create: `src/components/app-sidebar.tsx`
- Create: `src/components/header.tsx`

### Task 3: Layout Route (\_app.tsx)

**Files:**

- Rewrite: `src/routes/_app.tsx`

SidebarProvider + AppSidebar + SidebarInset with Header + Outlet

### Task 4: Login Page

**Files:**

- Rewrite: `src/routes/login.tsx`

Clean role cards — 4 cards for 4 roles, no gradients/glassmorphism

### Task 5: Shared Components

**Files:**

- Create: `src/components/stat-card.tsx`
- Create: `src/components/content-table.tsx`
- Create: `src/components/status-badge.tsx`
- Create: `src/components/role-switcher.tsx`
- Create: `src/components/verified-badge.tsx`

### Task 6: Dashboard (Creator + Admin views)

**Files:**

- Rewrite: `src/routes/_app.dashboard.tsx`

### Task 7: Library Page

**Files:**

- Rewrite: `src/routes/_app.library.tsx`

### Task 8: Quiz Builder

**Files:**

- Create: `src/components/quiz/palette.tsx`
- Create: `src/components/quiz/question-card.tsx`
- Create: `src/components/quiz/ai-panel.tsx`
- Rewrite: `src/routes/_app.builder.quiz.$id.tsx`

### Task 9: Material Builder

**Files:**

- Rewrite: `src/routes/_app.builder.material.$id.tsx`

### Task 10: Admin Review Page

**Files:**

- Rewrite: `src/routes/_app.admin.tsx`

### Task 11: Verification Page

**Files:**

- Rewrite: `src/routes/_app.verification.tsx`

### Task 12: Channel Page

**Files:**

- Rewrite: `src/routes/_app.channel.tsx`

### Task 13: Settings Page

**Files:**

- Rewrite: `src/routes/_app.settings.tsx`

### Task 14: Root Route + Index

**Files:**

- Rewrite: `src/routes/__root.tsx`
- Keep: `src/routes/index.tsx`

### Task 15: TypeScript Check

- [ ] Run `npx tsc --noEmit` — expect 0 errors
- [ ] Run `npm run dev` — confirm app loads
