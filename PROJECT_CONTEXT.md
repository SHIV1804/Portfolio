# Project Context

## Project and stack

**Confirmed:** This repository is a systems-minded software engineer portfolio built with Next.js App Router. It combines static MDX and moderated community blog posts, a GitHub activity dashboard, and an interactive data-structures-and-algorithms (DSA) walkthrough synced from a companion repository. The verified stack is Next.js 16.2.10, React 19.2.4, TypeScript, Tailwind CSS 4, Prisma 6.2.1, PostgreSQL (Neon), NextAuth 4.24.14 with GitHub OAuth, GSAP, Framer Motion, `next-mdx-remote`, and Playwright 1.61.1. CI uses Node.js 22; a repository-local Node version for development is **unverified**.

## Structure and entry points

**Confirmed:** The project follows a Feature-Sliced Design-oriented layout. `app/` contains App Router pages, route handlers, and composition; `widgets/` contains composed sections such as the header, GitHub dashboard, DSA visualizers, command palette, and terminal; `features/` contains interactions such as contact and theme toggling; `entities/` contains smaller domain UI/data; `shared/` contains configuration, cross-cutting libraries, UI primitives, Prisma, and auth; `content/blog/` contains first-party MDX; `prisma/` contains the PostgreSQL schema and migrations; `tests/` contains Playwright specs; `docs/` contains historical logs and integrity documentation. The root route is `app/page.tsx`; the root layout is `app/layout.tsx`; shared site identity/navigation lives in `shared/config/site.ts`.

## DSA integration

**Confirmed:** The live DSA source is `SHIV1804/dsa-solutions`; the committed `dsa-solutions/` directory is only a snapshot supporting a page. `shared/lib/dsa-sync.ts` reads `DSA_GITHUB_REPO` and `GITHUB_TOKEN`, walks the remote `problems/` directories, and loads each problem’s `meta.md`, `writeup.md`, and `solution.*` file through the GitHub Contents API. It also fetches `trace.json` for flagship visualizations. Responses use a one-hour Next.js revalidation window and fail closed to empty data on errors. `app/api/dsa-webhook/route.ts` verifies GitHub’s HMAC-SHA256 `X-Hub-Signature-256` using `DSA_WEBHOOK_SECRET`; a verified push to the repository’s default branch revalidates `/dsa`.

**Confirmed:** The companion repository’s `Generate Traces` workflow runs on pushes to `main` only when watched solution files change, or through manual dispatch with an optional `problem_path`. The current watched paths are the Two Sum and Two Sum II solution files. It uses GDB to capture optimized and brute-force traces, parses them with repository scripts, merges into an existing curated `trace.json`, and commits regenerated traces when the merge changes data. If no curated trace exists, it uploads generated output for manual review rather than auto-committing a new trace. Its exact future watched paths are **unverified** beyond the current workflow.

## Commands and checks

**Confirmed:** `npm run dev` starts development; `npm run build` creates a production build; `npm run lint` runs ESLint; `npm run test:e2e` runs Playwright. There is no verified `typecheck` or `test` npm script. The narrowest type check is `npx tsc --noEmit`; the narrowest browser check is `npx playwright test <spec>`. Playwright targets `http://localhost:3000` and starts `npm run dev` through its web server configuration.

## CI and production migration

**Confirmed:** `.github/workflows/ci.yml` defines `verify` for pull requests and pushes to the configured branches. It provisions PostgreSQL 16, installs dependencies, generates Prisma Client, runs migrations, TypeScript checking, lint, build, Chromium installation, and the Playwright suite. CI variable names are `CI`, `DATABASE_URL`, `RESEND_API_KEY`, `CONTACT_EMAIL`, `GITHUB_ID`, `GITHUB_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ADMIN_EMAIL`, `DSA_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL`, `NODE_ENV`, `DSA_GITHUB_REPO`, and `GITHUB_TOKEN`.

**Confirmed:** `.github/workflows/migrate-production.yml` is manual-only, has a job-level `main` ref condition plus a second main-ref safeguard, references the `production` environment, creates a unique Neon backup branch before `prisma migrate deploy`, and aborts on Neon HTTP errors. It uses `NEON_API_KEY`, `NEON_PROJECT_ID`, and `DATABASE_URL_DIRECT` by name only. It must never be run from a PR branch. **Owner-confirmed:** the `production` environment requires reviewers and permits deployment only from `main`.

## Definition of done

Every new feature or behavior change ships with tests in the same PR: Playwright E2E/API specs belong under `tests/`; logged-in author/admin flows reuse `tests/helpers/deletion-fixtures.ts` and `tests/helpers/auth-session.ts`; and database tests run only against the disposable local/CI database. Tests cover the happy path, authorization (logged-out, non-owner, and non-admin), and error/edge states. Bug fixes include a regression test. The PR description lists the tests added and the CI result. If the current infrastructure cannot test a feature, document that in the PR and open a follow-up task; do not silently skip coverage.

## Branch rules and open items

**Confirmed project policy:** Work belongs on task branches, then `dev`, then `main`; no direct pushes, force-pushes, or automatic merges. The owner performs the final `dev` to `main` merge, and production database credentials are never shared with agents. **Unverified:** repository branch protection settings and the exact current deployment target configuration. Keep environment values and credentials out of documentation and logs.
