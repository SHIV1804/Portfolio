# MANUS_CONTEXT.md

_Last verified: 2026-10-31. This file was created on `docs/manus-handoff` because no `MANUS_CONTEXT.md` existed in the workspace or any fetched repository ref._

## 1. Repository and branch state

Repository: `SHIV1804/Portfolio`. The default branch is `main`. At verification, `main` was `c97b69a`; `security/dependency-upgrades` was `6e90cd6`.

PR #23 is `security/dependency-upgrades` → `dev` (verified with GitHub; open and unmerged). PR #37 is `chore/safe-range-dependency-updates` → `security/dependency-upgrades` (open and unmerged). Do not rebase Stage 3 branches until the owner confirms that PR #37 has merged into `security/dependency-upgrades`.

## 2. Safety constraints

Never merge a PR. Never run production migration workflows, connect to production databases, or contact Neon. Prisma generation, migrations, and adapter integration tests must use only the disposable PostgreSQL service in GitHub Actions. Do not rerun workflow run `40092064802`.

## 3. Current Stage 3 status

All five Stage 3 PRs below are open and unmerged. The listed heads are the live head SHAs verified from GitHub. The CI runs passed; for PR #42, CI tested code commit `ad31ca2` and a documentation-only commit was then added to record the outcome.

| PR | Upgrade branch / head SHA | CI run |
|---|---|---|
| [#38 Lighthouse 13](https://github.com/SHIV1804/Portfolio/pull/38) | `chore/upgrade-lighthouse-13` @ `40fcb8fef8ca3f358d8f00a55e5efa3cd3a8c160` | [40937913936 — passed](https://github.com/SHIV1804/Portfolio/actions/runs/40937913936) |
| [#39 Framer Motion 14](https://github.com/SHIV1804/Portfolio/pull/39) | `chore/upgrade-framer-motion-14` @ `7d8c9f616fc1511297715835bb9e08e987306391` | [40940889046 — passed](https://github.com/SHIV1804/Portfolio/actions/runs/40940889046) |
| [#40 Resolvers 6](https://github.com/SHIV1804/Portfolio/pull/40) | `chore/upgrade-hookform-resolvers-6` @ `dbb7b227760fa600b341ca9452ab618769a98c43` | [40941772607 — passed](https://github.com/SHIV1804/Portfolio/actions/runs/40941772607) |
| [#41 ESLint 10](https://github.com/SHIV1804/Portfolio/pull/41) | `chore/upgrade-eslint-10` @ `beeea2fe2defa170d70233a707947a697a884130` | [40943258369 — passed](https://github.com/SHIV1804/Portfolio/actions/runs/40943258369) |
| [#42 Prisma 7.10.1](https://github.com/SHIV1804/Portfolio/pull/42) | `chore/upgrade-prisma-7` @ `13a82e3c5de4b60fa4cb84f0c551861c78860d3e` | [41114978943 — passed](https://github.com/SHIV1804/Portfolio/actions/runs/41114978943) |

The original full CI runs exercised TypeScript, lint, build, and the complete Playwright suite. The successful run counts were respectively 210/1 skipped, 212/1, 210/1, 210/1, and 211/1. PR #42 additionally passed postinstall Prisma generation, explicit generation, disposable CI migrations, and its Auth.js adapter CRUD smoke test. `TASKS.md` and `DECISIONS.md` on the PR branches contain the actual audit deltas and CI output. The Auth.js v5 follow-up in each decision log says to remove the `@auth/core` override during the Auth.js v5 migration.

## 4. Stage 4 findings already verified

- Production deploy evidence points to `main`: the latest GitHub Production deployment points to SHA `c97b69a`, and the production migration workflow guard requires `refs/heads/main`.
- The Vercel project settings could not be viewed because the private dashboard redirected to login. In `main`, both `package-lock.json` and `pnpm-lock.yaml`/`pnpm-workspace.yaml` exist; `package.json` has no `packageManager` or `engines`, and there is no `vercel.json`. Therefore the actual Vercel package-manager/install command and Node setting remain unverified.
- Workflow run [40092064802](https://github.com/SHIV1804/Portfolio/actions/runs/40092064802), attempt 1, failed at the Neon backup step before migrations. The job log showed empty `NEON_API_KEY` and `NEON_PROJECT_ID` values and an HTTP 400 from the branch-create request. Current run state at verification: attempt 2, `waiting`, no conclusion. Do not rerun or modify this run.
- The live GitHub API returned 43 remote branches at close-out, rather than the 37 cited earlier. A read-only classifier identified the following 33 stale candidates. No remote branch was deleted:

```text
bisect-do-not-merge-terminal-history-fix
chore/migrate-workflow
chore/sync-main-into-dev
ci/pr-checks
content/assets
content/bio
content/bio-final
content/og-image
content/og-image-compressed
content/placeholder-projects
docs/project-context
docs/testing-policy
feature/post-deletion
fix/dsa-card-clickable
fix/launch-blockers
fix/max-sum-path
merge/main-into-dev
security/bisect-a-compatible
security/bisect-b
security/bisect-baseline
security/bisect-c
security/bisect-c-terminal-readiness
security/bisect-d-session-provider
security/bisect-next-1641
security/bisect-next-1642
security/bisect-prod-start
security/bisect-production
security/bisect-session-abort-cause
security/bisect-webpack
test/db-resilience-check
test/post-deletion-e2e
test/post-deletion-e2e-hardening
test/stabilize-e2e
```

## 5. Corrected handoff and ordered pending tasks

### Re-stack Stage 3 only after PR #37 merges

Wait for the owner to confirm PR #37 has merged into `security/dependency-upgrades`. Then rebase the branches one at a time as a stack, in this exact order:

1. `chore/upgrade-lighthouse-13` (PR #38), based on the updated `security/dependency-upgrades` branch.
2. `chore/upgrade-hookform-resolvers-6` (PR #40), based on `chore/upgrade-lighthouse-13`.
3. `chore/upgrade-framer-motion-14` (PR #39), based on `chore/upgrade-hookform-resolvers-6`.
4. `chore/upgrade-eslint-10` (PR #41), based on `chore/upgrade-framer-motion-14`.
5. `chore/upgrade-prisma-7` (PR #42), based on `chore/upgrade-eslint-10`.

Regenerate `package-lock.json` with `npm install`; never hand-edit the lockfile. Resolve `DECISIONS.md` and `TASKS.md` conflicts by preserving both sides. After each rebase, run `tsc`, lint, build, and the full Playwright suite in CI, report that branch's `npm audit` result, and update/push this context after the step. The final stack must have zero critical findings. Do not merge.

### Prisma 7 PR #42 follow-up

After the restack step is complete, finish these checks on PR #42 and keep validation isolated to disposable CI PostgreSQL:

- Remove the silent localhost fallback from `shared/lib/prisma.ts`. Fail loudly if `DATABASE_URL` is absent at runtime, while keeping Next build and CI working.
- Inventory every tracked `.js`, `.cjs`, and `.mjs` file and every package/workflow script affected by `"type": "module"`; run each relevant file/script and record real output.
- Ensure `prisma.config.ts` uses `DATABASE_URL_DIRECT` for direct migration connections, with any generation-safe fallback explicitly documented. Inspect `migrate-production.yml` for compatibility, but do not execute it or connect to Neon/production. Validate the config only with the disposable CI database.

### New dependency PRs after the stack is ready

- Create a separate TypeScript `5` → `6.0.3` PR off the completed stack after confirming official Next `16.4.3` support and the current `typescript-eslint` peer range; run full CI.
- For `@types/node`, wait for the owner to provide the Vercel Node version. Match that version with CI evidence before creating its separate PR. Do not guess.

### Stage 4 branch-retirement proposal

Report only. Before deleting any stale branch, propose renaming/tagging it as `archive/<name>` for owner review. Keep `security/bisect-session-abort-cause` until the abort cause is documented in `DECISIONS.md`. Do not rename or delete branches without explicit authorization.

### Handoff branch progress

This context file was created at `docs/handoff/MANUS_CONTEXT.md` on `docs/manus-handoff`, based on `main`, because no prior copy was found. Step 1 is the context-file push. Step 2 is pending the owner's PR #37 merge confirmation; no rebase has been performed.


### Execution update — 2026-10-31

- **Step 1 complete:** `docs/manus-handoff` was created from `main`; commit `fd7fbf0683c2cc3eb337cf78b17c7eba2dcdfd0b` contains `docs/handoff/MANUS_CONTEXT.md`. `git ls-remote origin refs/heads/docs/manus-handoff` returned the same SHA.
- **Step 2 intentionally held:** PR #37 was still open and unmerged when checked. No Stage 3 branch has been rebased. Resume the ordered re-stack only after the owner confirms PR #37 has merged into `security/dependency-upgrades`.
