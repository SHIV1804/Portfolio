# CODEX_CONTEXT

## Purpose
This handoff records the live repo state, the verified facts against the current checkout, and the exact remaining work for a Codex/IDE session. It is intentionally documentation-only and does not change app behavior.

## Repo facts
- Remote base branch state recorded from `git fetch --all --prune`:
  - `origin/main`: `64c0db73f17d37e3f029e5e805f50304dbda122e`
  - `origin/dev`: `ebbec648505f998fb9b752929a8d24d3693d5e17`
- `origin/dev` contains `origin/main`: yes (`git merge-base --is-ancestor origin/main origin/dev` returned exit code 0 / `dev_contains_main=1` in the shell output)
- Current working branch: `docs/codex-handoff` from `origin/dev`
- Current `package.json` declares `next: 16.4.3`; the AGENTS note referencing `next@16.2.10` is stale.
- Prisma generation succeeds in this environment after `npm ci`; the previous 403 issue is not reproducible here.
- `npx tsc --noEmit` passes locally.
- `npm run lint` passes locally.
- The relevant Playwright suite does not complete in this Windows environment because the local installation is missing the native `lightningcss.win32-x64-msvc.node` binary required by Tailwind/Next; this is environmental, not a functional app regression.
- `GITHUB_TOKEN` is set in CI GitHub Actions, but not in this local session (`<unset>` in the shell output), which makes live GitHub-backed DSA fetches and dashboard calls non-runnable without secrets.

## Rules / preamble
The session began from the repo-level instructions and constraints in `AGENTS.md` and `CLAUDE.md`:

1. Verify repo state before editing.
2. Do not fabricate claims; use real command output and code evidence.
3. Keep `shared/lib/safe-markdown.ts` as the boundary for visitor-submitted content.
4. Do not change the DSA trace contract without checking both repos.
5. Respect FSD boundaries: `app/` composes routes, other logic belongs in `widgets/`, `features/`, `entities/`, or `shared/`.
6. Use `@/*` imports instead of deep relative imports.
7. Keep design tokens in `app/globals.css` as the source of truth.
8. Run `npm run lint` before finishing work touching app/widgets/features/entities/shared code.
9. If a feature touches Playwright-covered UI, run the relevant E2E tests.
10. Do not replace the safe-markdown pipeline with MDX for untrusted content.
11. `prisma generate` may fail in network-restricted or egress-blocked sandboxes; do not “fix” by removing Prisma code.
12. Keep this task documentation-only and do not merge the branch.

## Task list (T0-T15)
- T0: Fetch latest repo state and confirm branch/base refs. Status: done.
- T1: Confirm `origin/main` and `origin/dev` SHAs and whether `dev` contains `main`. Status: done.
- T2: Install dependencies with `npm ci`. Status: done.
- T3: Run `npx prisma generate`. Status: done locally; generated successfully.
- T4: Run `npx tsc --noEmit`. Status: done; no TypeScript errors.
- T5: Run `npm run lint`. Status: done; no ESLint errors.
- T6: Run DSA and navigation E2E tests. Status: blocked by missing local native binary `lightningcss.win32-x64-msvc.node`; the web server never started.
- T7: Audit GitHub-backed DSA sync and auth setup. Status: done via code review of `shared/lib/dsa-sync.ts`, `shared/lib/auth.ts`, and related files.
- T8: Review DSA page rendering and flagship pages. Status: done via code review.
- T9: Review `shared/lib/prisma.ts` and auth provider behavior. Status: done.
- T10: Review `app/api/posts/route.ts`, Playwright helpers, CI config, env vars, and Next config. Status: done.
- T11: Check section 1 of `CODEX_IDE_TASKS.md` against the actual repo. Status: done; the file is not present in this checkout, and the stale `next@16.2.10` note was confirmed wrong.
- T12: Create handoff branch `docs/codex-handoff` and document repo state. Status: in progress / done in this branch.
- T13: Push the branch to `origin/docs/codex-handoff` without merging. Status: done.
- T14: Record branch SHA via `git ls-remote origin refs/heads/docs/codex-handoff`. Status: done.
- T15: Next action. Status: pending; continue from this handoff with a clean machine or CI environment that has the required native dependencies and any secret-backed env vars.

## Decisions
- The repo is currently on `origin/dev` and the handoff branch was created off that base as requested.
- This is a documentation-only step; no feature code has been altered.
- The previous `AGENTS.md` note on `next@16.2.10` is stale and should be treated as a documentation discrepancy, not a current repo fact.
- The missing `lightningcss` native binding is a platform issue: the app code itself is not the failing cause.
- `CODEX_IDE_TASKS.md` is not present in this checkout; the work here therefore validates the repo state and the known task preamble instead of a file-local checklist.

## NEXT ACTION
Start from `docs/codex-handoff` in a clean environment with:
1. a complete Node install matching the project’s Tailwind/Next toolchain,
2. the required native dependency for the platform (`lightningcss` binary),
3. the runtime env vars for GitHub auth and GitHub-backed DSA sync (`GITHUB_TOKEN`, `DSA_GITHUB_REPO`, `GITHUB_ID`, `GITHUB_SECRET`, etc.), and
4. a runnable local PostgreSQL or CI database for Prisma-backed flows.

After that, rerun:
- `npm ci`
- `npx prisma generate`
- `npx tsc --noEmit`
- `npm run lint`
- `npx playwright test tests/dsa tests/assets/assets-and-console.spec.ts --grep "navigation does not create console errors|DSA" --reporter=line`

Then continue with any remaining feature-specific work from the actual task list in the IDE environment.
