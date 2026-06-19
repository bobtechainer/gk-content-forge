---
name: mobifone-ui
description: Use when building, designing, restyling, or adding ANY page, route, screen, section, or component in the gk-content-forge project (studio, course builder, học liệu/learning materials, dashboards, admin, publish flows) — ensures the UI follows the MobiFone-branded Untitled UI design system instead of ad-hoc styling. Use before writing JSX/CSS for this app's UI.
---

# MobiFone UI — Untitled UI design system for gk-content-forge

## Core principle

This project's UI is the **MobiFone-branded Untitled UI** design system. The whole app AND every
generated học liệu must read as one system. **Style ONLY through design tokens and the shared shadcn
primitives — never hardcode colors, radii, or shadows.** If a value isn't a token, it doesn't ship.

## Where the system lives (read before designing)

- **Tokens:** `src/styles/untitled/*.css` (fig-tokens, brand, colors, typography, spacing, shadows, gradients), all wired by `src/styles.css`.
- **Semantic roles + Tailwind theme:** `src/styles.css` — `:root` maps shadcn roles onto Untitled UI tokens; `@theme inline` exposes the utilities.
- **Components:** `src/components/ui/` — shadcn primitives tuned to Untitled UI. **Reuse them; do not re-implement buttons/inputs/cards/etc.** Composite pieces live in `src/components/shared/`, `course/`, `quiz/`.
- **Fidelity source of truth** (look, component set, voice): the Claude Design project
  `Untitled UI Design System` → https://claude.ai/design/p/d185f5c9-0100-4b86-b745-53af9c3fc91b
  When unsure how a component should look, match that project.

## The styling vocabulary — use these, never raw hex

| Need | Use |
|---|---|
| Page canvas | `bg-background` |
| Card / panel | `bg-card` + `border` + `shadow-sm`, `rounded-lg` |
| Elevated (menu, modal, popover) | drop the border, raise shadow: `shadow-lg`/`shadow-xl` |
| Body text / heading | `text-foreground`; secondary/muted `text-muted-foreground` |
| Primary action (blue #237BD3) | `<Button>` (default) — or `bg-primary text-primary-foreground` |
| Brand tint / hover surface | `bg-accent text-accent-foreground`, or scale `bg-brand-50 text-brand-700` |
| Brand blue scale | `bg-brand-{50..900}`, `text-brand-600/700`, `border-brand-600` |
| Success (green) | `text-success` / `bg-success-50` / `bg-success-500` |
| Warning = MobiFone orange #FFA23A | `bg-warning-500` / `text-warning-700` / `bg-warning-50` |
| Error / destructive (red) | `text-destructive` / `bg-error-50` / `bg-error-600` |
| Brand accent red #E30613 (rare — CTAs/highlights only, never the default action) | `style={{ background: "var(--accent-500)" }}` |
| Border / divider | `border` (= `border-border`) |
| Focus ring | rely on the primitive; custom: `focus-visible:ring-2 focus-visible:ring-ring` |
| Radius | `rounded-md` (8px control default), `rounded-lg`/`rounded-xl` for cards |
| Charts (recharts) | `var(--chart-1..5)` |

## Forbidden (these are how the system drifts)

- ❌ Hex literals in className or JSX: `bg-[#2563EB]`, `text-[#10B981]`, `border-[#EFF6FF]`.
- ❌ Inline color styles: `style={{ color: "#..." }}`, `style={{ backgroundColor: "#..." }}` (except the documented `var(--accent-500)` red case, or genuinely dynamic per-item token values).
- ❌ Default Tailwind palette colors for UI: `bg-blue-600`, `text-emerald-500`, `bg-amber-50` — use the semantic/brand tokens above instead.
- ❌ Re-implementing a primitive that already exists in `src/components/ui/`.

## Voice & content (Untitled UI house style, Vietnamese audience)

- Sentence case for headings/buttons/labels ("Tạo học liệu", not "TẠO HỌC LIỆU"). Address the user as **bạn**.
- Buttons are verb-first and short. Microcopy is plain and reassuring. No emoji in product UI.
- Numbers formatted with separators/units; trends use +/− with success/error color.

## Recipe for a new page/component

1. Compose from `src/components/ui/` primitives + existing `shared/` pieces.
2. Surfaces = `bg-card border shadow-sm rounded-lg`; canvas = `bg-background`; spacing on the 4px grid.
3. Color only via the table above. Need a one-off hue? Pull from the Untitled UI scale (`var(--colors-*)`), don't invent a hex.
4. Reuse `<Button>`, `<Input>`, `<Card>`, `<Badge>`, `<Tabs>`, `<Dialog>`… for consistent radius/shadow/focus.
5. Before done, grep your diff for `#[0-9a-fA-F]` and `bg-\[` / `text-\[` — there should be none in UI code.
