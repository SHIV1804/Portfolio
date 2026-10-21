# AGENTS.md

Instructions for AI coding agents working in this repository. Read this before making changes.

## Project in one line
Next.js 16 (App Router) personal portfolio for a software engineer, with a blog (MDX + DB-backed community posts), a live GitHub stats dashboard, and an interactive DSA (Data Structures & Algorithms) showcase synced from a companion repo (`SHIV1804/dsa-solutions`).

See `README.md` for setup, `ARCHITECTURE.md` for how the pieces fit together, `CONVENTIONS.md` for code patterns, `TASKS.md` for current status/known issues, `DECISIONS.md` for why things are built the way they are, and `BUILD.md` for exact commands.

## Non-negotiable project rules

1. **Zero fabrication.** This is a portfolio — its credibility is the product. Never invent metrics, achievements, dates, or technical claims. If content is a placeholder, it is marked `[PLACEHOLDER: ...]` — leave that marker in place unless you are filling it with real, owner-supplied content. If you verify a claim against real evidence (code, a command's output, a live query), mark it with a `VERIFIED:` comment explaining what you checked. See `docs/CONTENT.md`.
2. **`shared/lib/safe-markdown.ts` is not optional.** Visitor-submitted blog posts (from the DB, via `getApprovedCommunityPosts`) must always render through `renderSafeMarkdown()`, never through `MDXRemote`. MDX compiles to executable JSX; passing untrusted input into it is a stored-XSS vector. First-party MDX in `content/blog/*.mdx` is trusted and should keep using `MDXRemote`. Do not blur this line.
3. **Do not touch the DSA trace contract without reading both repos.** `shared/lib/dsa-sync.ts` fetches problems from `SHIV1804/dsa-solutions` (`problems/<pattern>/<slug>/{meta.md,writeup.md,solution.*}` + optional `trace.json`) via the GitHub REST API at request time (`revalidate: 3600`, no local copy except the one committed trace snapshot at `dsa-solutions/problems/sliding-window/max-sum-subarray/trace.json` used to seed that page). The `DSATrace`/`DSATracePhase`/`DSATraceStep` interfaces in `dsa-sync.ts` are the schema contract — the dsa-solutions repo's CI (`generate-traces.yml`) and `scripts/parse_gdb_trace.py` must match it if you change it on either side.
4. **`prisma generate` cannot reach the network in this sandbox** — `binaries.prisma.sh` returns 403 through the egress proxy. `npx prisma generate --no-engine` also fails for the same reason (checksum fetch). This means `tsc --noEmit` and `next build` will show `Module '"@prisma/client"' has no exported member 'PostStatus'` / `'PrismaClient'` errors that are **environmental, not real bugs** — do not "fix" them by removing the Prisma-dependent code. See `BUILD.md`.
5. **FSD layer boundaries.** `app/` composes routes only; UI logic belongs in `widgets/`, `features/`, or `entities/`; cross-cutting code belongs in `shared/`. Don't import "up" the hierarchy (e.g. a `shared/` file must not import from `widgets/`).

## DO
- Reuse existing components and patterns (see `CONVENTIONS.md`) rather than introducing a second way to do the same thing.
- Use the `@/*` import alias (maps to repo root) instead of relative `../../..` chains.
- Keep the dark-mode-first design tokens in `app/globals.css` (`--accent`, `--surface`, etc.) as the only source of color — don't hardcode hex values in components.
- Update `TASKS.md` / `DECISIONS.md` when you complete work or make a non-obvious technical choice, the same way this project's prior session logs (now in `docs/history/`) did.
- Run `npm run lint` before finishing a change that touches `app/`, `widgets/`, `features/`, `entities/`, or `shared/`.
- Respect `prefers-reduced-motion` for any new animation (see `shared/lib/useReducedMotion.ts` and the pattern used in `HeroSection.tsx`).

## DO NOT
- Do not replace `rehype-sanitize`/the safe-markdown pipeline with MDX for any visitor-submitted content (rule 2 above).
- Do not commit real secrets. `.env.example` documents the *names* of required vars only — see `BUILD.md` for the full list including ones missing from `.env.example` today.
- Do not add a second CSS framework, state-management library, or ORM alongside Tailwind CSS 4 / React state / Prisma without a documented reason in `DECISIONS.md`.
- Do not silently invent a fix for the Prisma sandbox issue (rule 4) — it needs real network access to `binaries.prisma.sh`, which this environment's egress policy blocks.
- Do not assume a feature exists because it's common on portfolio sites — verify against the actual code (`ARCHITECTURE.md` lists what's real).

## Safe workflow for making a change
1. Read `ARCHITECTURE.md` and `CONVENTIONS.md` for the area you're touching.
2. Check `TASKS.md` for known issues in that area before assuming something is a fresh bug.
3. Make the change, following existing patterns.
4. Run `npm run lint` and, if Prisma types aren't the blocker, `npx tsc --noEmit`.
5. If you touched Playwright-covered UI (command palette, contact form, theme, navigation, DSA flagship pages — see `tests/`), run `npm run test:e2e` for the relevant spec.
6. Update `TASKS.md`/`DECISIONS.md` if the change resolves a known issue or introduces a new technical decision.

## A note on Next.js version
This project pins `next@16.2.10`. If APIs you recall differ from what's in the codebase (e.g. dynamic route `params` as a `Promise`, already used throughout `app/api/**` and `app/dsa/**`), trust the code and `node_modules/next/dist/docs/` over prior training data — the framework has moved fast across major versions.
