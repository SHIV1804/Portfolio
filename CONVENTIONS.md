# CONVENTIONS.md

Patterns actually observed in this codebase. Prefer these over generic React/Next.js advice.

## Naming
- Components: PascalCase files and exports, e.g. `widgets/hero-section/ui/HeroSection.tsx` exports `HeroSection`.
- Libs/hooks/utils: camelCase files, e.g. `shared/lib/dsa-sync.ts`, `shared/lib/useReducedMotion.ts`.
- Route segments: kebab-case matching the URL (`app/projects/case-study-two/`, `app/dsa/flagship/max-sum-subarray/`).
- FSD slice folders are lowercase-kebab (`hero-section`, `command-palette`, `terminal-easter-egg`).

## File/folder structure (FSD)
Each slice under `widgets/`, `features/`, `entities/` is organized by segment, not by file type:
```
widgets/<slice>/
  ui/       — components
  lib/      — slice-local helpers (e.g. widgets/hero-section/lib/scrollAnimations.ts)
  model/    — state/hooks (e.g. widgets/terminal-easter-egg/model/useTerminal.ts)
  index.ts  — barrel export (only some slices have one — see below)
```
Not every slice has an `index.ts` barrel — `widgets/blog`, `widgets/github-stats`, `widgets/terminal-easter-egg`, and `features/theme-toggle` do; others (e.g. `widgets/hero-section`, `widgets/header`) are imported directly by file path. Follow whichever pattern the slice you're touching already uses; don't add a barrel to a slice that doesn't have one without a reason.

`app/` never contains business logic — it imports from `widgets/`/`features/`/`entities/` and composes. The one recurring exception is small route-local components that don't need to be reusable (e.g. `app/dsa/flagship/two-sum/ArrayBox.tsx`, `ExecutionPanel.tsx`, `DiscoveryTransition.tsx` live next to the page that uses them, not in `widgets/`).

## Components
- Typed as `React.FC<Props>` with a `Props` interface named `<Component>Props`, in most (not all) components — e.g. `export const Badge: React.FC<BadgeProps> = (...) => {...}`. A minority of files (mostly server components like `GitHubStats`) use a plain async function export instead — match whichever the file already uses.
- `"use client"` is added only where actually needed (state, effects, browser APIs, event handlers) — 9 files in the whole codebase have it. Server Components (the default) are preferred; don't add `"use client"` speculatively.
- Client components that read `prefers-reduced-motion` do it via `shared/lib/useReducedMotion.ts` and branch their render/animation logic on it (see `HeroSection.tsx`, `SlidingWindowVisualizer.tsx`).

## Styling
- Tailwind CSS 4 utility classes only — no `clsx`/`tailwind-merge` in this codebase (not a dependency); conditional classes are built with plain template literals and ternaries.
- All color values come from the CSS custom properties defined in `app/globals.css` (`--background`, `--surface`, `--surface-raised`, `--foreground`, `--foreground-muted`, `--foreground-faint`, `--border`, `--border-strong`, `--accent`, `--accent-strong`, `--accent-soft`), exposed as Tailwind tokens (`bg-background`, `text-accent`, etc.) via `@theme inline`. One known inconsistency: `shared/ui/Badge.tsx` uses raw `amber-500`/`white/*` Tailwind classes instead of these tokens — don't copy that pattern into new components; follow the token-based approach used everywhere else.
- Mono font (`font-mono`, Geist Mono) is used for the terminal/technical aesthetic: labels, badges, timestamps, section numbers (`01.`, `02.`, ...).

## Data & fetching
- Server-side data fetchers (`fetchDSAProblems`, `getGitHubData`, `getAllPosts`, `getApprovedCommunityPosts`) never throw to the caller — each catches its own errors and returns `[]`/`null`, and the calling component renders an explicit empty/fallback state (see `app/dsa/page.tsx`'s "No problems synced yet", `GitHubStats.tsx`'s unavailable message). Follow this pattern for any new data fetcher: fail soft, render a real empty state, don't let one failing integration break the page.
- External fetches that can be cached use Next's `fetch(..., { next: { revalidate: <seconds> } })` (3600s for GitHub data) rather than `export const revalidate` at the page level, except `/blog` which uses page-level `export const revalidate = 60`.

## Validation
- Form/API input validation uses `zod` schemas (`features/contact-form/model/schema.ts`) with `@hookform/resolvers/zod` on the client and a second `schema.safeParse()` call server-side in the route handler — never trust client-side validation alone (see `app/api/contact/route.ts`).

## Imports
- Use the `@/*` path alias (`tsconfig.json`, maps to repo root) for any cross-slice import. Relative imports (`./`, `../`) are used only within the same slice/route folder.

## Comments
- Security-relevant code carries an explanatory block comment stating *why*, not just *what* (see `shared/lib/safe-markdown.ts`, `app/api/dsa-webhook/route.ts`). Follow this for any future security-sensitive code.
- Placeholder/unverified content is marked inline with `[PLACEHOLDER: ...]` or a `VERIFIED:` comment — see `docs/CONTENT.md`.

## Testing
- Playwright specs live in `tests/<feature>/<feature>.spec.ts`, one folder per feature area, matching the widget/route it covers (`tests/command-palette/`, `tests/contact-form/`, `tests/dsa-flagship/`, etc.).
- Network-dependent behavior (e.g. the contact form's Resend call) is mocked with `page.route('/api/contact', ...)` rather than hitting a real backend — see `tests/utils.ts` and `tests/contact-form/contact-form.spec.ts` for the pattern.
- Tests that rely on multi-step interaction gates comment the gating logic they depend on inline (see the top of `tests/dsa-flagship/two-sum-execution-panel.spec.ts`) so the test's assumptions stay legible if the gated component changes.
