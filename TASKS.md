# TASKS.md

Status as of commit `b9b057a` (`dev` branch), evidenced from the code and the session logs now in `docs/history/`. Where status can't be confirmed, it's marked unknown rather than guessed.

## In Progress
- **Stage 1 session-observer hardening is complete on PR #23** (`security/dependency-upgrades`, commit `ab5366d`): the matcher follows captured Chromium output, shares the existing console-noise ignore list, explicitly proves the tolerated abort message appeared, rejects unexpected aborted session requests during normal navigation, and has isolated regression coverage for tolerated aborts and real failures. Final CI run `40774972727` passed with 210 tests passed and 1 skipped.
- **Second case-study project not yet selected.** `entities/project/model/data.ts` has `title: "Second project"`, `description: "[PLACEHOLDER — project not yet selected]"`, `isPlaceholder: true`. `/projects/case-study-two` renders this placeholder via `CaseStudyLayout`.
- **Log Analyser is a concept, not a built project.** `entities/project/model/data.ts` carries a `VERIFIED:` comment confirming (via a real GitHub API query against `SHIV1804`) that no implementation exists anywhere — the description accurately says "architecture design in progress." `app/projects/log-analyser/page.tsx` contains three explicit `[PLACEHOLDER: ...]` markers: an architecture-diagram description, a code snippet, and an OG image.
- **About/Hero bio content is a placeholder.** `widgets/about-section/ui/AboutSection.tsx` and the 4th story beat in `widgets/hero-section/ui/HeroSection.tsx` both contain the literal text `[PLACEHOLDER: bio content pending owner review]`, pending real content from the site owner.

## Known Issues / Bugs (verified by reading the current source)
- **`/resume.pdf` is referenced but not present.** `widgets/command-palette/ui/CommandPalette.tsx` and `widgets/terminal-easter-egg/lib/commands.ts` both `window.open('/resume.pdf')`; `public/` contains only the default Next.js starter SVGs (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`) — no `resume.pdf`.
- **OG images referenced but not present.** `app/page.tsx`, `app/projects/log-analyser/page.tsx`, `app/projects/case-study-two/page.tsx` all reference `/og-*.png` paths marked `// [PLACEHOLDER: OG image]`; none exist in `public/`. (`app/blog/[slug]/opengraph-image.tsx` generates blog OG images dynamically via `next/og` — that one is real and not affected.)
- **Package-manager transition is branch-scoped.** `main` still has the historical pnpm metadata, while PR #23 removes `pnpm-lock.yaml` and `pnpm-workspace.yaml` and uses npm only. The branch decision is recorded in `DECISIONS.md`; merge to `main` remains owner-controlled.
- **`GITHUB_TOKEN` is currently unset in the verification sandbox** (expected — it's a secret), so `fetchDSAProblems()`, `fetchDSATrace()`, and `getGitHubData()` all return their empty/fallback states in any environment without it configured. Not a bug — documented behavior — but worth knowing when a page looks empty locally.

## Blocked
- **`prisma generate` cannot complete in network-restricted sandboxes** (`binaries.prisma.sh` → 403). Blocks `npx tsc --noEmit` and `npm run build` on any Prisma-touching file. Confirmed independently in this session and in prior ones (`docs/history/CONTENT_VERIFICATION_PROGRESS.md`, `docs/history/DSA_FLAGSHIP_PROGRESS.md`). Not blocked on Vercel, which has real network access and runs `prisma generate` via the `postinstall` script.
- **A real Lighthouse audit from *this* sandbox** is similarly blocked by the same network restriction — the only numbers in `docs/history/LIGHTHOUSE_AUDIT_PROGRESS.md` Session 2 (2026-08-25) were run and reported by the repo owner on their own machine, not independently verified from raw report files.

## Completed (verified against code, not just prior logs)
- `.env.example` now lists every discovered environment variable with an empty value and a purpose comment, including the DSA repository, webhook secret, and public site URL variables.
- Launch blockers fixed on `fix/launch-blockers`: GitHub private-email fallback now sends the interpolated access token and only accepts a primary, verified email; post slug collisions now interpolate the base slug and counter.
- Blog system: MDX (`content/blog/*.mdx`) + moderated community posts (Prisma `Post` model, `PENDING`/`APPROVED`/`REJECTED`), search (`BlogSearch`), tags, RSS, dynamic OG images for MDX posts.
- Stored-XSS fix for community posts: `shared/lib/safe-markdown.ts` sanitization pipeline, used consistently everywhere DB-backed post content is rendered (`app/blog/page.tsx` excerpt generation via `.slice()` + `app/blog/[slug]/page.tsx` full render).
- Live GitHub activity dashboard (`widgets/github-stats/`): contribution calendar, language breakdown, pinned repos, via the GitHub GraphQL API.
- Terminal easter egg (`widgets/terminal-easter-egg/`) with real command handlers (not just decorative).
- DSA showcase: pattern-based problem listing + individual write-ups (`/dsa`, `/dsa/[pattern]/[slug]`) plus two "flagship" fully interactive walkthroughs (`two-sum`, `max-sum-subarray`) with step-by-step execution panels, prediction questions, and pattern visualizers (two-pointers, sliding-window, binary-search).
- Single global `<Header>`/`<Footer>` in `app/layout.tsx` (no per-page duplicates); single `<main>`/`<footer>` landmark per page (a duplicate-landmark accessibility bug was fixed — see `docs/history/AI_HANDOFF.md`, 2026-08-10 entry).
- Command palette (`Cmd/Ctrl+K`) with navigation, case-study, and resume-download entries; a navigation race condition (G2) was root-caused and fixed with real Playwright evidence — see `docs/history/PLAYWRIGHT_TRIAGE_PROGRESS.md`.
- `dev` branch is 36 commits ahead of `main`, 0 behind (`main` is a strict subset) — `dev` is the up-to-date source of truth as of this doc.

## Documentation gaps this pass could not close
- Whether `main` or `dev` should be treated as the deploy branch is not stated anywhere in the repo (no CI config, no `vercel.json`).
- No record of which package manager (npm vs pnpm) is intended, despite both lockfiles being committed.


## Stage 3 — Prisma 7.10.1
- **In progress on `chore/upgrade-prisma-7` (dedicated PR planned):** moving `prisma` and `@prisma/client` together to stable `7.10.1` (not the Prisma 8 RC), adding `@prisma/adapter-pg@7.10.1`, `dotenv`, the required ESM package mode, `prisma.config.ts`, and the new Prisma client generator/output path.
- **Official guide review:** Prisma v7 requires the explicit client output path and updated generated-client imports, moves CLI datasource URLs to `prisma.config.ts`, requires a PostgreSQL driver adapter in runtime client construction, and no longer loads env files by default. Existing `postinstall: prisma generate` is preserved and will be exercised by CI.
- **Schema/migrations:** the project is PostgreSQL with three existing SQL migrations. The schema models are unchanged; only the generator/datasource configuration changes. No migration file is added or edited. CI's `DATABASE_URL` is `postgresql://ci:ci@localhost:5432/portfolio_ci` with a job-scoped PostgreSQL 16 service. `migrate deploy` and the adapter smoke test run only there; the test refuses Neon and non-local hosts. No Neon or production migration was run.
- **Auth.js adapter:** `@auth/prisma-adapter@2.11.3` is retained. Its published peer range includes Prisma 7 but its declaration imports the default `@prisma/client` type while Prisma 7's generated client uses a custom output. A narrow adapter type cast is documented; a new CI-only test exercises create/read/delete user and session methods against the disposable database.
- **Audit before/after:** before `npm audit --package-lock-only`: 38 findings (1 low, 20 moderate, 15 high, 2 critical; exit 1). After the package update: 38 with the same severity distribution (exit 1).
- **CI:** pending; run the full workflow before opening/merging the PR. Do not run `migrate-production.yml` or any Neon/prod command.
