# gk-content-forge — Project guide for Claude

TanStack Start + React 19 + Tailwind v4 + shadcn/ui app for **Trường học số** (digital school):
creators build **học liệu** (learning materials) and courses via a block-based studio/course builder.

## 🎨 Design system is MANDATORY

This project's UI is the **MobiFone-branded Untitled UI design system**. **Every new page, route,
screen, section, or component — and every generated học liệu — MUST follow it.** This is not optional.

**Before writing ANY UI (JSX/CSS) for this app, follow the `mobifone-ui` skill** (`.claude/skills/mobifone-ui/SKILL.md`,
invoke with `/mobifone-ui`). It is the full playbook. Non-negotiables:

- **Style only through design tokens and the shared shadcn primitives.** Never hardcode colors, radii, or shadows.
- **No hex literals** in UI code — no `bg-[#2563EB]`, no `style={{ color: "#..." }}`, no default Tailwind palette colors (`bg-blue-600`, `text-emerald-500`) for UI. Use semantic/brand tokens.
- **Reuse `src/components/ui/` primitives** (Button, Input, Card, Badge, Tabs, Dialog…) — don't re-implement them.
- Brand: primary blue `#237BD3` (`bg-primary`), accent red `#E30613` (rare), secondary orange `#FFA23A` (warning ramp). Control radius 8px (`rounded-md`), soft layered shadows (`shadow-sm`), Untitled UI voice (sentence case, address user as "bạn").
- **Fidelity source of truth:** the Claude Design project → https://claude.ai/design/p/d185f5c9-0100-4b86-b745-53af9c3fc91b — match it when unsure.

Tokens live in `src/styles/untitled/*.css`, wired through `src/styles.css` (`:root` + `@theme inline`).

## Conventions

- **Gates** (run before claiming done): `npx tsc --noEmit`, `npm run test` (vitest), `npm run build`. (`bun` is not on PATH here — use `npm`/`npx`.)
- Repo is **not** prettier-clean — **do not mass-format**; only touch lines you change.
- Commits in **Vietnamese**, no attribution.
- Self-check a UI diff: it should contain no `#[0-9a-fA-F]` color literals and no `bg-[`/`text-[` arbitrary colors.
